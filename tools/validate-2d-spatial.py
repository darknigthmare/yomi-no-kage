#!/usr/bin/env python3
"""Validate the authored 2D spatial contract for Yomi no Kage.

The runtime level source is JavaScript, so this validator asks Node to export
``KageLevels`` as JSON.  Everything else is inspected directly with JSON and
Pillow: environment registries/manifests provide sprite metadata, while the
PNG alpha channel establishes the real visible ground contact.

The validator is intentionally read-only.  It never rewrites level data,
anchors, manifests, or sprites.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import subprocess
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

try:
    from PIL import Image, UnidentifiedImageError
except ImportError as exc:  # pragma: no cover - dependency failure is explicit.
    raise SystemExit(
        "Pillow is required: install it before running tools/validate-2d-spatial.py"
    ) from exc


ALPHA_THRESHOLD = 32
RUNTIME_ALPHA_THRESHOLD = 18
CONTACT_BAND_RATIO = 0.025
MIN_GROUND_CONTACT_RATIO = 0.06
BOTTOM_PADDING_RATIO = 0.025
MAX_BOTTOM_PADDING_PX = 8
BASELINE_TOLERANCE_PX = 1.0
MIN_GROUND_ANCHOR_Y = 0.85
GROUND_ANCHOR_BASE_WINDOW_RATIO = 0.08
GROUND_ANCHOR_X_MARGIN_RATIO = 0.02
DETAIL_LIMIT_PER_CODE = 8

# ``drawSideBackdrop`` has a deliberate default path for outdoor scenes and
# named implementations for the courtyard plus the two castle interiors.
SUPPORTED_BACKDROP_PROFILES = {
    None,
    "",
    "castle-courtyard",
    "castle-residence",
    "castle-side-residence",
    "castle-donjon",
    "castle-side-donjon",
}

# Wall coverage is measured on the playable horizontal span, not the nominal
# file width.  Interiors need a substantially more continuous wall plane than
# outdoor streets, where openings, gates, houses, and alleys are expected.
WALL_RULES = {
    "outdoor": {"minimum_coverage": 0.42, "maximum_gap": 360.0},
    "building": {"minimum_coverage": 0.65, "maximum_gap": 220.0},
    "castle": {"minimum_coverage": 0.55, "maximum_gap": 260.0},
}

ALLOWED_LAYERS = {"back", "world", "front"}
WALL_PREFIXES = ("mur-", "angle-ruelle-")
WALL_SPRITE_ROOT = Path(
    "assets/modular/environments/kurokawa/alley-walls/sprites"
)


@dataclass(frozen=True)
class Issue:
    zone: str
    code: str
    subject: str
    message: str


@dataclass
class AssetRecord:
    path: Path
    anchor: Any = None
    metadata_sources: tuple[str, ...] = ()


@dataclass(frozen=True)
class AlphaMetrics:
    width: int
    height: int
    bbox: tuple[int, int, int, int]
    bottom_padding: int
    bottom_padding_limit: int
    contact_ratio: float
    contact_min_x: int
    contact_max_x: int


class ValidationSetupError(RuntimeError):
    """The contract could not be evaluated because required input is invalid."""


def finite_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ValidationSetupError(f"missing JSON input: {path}") from exc
    except json.JSONDecodeError as exc:
        raise ValidationSetupError(
            f"invalid JSON input {path}:{exc.lineno}:{exc.colno}: {exc.msg}"
        ) from exc


def export_levels(root: Path, level_data: Path) -> dict[str, Any]:
    """Load the CommonJS level module without trying to parse JavaScript."""

    script = (
        "const path=require('path');"
        "const loaded=require(path.resolve(process.argv[1]));"
        "if(!loaded.KageLevels) throw new Error('KageLevels export missing');"
        "process.stdout.write(JSON.stringify(loaded.KageLevels));"
    )
    try:
        result = subprocess.run(
            ["node", "-e", script, str(level_data)],
            cwd=root,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=30,
        )
    except FileNotFoundError as exc:
        raise ValidationSetupError("Node.js is required to export level-data.js") from exc
    except subprocess.TimeoutExpired as exc:
        raise ValidationSetupError("Node.js timed out while exporting level-data.js") from exc

    if result.returncode:
        detail = result.stderr.strip() or f"exit {result.returncode}"
        raise ValidationSetupError(f"could not export level-data.js: {detail}")
    try:
        exported = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise ValidationSetupError(
            f"Node returned invalid level JSON: {exc.msg}"
        ) from exc
    if not isinstance(exported.get("areas"), dict):
        raise ValidationSetupError("KageLevels.areas must be an object")
    return exported


def metadata_anchor(entry: dict[str, Any]) -> Any:
    """Accept the two explicit names used by current and planned manifests."""

    if entry.get("groundAnchor") is not None:
        return entry["groundAnchor"]
    return entry.get("anchor")


def build_asset_index(root: Path) -> dict[str, list[AssetRecord]]:
    """Index runtime props and wall sprites by their authored file identifier."""

    records_by_path: dict[Path, AssetRecord] = {}

    def add_record(path: Path, entry: dict[str, Any], source: Path) -> None:
        resolved = path.resolve()
        current = records_by_path.get(resolved)
        anchor = metadata_anchor(entry)
        source_label = source.relative_to(root).as_posix()
        if current is None:
            records_by_path[resolved] = AssetRecord(
                path=resolved,
                anchor=anchor,
                metadata_sources=(source_label,),
            )
            return
        if current.anchor is None and anchor is not None:
            current.anchor = anchor
        if source_label not in current.metadata_sources:
            current.metadata_sources += (source_label,)

    registry_path = root / "assets/modular/registry.json"
    registry = read_json(registry_path)
    for entry in registry.get("environments", []):
        if entry.get("type") != "prop" or not entry.get("file"):
            continue
        add_record(root / entry["file"], entry, registry_path)

    environment_root = root / "assets/modular/environments"
    for manifest_path in environment_root.rglob("manifest.json"):
        manifest = read_json(manifest_path)
        sprites = manifest.get("sprites")
        if not isinstance(sprites, list):
            continue
        for entry in sprites:
            if not isinstance(entry, dict) or not entry.get("file"):
                continue
            add_record(manifest_path.parent / entry["file"], entry, manifest_path)

    index: dict[str, list[AssetRecord]] = defaultdict(list)
    for record in records_by_path.values():
        index[record.path.stem].append(record)
    return dict(index)


def resolve_asset(
    root: Path,
    index: dict[str, list[AssetRecord]],
    file_id: Any,
) -> tuple[AssetRecord | None, str | None]:
    if not isinstance(file_id, str) or not file_id.strip():
        return None, "prop file identifier is missing"

    authored = Path(file_id)
    direct_path = (root / authored).resolve()
    if authored.suffix.lower() == ".png" and direct_path.exists():
        candidates = [
            candidate
            for candidate in index.get(authored.stem, [])
            if candidate.path == direct_path
        ]
        return (
            candidates[0]
            if candidates
            else AssetRecord(path=direct_path, metadata_sources=("direct path",))
        ), None

    candidates = index.get(authored.stem, [])
    existing = [candidate for candidate in candidates if candidate.path.exists()]
    if len(existing) == 1:
        return existing[0], None
    if not existing:
        return None, f"no PNG indexed for '{file_id}'"
    choices = ", ".join(
        candidate.path.relative_to(root).as_posix() for candidate in existing
    )
    return None, f"ambiguous sprite id '{file_id}': {choices}"


def alpha_metrics(path: Path) -> AlphaMetrics:
    try:
        with Image.open(path) as source:
            image = source.convert("RGBA")
    except (FileNotFoundError, UnidentifiedImageError, OSError) as exc:
        raise ValidationSetupError(f"cannot inspect sprite {path}: {exc}") from exc

    alpha = image.getchannel("A")
    opaque = alpha.point(lambda value: 255 if value >= ALPHA_THRESHOLD else 0)
    bbox = opaque.getbbox()
    if bbox is None:
        raise ValidationSetupError(f"sprite has no opaque pixels: {path}")

    x0, y0, x1, y1 = bbox
    visible_width = max(1, x1 - x0)
    visible_height = max(1, y1 - y0)
    band_height = max(1, math.ceil(visible_height * CONTACT_BAND_RATIO))
    band_top = max(y0, y1 - band_height)
    pixels = alpha.load()
    contact_columns = [
        x
        for x in range(x0, x1)
        if any(pixels[x, y] >= ALPHA_THRESHOLD for y in range(band_top, y1))
    ]
    if not contact_columns:
        # This is theoretically unreachable because bbox includes its last row,
        # but keeping it explicit makes corrupt alpha handling deterministic.
        contact_min_x = x0
        contact_max_x = x0
        contact_ratio = 0.0
    else:
        contact_min_x = min(contact_columns)
        contact_max_x = max(contact_columns)
        contact_ratio = len(contact_columns) / visible_width

    bottom_padding = image.height - y1
    bottom_padding_limit = min(
        MAX_BOTTOM_PADDING_PX,
        max(2, math.ceil(image.height * BOTTOM_PADDING_RATIO)),
    )
    return AlphaMetrics(
        width=image.width,
        height=image.height,
        bbox=bbox,
        bottom_padding=bottom_padding,
        bottom_padding_limit=bottom_padding_limit,
        contact_ratio=contact_ratio,
        contact_min_x=contact_min_x,
        contact_max_x=contact_max_x,
    )


def runtime_primary_ground_bounds(path: Path) -> tuple[int, int, int, int]:
    """Mirror the runtime's principal alpha-band crop for file:// fallbacks."""
    with Image.open(path) as source:
        image = source.convert("RGBA")
    width, height = image.size
    pixels = image.getchannel("A").load()

    def strongest_band(counts: list[int]) -> tuple[int, int] | None:
        bands: list[tuple[int, int, int]] = []
        start: int | None = None
        last_opaque: int | None = None
        score = 0
        for index in range(len(counts) + 1):
            count = counts[index] if index < len(counts) else 0
            if count > 0:
                if start is None:
                    start = index
                last_opaque = index
                score += count
            elif (
                start is not None
                and last_opaque is not None
                and (index == len(counts) or index - last_opaque > 2)
            ):
                bands.append((score, last_opaque - start + 1, start))
                start = None
                last_opaque = None
                score = 0
        if not bands:
            return None
        _, length, start = max(
            bands,
            key=lambda band: (band[0], band[1], -band[2]),
        )
        return start, start + length

    rows = [
        sum(
            pixels[x, y] >= RUNTIME_ALPHA_THRESHOLD
            for x in range(width)
        )
        for y in range(height)
    ]
    vertical = strongest_band(rows)
    if vertical is None:
        raise ValidationSetupError(f"no runtime alpha band in {path}")
    y_start, y_end = vertical
    columns = [
        sum(
            pixels[x, y] >= RUNTIME_ALPHA_THRESHOLD
            for y in range(y_start, y_end)
        )
        for x in range(width)
    ]
    horizontal = strongest_band(columns)
    if horizontal is None:
        raise ValidationSetupError(f"no runtime alpha columns in {path}")
    x_start, x_end = horizontal
    opaque_points = [
        (x, y)
        for y in range(y_start, y_end)
        for x in range(x_start, x_end)
        if pixels[x, y] >= RUNTIME_ALPHA_THRESHOLD
    ]
    if not opaque_points:
        raise ValidationSetupError(f"no runtime alpha points in {path}")
    min_x = min(point[0] for point in opaque_points)
    max_x = max(point[0] for point in opaque_points)
    min_y = min(point[1] for point in opaque_points)
    max_y = max(point[1] for point in opaque_points)
    crop_x = max(0, min_x - 1)
    crop_y = max(0, min_y - 1)
    crop_right = min(width, max_x + 2)
    crop_bottom = min(height, max_y + 1)
    return (
        crop_x,
        crop_y,
        max(1, crop_right - crop_x),
        max(1, crop_bottom - crop_y),
    )


def validate_runtime_wall_fallbacks(root: Path) -> tuple[list[Issue], int]:
    game_source = (root / "game.js").read_text(encoding="utf-8")
    block = re.search(
        r"const ALLEY_WALL_GROUND_BOUNDS = Object\.freeze\(\{(.*?)\}\);",
        game_source,
        re.DOTALL,
    )
    if block is None:
        return [
            Issue(
                "runtime-file",
                "fallback.missing",
                "ALLEY_WALL_GROUND_BOUNDS",
                "runtime file fallback map is absent",
            )
        ], 0
    authored = {
        match.group(1): tuple(int(match.group(index)) for index in range(2, 6))
        for match in re.finditer(
            r'"([^"]+)":\s*\[(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\]',
            block.group(1),
        )
    }
    issues: list[Issue] = []
    wall_root = root / WALL_SPRITE_ROOT
    wall_paths = sorted(
        path
        for path in wall_root.glob("*.png")
        if path.stem.startswith(WALL_PREFIXES)
    )
    for path in wall_paths:
        expected = runtime_primary_ground_bounds(path)
        actual = authored.get(path.stem)
        if actual != expected:
            issues.append(
                Issue(
                    "runtime-file",
                    "fallback.crop",
                    path.stem,
                    f"authored crop {actual!r} differs from alpha crop {expected!r}",
                )
            )
    known_ids = {path.stem for path in wall_paths}
    for extra in sorted(set(authored) - known_ids):
        issues.append(
            Issue(
                "runtime-file",
                "fallback.orphan",
                extra,
                "fallback has no matching alley-wall PNG",
            )
        )
    return issues, len(authored)


def resolved_anchor(prop: dict[str, Any], asset: AssetRecord) -> Any:
    placed = metadata_anchor(prop)
    return placed if placed is not None else asset.anchor


def validate_anchor(
    zone: str,
    prop: dict[str, Any],
    asset: AssetRecord,
    metrics: AlphaMetrics,
) -> list[Issue]:
    subject = str(prop.get("id") or prop.get("file") or "<unnamed prop>")
    anchor = resolved_anchor(prop, asset)
    if anchor is None:
        return [
            Issue(
                zone,
                "anchor.missing",
                subject,
                f"{prop.get('file')}: no placement or asset ground anchor",
            )
        ]
    if (
        not isinstance(anchor, (list, tuple))
        or len(anchor) != 2
        or not all(finite_number(value) for value in anchor)
    ):
        return [
            Issue(
                zone,
                "anchor.invalid",
                subject,
                f"{prop.get('file')}: anchor must be two finite normalized numbers, got {anchor!r}",
            )
        ]

    anchor_x, anchor_y = (float(anchor[0]), float(anchor[1]))
    if not (0.0 <= anchor_x <= 1.0 and 0.0 <= anchor_y <= 1.0):
        return [
            Issue(
                zone,
                "anchor.invalid",
                subject,
                f"{prop.get('file')}: anchor {anchor!r} is outside normalized [0, 1]",
            )
        ]

    issues: list[Issue] = []
    opaque_base_y = metrics.bbox[3] / metrics.height
    minimum_ground_y = max(
        MIN_GROUND_ANCHOR_Y,
        opaque_base_y - GROUND_ANCHOR_BASE_WINDOW_RATIO,
    )
    if anchor_y < minimum_ground_y:
        issues.append(
            Issue(
                zone,
                "anchor.not_on_ground",
                subject,
                (
                    f"{prop.get('file')}: anchor y={anchor_y:.4f} is above the "
                    f"ground-anchor window {minimum_ground_y:.4f}..1.0000"
                ),
            )
        )

    authored_x = anchor_x * metrics.width
    horizontal_margin = metrics.width * GROUND_ANCHOR_X_MARGIN_RATIO
    if not (
        metrics.bbox[0] - horizontal_margin
        <= authored_x
        <= metrics.bbox[2] + horizontal_margin
    ):
        issues.append(
            Issue(
                zone,
                "anchor.outside_sprite",
                subject,
                (
                    f"{prop.get('file')}: anchor x={authored_x:.1f}px is outside "
                    f"opaque horizontal bounds {metrics.bbox[0]}..{metrics.bbox[2]}px"
                ),
            )
        )
    return issues


def validate_ground_sprite(
    zone: str,
    prop: dict[str, Any],
    metrics: AlphaMetrics,
) -> list[Issue]:
    subject = str(prop.get("id") or prop.get("file") or "<unnamed prop>")
    issues: list[Issue] = []
    if metrics.bottom_padding > metrics.bottom_padding_limit:
        issues.append(
            Issue(
                zone,
                "ground.padding",
                subject,
                (
                    f"{prop.get('file')}: {metrics.bottom_padding}px transparent "
                    f"below opaque base; limit is {metrics.bottom_padding_limit}px"
                ),
            )
        )
    if metrics.contact_ratio < MIN_GROUND_CONTACT_RATIO:
        issues.append(
            Issue(
                zone,
                "ground.contact",
                subject,
                (
                    f"{prop.get('file')}: bottom contact covers only "
                    f"{metrics.contact_ratio:.1%} of visible width; minimum is "
                    f"{MIN_GROUND_CONTACT_RATIO:.1%}"
                ),
            )
        )
    return issues


def validate_spatial_fields(
    zone: str,
    prop: dict[str, Any],
    depth_bands: dict[str, Any],
) -> list[Issue]:
    subject = str(prop.get("id") or prop.get("file") or "<unnamed prop>")
    issues: list[Issue] = []
    layer = prop.get("layer")
    if layer not in ALLOWED_LAYERS:
        issues.append(
            Issue(
                zone,
                "layer.invalid",
                subject,
                f"layer must be one of {sorted(ALLOWED_LAYERS)}, got {layer!r}",
            )
        )

    band_id = prop.get("depthBand")
    band = depth_bands.get(band_id)
    if not isinstance(band, dict):
        issues.append(
            Issue(
                zone,
                "depth_band.invalid",
                subject,
                f"unknown or missing depthBand {band_id!r}",
            )
        )
        return issues

    expected_layer = band.get("layer")
    if layer in ALLOWED_LAYERS and layer != expected_layer:
        issues.append(
            Issue(
                zone,
                "layer.depth_mismatch",
                subject,
                f"layer {layer!r} conflicts with {band_id!r} layer {expected_layer!r}",
            )
        )

    bottom_y = prop.get("bottomY")
    expected_bottom = band.get("baselineY")
    if not finite_number(bottom_y):
        issues.append(
            Issue(
                zone,
                "bottom_y.invalid",
                subject,
                f"bottomY must be finite, got {bottom_y!r}",
            )
        )
    elif finite_number(expected_bottom) and abs(float(bottom_y) - float(expected_bottom)) > BASELINE_TOLERANCE_PX:
        issues.append(
            Issue(
                zone,
                "bottom_y.band_mismatch",
                subject,
                (
                    f"bottomY={float(bottom_y):g} conflicts with {band_id!r} "
                    f"baselineY={float(expected_bottom):g}"
                ),
            )
        )

    baseline_y = prop.get("baselineY")
    if not finite_number(baseline_y):
        issues.append(
            Issue(
                zone,
                "baseline_y.invalid",
                subject,
                f"baselineY must be finite, got {baseline_y!r}",
            )
        )
    elif finite_number(bottom_y) and abs(float(baseline_y) - float(bottom_y)) > BASELINE_TOLERANCE_PX:
        issues.append(
            Issue(
                zone,
                "baseline_y.bottom_mismatch",
                subject,
                f"baselineY={baseline_y:g} and bottomY={bottom_y:g} disagree",
            )
        )
    return issues


def is_wall_prop(prop: dict[str, Any]) -> bool:
    file_id = str(prop.get("file") or "").lower()
    return file_id.startswith(WALL_PREFIXES)


def merge_intervals(
    intervals: Iterable[tuple[float, float]],
) -> list[tuple[float, float]]:
    merged: list[list[float]] = []
    for start, end in sorted(intervals):
        if end <= start:
            continue
        if not merged or start > merged[-1][1]:
            merged.append([start, end])
        else:
            merged[-1][1] = max(merged[-1][1], end)
    return [(start, end) for start, end in merged]


def validate_wall_coverage(zone: str, area: dict[str, Any]) -> list[Issue]:
    zone_kind = str(area.get("zoneKind") or "outdoor")
    rule = WALL_RULES.get(zone_kind, WALL_RULES["outdoor"])
    minimum = float(area.get("minX", 0))
    maximum = float(area.get("maxX", area.get("width", 0)))
    span = maximum - minimum
    if span <= 0:
        return [
            Issue(
                zone,
                "walls.bounds",
                zone,
                f"invalid playable span {minimum:g}..{maximum:g}",
            )
        ]

    intervals: list[tuple[float, float]] = []
    wall_count = 0
    for prop in area.get("props", []):
        if not is_wall_prop(prop):
            continue
        wall_count += 1
        x = prop.get("x")
        width = prop.get("width")
        scale = prop.get("perspectiveScale", 1)
        if not all(finite_number(value) for value in (x, width, scale)):
            continue
        rendered_width = float(width) * float(scale)
        rendered_x = float(x) - (rendered_width - float(width)) / 2
        start = max(minimum, rendered_x)
        end = min(maximum, rendered_x + rendered_width)
        if end > start:
            intervals.append((start, end))

    merged = merge_intervals(intervals)
    if not merged:
        return [
            Issue(
                zone,
                "walls.missing",
                zone,
                "no wall module covers the playable route",
            )
        ]

    covered = sum(end - start for start, end in merged)
    coverage = covered / span
    gaps: list[tuple[float, float]] = []
    cursor = minimum
    for start, end in merged:
        if start > cursor:
            gaps.append((cursor, start))
        cursor = max(cursor, end)
    if cursor < maximum:
        gaps.append((cursor, maximum))
    widest_gap = max(gaps, key=lambda pair: pair[1] - pair[0], default=(minimum, minimum))
    widest_gap_size = widest_gap[1] - widest_gap[0]

    issues: list[Issue] = []
    if coverage < rule["minimum_coverage"]:
        issues.append(
            Issue(
                zone,
                "walls.coverage",
                zone,
                (
                    f"{wall_count} wall modules cover {coverage:.1%} of playable "
                    f"span; minimum for {zone_kind} is {rule['minimum_coverage']:.1%}"
                ),
            )
        )
    if widest_gap_size > rule["maximum_gap"]:
        issues.append(
            Issue(
                zone,
                "walls.gap",
                zone,
                (
                    f"widest uncovered wall gap is {widest_gap_size:.1f}px "
                    f"({widest_gap[0]:.1f}..{widest_gap[1]:.1f}); maximum for "
                    f"{zone_kind} is {rule['maximum_gap']:.1f}px"
                ),
            )
        )
    return issues


def validate_backdrop(zone: str, area: dict[str, Any]) -> list[Issue]:
    profile = area.get("backdropProfile")
    if profile not in SUPPORTED_BACKDROP_PROFILES:
        supported = ", ".join(
            repr(value)
            for value in sorted(
                (value for value in SUPPORTED_BACKDROP_PROFILES if value),
            )
        )
        return [
            Issue(
                zone,
                "backdrop.unsupported",
                zone,
                f"backdropProfile {profile!r} is unsupported; supported named profiles: {supported}",
            )
        ]
    return []


def validate(
    root: Path,
    levels: dict[str, Any],
    selected_zones: set[str] | None,
) -> tuple[list[Issue], dict[str, int]]:
    asset_index = build_asset_index(root)
    depth_bands = (
        levels.get("visualStandards", {}).get("depthBands", {})
    )
    if not isinstance(depth_bands, dict) or not depth_bands:
        raise ValidationSetupError("visualStandards.depthBands is missing")

    areas = levels["areas"]
    if selected_zones:
        unknown = sorted(selected_zones - set(areas))
        if unknown:
            raise ValidationSetupError(f"unknown zone(s): {', '.join(unknown)}")
        areas = {
            zone: area
            for zone, area in areas.items()
            if zone in selected_zones
        }

    issues: list[Issue] = []
    image_cache: dict[Path, AlphaMetrics] = {}
    stats = {
        "zones": len(areas),
        "props": 0,
        "sprites": 0,
        "walls": 0,
        "fallbacks": 0,
    }
    fallback_issues, stats["fallbacks"] = validate_runtime_wall_fallbacks(root)
    issues.extend(fallback_issues)

    for zone, area in areas.items():
        issues.extend(validate_backdrop(zone, area))
        issues.extend(validate_wall_coverage(zone, area))
        for prop in area.get("props", []):
            stats["props"] += 1
            if is_wall_prop(prop):
                stats["walls"] += 1
            subject = str(prop.get("id") or prop.get("file") or "<unnamed prop>")
            issues.extend(validate_spatial_fields(zone, prop, depth_bands))

            asset, resolution_error = resolve_asset(root, asset_index, prop.get("file"))
            if resolution_error or asset is None:
                issues.append(
                    Issue(
                        zone,
                        "asset.unresolved",
                        subject,
                        resolution_error or "asset resolution failed",
                    )
                )
                continue
            if asset.path not in image_cache:
                image_cache[asset.path] = alpha_metrics(asset.path)
            metrics = image_cache[asset.path]
            stats["sprites"] = len(image_cache)
            issues.extend(validate_ground_sprite(zone, prop, metrics))
            issues.extend(validate_anchor(zone, prop, asset, metrics))

    return issues, stats


def print_report(issues: list[Issue], stats: dict[str, int]) -> None:
    print("YOMI NO KAGE - VALIDATION SPATIALE 2D")
    print(
        "Contrat: contact alpha, ancre au sol, profondeur/couche, "
        "continuite des murs et profil de fond."
    )
    print(
        f"Analyse: {stats['zones']} zones, {stats['props']} placements, "
        f"{stats['sprites']} sprites uniques, {stats['walls']} modules de mur, "
        f"{stats['fallbacks']} recadrages file://."
    )

    by_zone: dict[str, list[Issue]] = defaultdict(list)
    for issue in issues:
        by_zone[issue.zone].append(issue)

    for zone in sorted(by_zone):
        zone_issues = by_zone[zone]
        print(f"\n[ECHEC] {zone} - {len(zone_issues)} erreur(s)")
        by_code: dict[str, list[Issue]] = defaultdict(list)
        for issue in zone_issues:
            by_code[issue.code].append(issue)
        for code in sorted(by_code):
            code_issues = by_code[code]
            print(f"  {code} ({len(code_issues)})")
            for issue in code_issues[:DETAIL_LIMIT_PER_CODE]:
                print(f"    - {issue.subject}: {issue.message}")
            hidden = len(code_issues) - DETAIL_LIMIT_PER_CODE
            if hidden > 0:
                print(f"    - ... {hidden} autre(s) erreur(s) de ce type")

    counts = Counter(issue.code for issue in issues)
    print("\nRESUME")
    if issues:
        print(f"  ECHEC: {len(issues)} erreur(s)")
        for code, count in sorted(counts.items()):
            print(f"  - {code}: {count}")
    else:
        print("  OK: aucun ecart au contrat spatial 2D")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate Yomi no Kage 2D prop grounding and wall coherence."
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="Project root (defaults to the parent of tools/).",
    )
    parser.add_argument(
        "--level-data",
        type=Path,
        default=Path("level-data.js"),
        help="Level module path, relative to --root by default.",
    )
    parser.add_argument(
        "--zone",
        action="append",
        default=[],
        help="Validate only this zone; may be repeated.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = args.root.resolve()
    level_data = args.level_data
    if not level_data.is_absolute():
        level_data = root / level_data
    try:
        levels = export_levels(root, level_data.resolve())
        issues, stats = validate(
            root,
            levels,
            set(args.zone) if args.zone else None,
        )
    except ValidationSetupError as exc:
        print(f"ERREUR VALIDATEUR: {exc}", file=sys.stderr)
        return 2

    print_report(issues, stats)
    return 1 if issues else 0


if __name__ == "__main__":
    raise SystemExit(main())
