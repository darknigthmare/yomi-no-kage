#!/usr/bin/env python3
"""Strict QA gate for genuinely authored FPS enemy directions.

This validator is intentionally stricter than ``validate-fps-enemies.py``.
The existing validator proves that the current projected banks are technically
clean.  This one proves that the six non-lateral views were independently
drawn and have traceable source art.

For each ``fpsDirections`` entry in ``AUTHORED_DIRECTIONS`` the forward-looking
metadata contract is:

* ``authoredDirection`` (or legacy alias ``authoredView``) is ``true``;
* ``sourceKind`` starts with ``authored-``;
* ``sourceAtlas`` (or legacy alias ``authoredSource``) is a project-relative
  path to the persisted source atlas;
* ``derivedFrom`` is absent, ``null`` or empty;
* provenance text contains no projection, mirror, fusion or synthesis marker.

The six source atlas files must also have different paths and SHA-256
digests.  Merely copying or renaming one source therefore cannot pass the gate.
Left/right remain part of the complete eight-direction runtime contract, but
only front, back and the four diagonals require independent authorship here.

Unit frame PNGs are regenerable and ignored by Git.  The versioned 6-cell
animation sheets are consequently the authoritative raster input for alpha,
baseline, silhouette and phase checks.

Default mode exits with status 1 while any debt remains.  ``--report-only``
keeps the same explicit FAIL report but exits 0 for inventory workflows.
No asset or metadata file is ever modified.
"""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from dataclasses import dataclass
import hashlib
import json
import math
from pathlib import Path
import re
from statistics import median
from typing import Any

from PIL import Image, ImageChops, ImageOps


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CHARACTER_ROOT = (
    PROJECT_ROOT / "assets" / "modular" / "fps" / "characters"
)
ANIMATIONS = ("idle", "move", "attack", "hurt", "death")
DIRECTIONS = (
    "front",
    "front-left",
    "left",
    "back-left",
    "back",
    "back-right",
    "right",
    "front-right",
)
AUTHORED_DIRECTIONS = (
    "front",
    "front-left",
    "back-left",
    "back",
    "back-right",
    "front-right",
)
FRAME_COUNT = 6
FORBIDDEN_PROVENANCE = re.compile(
    r"(?:"
    r"\bderived\b|\bderiv(?:ed|ation)\b|\bd[ée]riv(?:[ée]e?|ation)\b|"
    r"\bprojection\b|\bprojected\b|\breproject(?:ed|ion)?\b|"
    r"\bproj(?:et[ée]e?|ection)\b|"
    r"\bmirror(?:ed|ing)?\b|\bmiroir\b|"
    r"\bfusion(?:ed|n[ée]e?)?\b|\bsplice(?:d|ing)?\b|"
    r"\bprocedural(?:ly)?\b|\bsynthesi[sz](?:ed|e|ing)\b|"
    r"\bhalf[- ]?silhouette\b"
    r")",
    re.IGNORECASE,
)
VISIBLE_ALPHA = 16
SEMANTIC_CONSENSUS_LIMITS: dict[str, tuple[float, float]] = {
    "move": (0.78, 0.34),
    "attack": (0.80, 0.35),
    "hurt": (0.78, 0.35),
    "death": (0.94, 0.17),
}


@dataclass(frozen=True)
class FrameMetrics:
    rgba_hash: str
    mask_hash: str
    mirrored_mask_hash: str
    top: int
    bottom: int
    height: int
    geometry: tuple[float, float, float, float, float, float]


class Audit:
    def __init__(self, max_examples: int) -> None:
        self.max_examples = max_examples
        self.debt_counts: Counter[str] = Counter()
        self.examples: dict[str, list[dict[str, str]]] = defaultdict(list)
        self.character_codes: dict[str, set[str]] = defaultdict(set)

    def issue(
        self,
        code: str,
        character: str,
        subject: str,
        message: str,
    ) -> None:
        self.debt_counts[code] += 1
        self.character_codes[character].add(code)
        if len(self.examples[code]) < self.max_examples:
            self.examples[code].append(
                {
                    "subject": subject,
                    "message": message,
                }
            )

    @property
    def total(self) -> int:
        return sum(self.debt_counts.values())


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Audit strict des six vues FPS réellement dessinées."
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=DEFAULT_CHARACTER_ROOT,
        help="Racine assets/modular/fps/characters.",
    )
    parser.add_argument(
        "--only",
        action="append",
        default=[],
        metavar="ID",
        help="Limiter l'audit à un ou plusieurs identifiants exacts.",
    )
    parser.add_argument(
        "--max-examples",
        type=int,
        default=8,
        help="Nombre maximal d'exemples conservés par code de dette.",
    )
    parser.add_argument(
        "--report-only",
        action="store_true",
        help="Conserver le rapport FAIL mais retourner un code de sortie nul.",
    )
    return parser.parse_args()


def normalized_project_path(value: Any) -> Path | None:
    if not isinstance(value, str) or not value.strip():
        return None
    candidate = Path(value)
    if not candidate.is_absolute():
        candidate = PROJECT_ROOT / candidate
    try:
        resolved = candidate.resolve()
        resolved.relative_to(PROJECT_ROOT.resolve())
    except (OSError, ValueError):
        return None
    return resolved


def valid_socket(value: Any) -> bool:
    return (
        isinstance(value, list)
        and len(value) == 2
        and all(
            isinstance(coordinate, (int, float))
            and not isinstance(coordinate, bool)
            and math.isfinite(float(coordinate))
            and 0.0 <= float(coordinate) <= 1.0
            for coordinate in value
        )
    )


def has_transparent_rgb(image: Image.Image) -> bool:
    red, green, blue, alpha = image.split()
    rgb_nonzero = ImageChops.lighter(ImageChops.lighter(red, green), blue)
    fully_transparent = alpha.point(
        [255] + [0] * 255,
        mode="L",
    )
    return ImageChops.multiply(rgb_nonzero, fully_transparent).getbbox() is not None


def frame_metrics(
    cell: Image.Image,
    audit: Audit,
    character: str,
    subject: str,
) -> FrameMetrics | None:
    original_has_alpha = (
        "A" in cell.getbands()
        or "transparency" in getattr(cell, "info", {})
    )
    if not original_has_alpha:
        audit.issue(
            "raster_missing_alpha",
            character,
            subject,
            "la cellule PNG ne possède pas de canal alpha",
        )

    rgba = cell.convert("RGBA")
    alpha = rgba.getchannel("A")
    bounds = alpha.getbbox()
    minimum, maximum = alpha.getextrema()
    if not bounds or maximum == 0:
        audit.issue(
            "raster_empty_frame",
            character,
            subject,
            "la cellule ne contient aucun pixel visible",
        )
        return None
    if minimum != 0:
        audit.issue(
            "raster_no_transparency",
            character,
            subject,
            "la cellule ne contient aucune zone transparente",
        )
    if bounds[3] != rgba.height:
        audit.issue(
            "raster_baseline",
            character,
            subject,
            f"silhouette arrêtée à y={bounds[3]} au lieu de {rgba.height}",
        )
    if has_transparent_rgb(rgba):
        audit.issue(
            "raster_transparent_rgb",
            character,
            subject,
            "des couleurs RGB subsistent sous des pixels alpha=0",
        )

    mask = alpha.point([0] + [255] * 255, mode="L")
    mask_bytes = mask.tobytes()
    width, height = rgba.size
    points = [
        (index % width, index // width)
        for index, value in enumerate(alpha.tobytes())
        if value >= VISIBLE_ALPHA
    ]
    if not points:
        audit.issue(
            "raster_empty_visible_mask",
            character,
            subject,
            f"aucun pixel alpha>={VISIBLE_ALPHA}",
        )
        return None
    area = len(points)
    centroid_x = sum(x for x, _ in points) / area
    centroid_y = sum(y for _, y in points) / area
    spread_x = math.sqrt(
        sum((x - centroid_x) ** 2 for x, _ in points) / area
    )
    spread_y = math.sqrt(
        sum((y - centroid_y) ** 2 for _, y in points) / area
    )
    return FrameMetrics(
        rgba_hash=hashlib.sha256(rgba.tobytes()).hexdigest(),
        mask_hash=hashlib.sha256(mask_bytes).hexdigest(),
        mirrored_mask_hash=hashlib.sha256(
            ImageOps.mirror(mask).tobytes()
        ).hexdigest(),
        top=bounds[1],
        bottom=bounds[3],
        height=bounds[3] - bounds[1],
        geometry=(
            (bounds[3] - bounds[1]) / height,
            (bounds[2] - bounds[0]) / width,
            area / (width * height),
            centroid_y / height,
            spread_x / width,
            spread_y / height,
        ),
    )


def provenance_text(bank: dict[str, Any]) -> str:
    fields = (
        "source",
        "sourceKind",
        "authoredSource",
        "sourceAtlas",
        "authoringMethod",
        "generationMethod",
        "derivation",
        "pipeline",
        "transform",
    )
    return " ".join(
        str(bank.get(field, ""))
        for field in fields
        if bank.get(field) not in (None, "")
    )


def audit_authorship(
    audit: Audit,
    character: str,
    direction: str,
    bank: dict[str, Any],
    file_hash_cache: dict[Path, str],
) -> tuple[Path, str] | None:
    subject = f"{character}/{direction}"
    clean = True

    if (
        bank.get("authoredDirection") is not True
        and bank.get("authoredView") is not True
    ):
        audit.issue(
            "authored_flag_missing",
            character,
            subject,
            "authoredDirection=true est obligatoire",
        )
        clean = False

    source_kind = bank.get("sourceKind")
    if not isinstance(source_kind, str) or not source_kind.startswith("authored-"):
        audit.issue(
            "authored_source_kind",
            character,
            subject,
            "sourceKind doit commencer par authored-",
        )
        clean = False

    derived_from = bank.get("derivedFrom")
    if derived_from not in (None, [], ""):
        audit.issue(
            "authored_has_derivation",
            character,
            subject,
            f"derivedFrom doit être vide, reçu {derived_from!r}",
        )
        clean = False

    provenance = provenance_text(bank)
    forbidden_match = FORBIDDEN_PROVENANCE.search(provenance)
    if forbidden_match:
        audit.issue(
            "authored_forbidden_provenance",
            character,
            subject,
            f"provenance interdite détectée: {forbidden_match.group(0)!r}",
        )
        clean = False

    pixel_transforms = bank.get("pixelTransforms")
    if isinstance(pixel_transforms, dict):
        forbidden_transform_keys = (
            "fusion",
            "mirror",
            "projection",
            "interpolation",
            "phaseSynthesis",
        )
        enabled = [
            key
            for key in forbidden_transform_keys
            if pixel_transforms.get(key) is not False
        ]
        if enabled:
            audit.issue(
                "authored_forbidden_transform",
                character,
                subject,
                (
                    "les transformations interdites doivent être false: "
                    + ", ".join(enabled)
                ),
            )
            clean = False
    else:
        audit.issue(
            "authored_transform_attestation_missing",
            character,
            subject,
            "pixelTransforms doit attester fusion/mirror/projection=false",
        )
        clean = False

    if bank.get("weaponsBakedIntoBody") is not False:
        audit.issue(
            "authored_weapon_attestation_missing",
            character,
            subject,
            "weaponsBakedIntoBody=false est obligatoire sur la vue authored",
        )
        clean = False

    source_value = bank.get("sourceAtlas", bank.get("authoredSource"))
    source_path = normalized_project_path(source_value)
    if source_path is None:
        audit.issue(
            "authored_source_missing",
            character,
            subject,
            "sourceAtlas doit référencer un fichier du projet",
        )
        return None
    if not source_path.is_file():
        audit.issue(
            "authored_source_file_missing",
            character,
            subject,
            f"source authored introuvable: {source_value}",
        )
        return None

    if source_path not in file_hash_cache:
        file_hash_cache[source_path] = hashlib.sha256(
            source_path.read_bytes()
        ).hexdigest()
    declared_hash = bank.get("sourceSha256")
    if declared_hash != file_hash_cache[source_path]:
        audit.issue(
            "authored_source_digest_mismatch",
            character,
            subject,
            (
                "sourceSha256 absent ou différent du fichier "
                f"({file_hash_cache[source_path][:12]})"
            ),
        )
        clean = False
    if not clean:
        return source_path, file_hash_cache[source_path]
    return source_path, file_hash_cache[source_path]


def audit_weapon_rig(
    audit: Audit,
    character: str,
    direction: str,
    rig: Any,
) -> int:
    subject = f"{character}/{direction}"
    live_layer = (
        "behind-body"
        if direction in {"back-left", "back", "back-right"}
        else "front-body"
    )
    if not isinstance(rig, dict):
        audit.issue(
            "weapon_rig_direction_missing",
            character,
            subject,
            "rig directionnel absent",
        )
        return 0

    if rig.get("renderOrder") not in (None, ["body", "weapon"]):
        audit.issue(
            "weapon_rig_render_order",
            character,
            subject,
            "renderOrder directionnel doit être body puis weapon",
        )
    if rig.get("coordinateSpace") not in (None, "frame-normalized"):
        audit.issue(
            "weapon_rig_coordinate_space",
            character,
            subject,
            "coordinateSpace doit être frame-normalized",
        )

    validated = 0
    rig_animations = rig.get("animations")
    if not isinstance(rig_animations, dict):
        audit.issue(
            "weapon_rig_animations_missing",
            character,
            subject,
            "table animations du rig absente",
        )
        return 0

    for animation in ANIMATIONS:
        frames = rig_animations.get(animation)
        animation_subject = f"{subject}/{animation}"
        if not isinstance(frames, list) or len(frames) != FRAME_COUNT:
            audit.issue(
                "weapon_rig_frame_count",
                character,
                animation_subject,
                f"{FRAME_COUNT} sockets attendus",
            )
            continue
        for index, frame in enumerate(frames):
            frame_subject = f"{animation_subject}/{index:02d}"
            if not isinstance(frame, dict):
                audit.issue(
                    "weapon_rig_frame_invalid",
                    character,
                    frame_subject,
                    "métadonnées de socket absentes",
                )
                continue
            for field in ("primaryHand", "secondaryHand"):
                if not valid_socket(frame.get(field)):
                    audit.issue(
                        "weapon_rig_socket_invalid",
                        character,
                        frame_subject,
                        f"{field} doit être une paire normalisée",
                    )
            angle = frame.get("angle")
            if (
                not isinstance(angle, (int, float))
                or isinstance(angle, bool)
                or not math.isfinite(float(angle))
            ):
                audit.issue(
                    "weapon_rig_angle_invalid",
                    character,
                    frame_subject,
                    "angle d'arme invalide",
                )
            scale = frame.get("scale")
            if (
                not isinstance(scale, (int, float))
                or isinstance(scale, bool)
                or not math.isfinite(float(scale))
                or float(scale) < 0
            ):
                audit.issue(
                    "weapon_rig_scale_invalid",
                    character,
                    frame_subject,
                    "échelle d'arme invalide",
                )
            if animation == "death":
                if frame.get("layer") != "hidden" or scale != 0:
                    audit.issue(
                        "weapon_rig_death_visibility",
                        character,
                        frame_subject,
                        "l'arme doit être masquée à la mort",
                    )
            else:
                if frame.get("layer") != live_layer:
                    audit.issue(
                        "weapon_rig_layer",
                        character,
                        frame_subject,
                        (
                            "couche d'arme incohérente avec la vue "
                            f"{direction} (attendu {live_layer})"
                        ),
                    )
                if isinstance(scale, (int, float)) and float(scale) <= 0:
                    audit.issue(
                        "weapon_rig_scale_invalid",
                        character,
                        frame_subject,
                        "l'échelle visible doit être strictement positive",
                    )
            validated += 1
    return validated


def audit_direction_rasters(
    audit: Audit,
    character: str,
    direction: str,
    bank: dict[str, Any],
    frame_width: int,
    frame_height: int,
) -> tuple[dict[tuple[str, int], FrameMetrics], int, int]:
    metrics: dict[tuple[str, int], FrameMetrics] = {}
    animations = bank.get("animations")
    declared_frames = bank.get("frames")
    if not isinstance(animations, dict):
        audit.issue(
            "animation_map_missing",
            character,
            f"{character}/{direction}",
            "table animations absente",
        )
        return metrics, 0, 0
    if not isinstance(declared_frames, dict):
        audit.issue(
            "frame_map_missing",
            character,
            f"{character}/{direction}",
            "table frames absente",
        )
        declared_frames = {}

    sheet_count = 0
    declared_frame_count = 0
    for animation in ANIMATIONS:
        subject = f"{character}/{direction}/{animation}"
        frame_refs = declared_frames.get(animation)
        if not isinstance(frame_refs, list) or len(frame_refs) != FRAME_COUNT:
            audit.issue(
                "declared_frame_count",
                character,
                subject,
                f"{FRAME_COUNT} références de frame attendues",
            )
        else:
            declared_frame_count += len(frame_refs)

        sheet_value = animations.get(animation)
        sheet_path = normalized_project_path(sheet_value)
        if sheet_path is None or not sheet_path.is_file():
            audit.issue(
                "animation_sheet_missing",
                character,
                subject,
                f"planche introuvable: {sheet_value!r}",
            )
            continue
        try:
            with Image.open(sheet_path) as source:
                original_has_alpha = (
                    "A" in source.getbands() or "transparency" in source.info
                )
                sheet = source.convert("RGBA")
        except (OSError, ValueError) as error:
            audit.issue(
                "animation_sheet_unreadable",
                character,
                subject,
                str(error),
            )
            continue
        sheet_count += 1
        expected_size = (frame_width * FRAME_COUNT, frame_height)
        if sheet.size != expected_size:
            audit.issue(
                "animation_sheet_dimensions",
                character,
                subject,
                f"dimensions {sheet.size}, attendu {expected_size}",
            )
            continue
        if not original_has_alpha:
            audit.issue(
                "animation_sheet_missing_alpha",
                character,
                subject,
                "la planche PNG ne possède pas de canal alpha",
            )

        animation_hashes: list[str] = []
        for index in range(FRAME_COUNT):
            cell = sheet.crop(
                (
                    index * frame_width,
                    0,
                    (index + 1) * frame_width,
                    frame_height,
                )
            )
            frame_subject = f"{subject}/{index:02d}"
            frame = frame_metrics(cell, audit, character, frame_subject)
            if frame is not None:
                metrics[(animation, index)] = frame
                animation_hashes.append(frame.rgba_hash)
        if (
            len(animation_hashes) == FRAME_COUNT
            and len(set(animation_hashes)) != FRAME_COUNT
        ):
            audit.issue(
                "animation_duplicate_frames",
                character,
                subject,
                "les six poses ne sont pas visuellement distinctes",
            )

    return metrics, sheet_count, declared_frame_count


def semantic_distance_signature(
    metrics: dict[tuple[str, int], FrameMetrics],
    animation: str,
) -> list[float] | None:
    """Encode phase relationships without comparing camera-dependent scale."""

    values = [metrics.get((animation, index)) for index in range(FRAME_COUNT)]
    if any(value is None for value in values):
        return None
    vectors = [value.geometry for value in values if value is not None]
    channels: list[list[float]] = []
    for channel_index in range(len(vectors[0])):
        channel_values = [vector[channel_index] for vector in vectors]
        mean = sum(channel_values) / len(channel_values)
        deviation = math.sqrt(
            sum((value - mean) ** 2 for value in channel_values)
            / len(channel_values)
        )
        denominator = max(deviation, 0.005)
        channels.append(
            [(value - mean) / denominator for value in channel_values]
        )
    signature = [
        math.sqrt(
            sum(
                (channel[left_index] - channel[right_index]) ** 2
                for channel in channels
            )
            / len(channels)
        )
        for left_index in range(FRAME_COUNT)
        for right_index in range(left_index + 1, FRAME_COUNT)
    ]
    maximum = max(signature, default=0.0)
    if maximum <= 1e-9:
        return [0.0 for _ in signature]
    return [value / maximum for value in signature]


def cosine_similarity(left: list[float], right: list[float]) -> float:
    dot = sum(a * b for a, b in zip(left, right, strict=True))
    norm_left = math.sqrt(sum(value * value for value in left))
    norm_right = math.sqrt(sum(value * value for value in right))
    if norm_left <= 1e-9 or norm_right <= 1e-9:
        return 1.0 if norm_left <= 1e-9 and norm_right <= 1e-9 else 0.0
    return dot / (norm_left * norm_right)


def audit_phase_alignment(
    audit: Audit,
    character: str,
    direction_metrics: dict[str, dict[tuple[str, int], FrameMetrics]],
) -> int:
    checks = 0
    for animation, (minimum_cosine, maximum_mae) in (
        SEMANTIC_CONSENSUS_LIMITS.items()
    ):
        signatures = {
            direction: semantic_distance_signature(metrics, animation)
            for direction, metrics in direction_metrics.items()
            if direction in AUTHORED_DIRECTIONS
        }
        if set(signatures) != set(AUTHORED_DIRECTIONS) or any(
            signature is None for signature in signatures.values()
        ):
            continue
        ready_signatures = {
            direction: signature
            for direction, signature in signatures.items()
            if signature is not None
        }
        signature_length = len(next(iter(ready_signatures.values())))
        consensus = [
            median(
                ready_signatures[direction][index]
                for direction in AUTHORED_DIRECTIONS
            )
            for index in range(signature_length)
        ]
        for direction in AUTHORED_DIRECTIONS:
            signature = ready_signatures[direction]
            cosine = cosine_similarity(signature, consensus)
            mae = sum(
                abs(left - right)
                for left, right in zip(
                    signature,
                    consensus,
                    strict=True,
                )
            ) / len(consensus)
            if cosine < minimum_cosine or mae > maximum_mae:
                audit.issue(
                    "animation_phase_mismatch",
                    character,
                    f"{character}/{direction}/{animation}",
                    (
                        "ordre temporel différent du consensus des six vues "
                        f"(cos={cosine:.3f}/{minimum_cosine:.3f}, "
                        f"mae={mae:.3f}/{maximum_mae:.3f})"
                    ),
                )
            checks += 1
    return checks


def audit_silhouette_distinction(
    audit: Audit,
    character: str,
    direction_metrics: dict[str, dict[tuple[str, int], FrameMetrics]],
) -> int:
    checks = 0
    for animation in ANIMATIONS:
        for index in range(FRAME_COUNT):
            present = [
                (direction, direction_metrics.get(direction, {}).get((animation, index)))
                for direction in AUTHORED_DIRECTIONS
            ]
            present = [
                (direction, metric)
                for direction, metric in present
                if metric is not None
            ]
            for left_index, (left_direction, left_metric) in enumerate(present):
                for right_direction, right_metric in present[left_index + 1 :]:
                    checks += 1
                    subject = (
                        f"{character}/{animation}/{index:02d}/"
                        f"{left_direction}+{right_direction}"
                    )
                    if left_metric.mask_hash == right_metric.mask_hash:
                        audit.issue(
                            "silhouette_identical_across_directions",
                            character,
                            subject,
                            "deux directions authored ont exactement le même masque",
                        )
                    if (
                        left_metric.mirrored_mask_hash == right_metric.mask_hash
                        or right_metric.mirrored_mask_hash == left_metric.mask_hash
                    ):
                        audit.issue(
                            "silhouette_mirrored_across_directions",
                            character,
                            subject,
                            "une direction authored est le miroir exact de l'autre",
                        )
    return checks


def audit_character(
    audit: Audit,
    metadata_path: Path,
    file_hash_cache: dict[Path, str],
) -> dict[str, Any]:
    category = metadata_path.parent.parent.name
    character_id = metadata_path.parent.name
    character = f"{category}/{character_id}"
    try:
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        audit.issue(
            "metadata_unreadable",
            character,
            character,
            str(error),
        )
        return {
            "character": character,
            "directionBanks": 0,
            "authoredBanksReady": 0,
            "sheets": 0,
            "declaredFrames": 0,
            "weaponRigFrames": 0,
            "silhouetteComparisons": 0,
            "phaseChecks": 0,
        }

    frame_width = metadata.get("frameWidth")
    frame_height = metadata.get("frameHeight")
    if (
        not isinstance(frame_width, int)
        or not isinstance(frame_height, int)
        or frame_width <= 0
        or frame_height <= 0
    ):
        audit.issue(
            "metadata_frame_dimensions",
            character,
            character,
            "frameWidth/frameHeight doivent être des entiers positifs",
        )
        frame_width, frame_height = 96, 128

    if metadata.get("groundAnchor") != [0.5, 1.0]:
        audit.issue(
            "metadata_ground_anchor",
            character,
            character,
            "groundAnchor doit valoir [0.5, 1.0]",
        )
    if metadata.get("alphaMode") != "straight-transparent":
        audit.issue(
            "metadata_alpha_mode",
            character,
            character,
            "alphaMode doit valoir straight-transparent",
        )
    if metadata.get("weaponsBakedIntoBody") is not False:
        audit.issue(
            "weapon_baked_into_body",
            character,
            character,
            "weaponsBakedIntoBody doit être false",
        )
    if metadata.get("renderOrder") != ["body", "weapon"]:
        audit.issue(
            "weapon_render_order",
            character,
            character,
            "renderOrder doit être exactement [body, weapon]",
        )

    banks = metadata.get("fpsDirections")
    if not isinstance(banks, dict):
        audit.issue(
            "direction_map_missing",
            character,
            character,
            "fpsDirections absent",
        )
        banks = {}
    if tuple(banks.keys()) != DIRECTIONS:
        audit.issue(
            "direction_contract",
            character,
            character,
            (
                "ordre/couverture attendu: "
                + ", ".join(DIRECTIONS)
            ),
        )

    rigs = metadata.get("weaponRig", {}).get("directions", {})
    if not isinstance(rigs, dict):
        rigs = {}
        audit.issue(
            "weapon_rig_map_missing",
            character,
            character,
            "weaponRig.directions absent",
        )

    authored_sources: dict[str, tuple[Path, str]] = {}
    authored_banks_ready: set[str] = set()
    direction_metrics: dict[str, dict[tuple[str, int], FrameMetrics]] = {}
    sheet_count = 0
    declared_frame_count = 0
    rig_frame_count = 0

    for direction in DIRECTIONS:
        bank = banks.get(direction)
        if not isinstance(bank, dict):
            audit.issue(
                "direction_bank_missing",
                character,
                f"{character}/{direction}",
                "banque directionnelle absente",
            )
            continue
        if bank.get("direction") != direction:
            audit.issue(
                "direction_label_mismatch",
                character,
                f"{character}/{direction}",
                f"champ direction invalide: {bank.get('direction')!r}",
            )

        before_authorship = audit.total
        if direction in AUTHORED_DIRECTIONS:
            source = audit_authorship(
                audit,
                character,
                direction,
                bank,
                file_hash_cache,
            )
            if source is not None:
                authored_sources[direction] = source
            if audit.total == before_authorship:
                authored_banks_ready.add(direction)

        metrics, sheets, frames = audit_direction_rasters(
            audit,
            character,
            direction,
            bank,
            frame_width,
            frame_height,
        )
        direction_metrics[direction] = metrics
        sheet_count += sheets
        declared_frame_count += frames
        rig_frame_count += audit_weapon_rig(
            audit,
            character,
            direction,
            rigs.get(direction),
        )

    source_paths: dict[Path, list[str]] = defaultdict(list)
    source_hashes: dict[str, list[str]] = defaultdict(list)
    for direction, (source_path, source_hash) in authored_sources.items():
        source_paths[source_path].append(direction)
        source_hashes[source_hash].append(direction)
    for source_path, directions in source_paths.items():
        if len(directions) > 1:
            authored_banks_ready.difference_update(directions)
            audit.issue(
                "authored_source_path_reused",
                character,
                character,
                (
                    f"{source_path.relative_to(PROJECT_ROOT)} est partagé par "
                    + ", ".join(directions)
                ),
            )
    for source_hash, directions in source_hashes.items():
        if len(directions) > 1:
            authored_banks_ready.difference_update(directions)
            audit.issue(
                "authored_source_content_reused",
                character,
                character,
                (
                    f"même contenu source ({source_hash[:12]}) pour "
                    + ", ".join(directions)
                ),
            )

    silhouette_comparisons = audit_silhouette_distinction(
        audit,
        character,
        direction_metrics,
    )
    phase_checks = audit_phase_alignment(
        audit,
        character,
        direction_metrics,
    )

    return {
        "character": character,
        "directionBanks": sum(
            1 for direction in DIRECTIONS if isinstance(banks.get(direction), dict)
        ),
        "authoredBanksReady": len(authored_banks_ready),
        "authoredSourcesResolved": len(authored_sources),
        "sheets": sheet_count,
        "declaredFrames": declared_frame_count,
        "weaponRigFrames": rig_frame_count,
        "silhouetteComparisons": silhouette_comparisons,
        "phaseChecks": phase_checks,
    }


def main() -> int:
    args = parse_args()
    root = args.root
    if not root.is_absolute():
        root = (PROJECT_ROOT / root).resolve()
    metadata_paths = sorted(root.glob("*/*/sprite.json"))
    if args.only:
        selected = set(args.only)
        metadata_paths = [
            path for path in metadata_paths if path.parent.name in selected
        ]
    if not metadata_paths:
        print(
            json.dumps(
                {
                    "status": "ERROR",
                    "error": "aucun sprite.json FPS ennemi trouvé",
                    "root": str(root),
                    "only": args.only,
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 2

    audit = Audit(max(0, args.max_examples))
    file_hash_cache: dict[Path, str] = {}
    character_reports = [
        audit_character(audit, path, file_hash_cache)
        for path in metadata_paths
    ]
    characters = [report["character"] for report in character_reports]
    characters_with_debt = sorted(
        character
        for character in characters
        if audit.character_codes.get(character)
    )
    fully_authored_characters = sum(
        1
        for report in character_reports
        if report["authoredBanksReady"] == len(AUTHORED_DIRECTIONS)
        and report["character"] not in audit.character_codes
    )

    report = {
        "status": "PASS" if audit.total == 0 else "FAIL",
        "gate": "fps-authored-directions-v1",
        "contract": {
            "directions": list(DIRECTIONS),
            "independentlyAuthoredDirections": list(AUTHORED_DIRECTIONS),
            "animations": list(ANIMATIONS),
            "framesPerAnimation": FRAME_COUNT,
            "requiredAuthorshipFields": {
                "authoredDirection": True,
                "sourceKind": "authored-*",
                "sourceAtlas": "project-relative existing file",
                "sourceSha256": "exact SHA-256 of sourceAtlas",
                "derivedFrom": None,
                "pixelTransforms": {
                    "fusion": False,
                    "mirror": False,
                    "projection": False,
                    "interpolation": False,
                    "phaseSynthesis": False,
                },
                "weaponsBakedIntoBody": False,
            },
            "forbiddenProvenance": (
                "projection, mirror, fusion, splice, procedural or synthesized"
            ),
            "distinctSourceRule": "unique path and unique SHA-256 per authored view",
            "semanticPhaseConsensus": {
                animation: {
                    "minimumCosine": limits[0],
                    "maximumMae": limits[1],
                }
                for animation, limits in SEMANTIC_CONSENSUS_LIMITS.items()
            },
        },
        "summary": {
            "characters": len(character_reports),
            "charactersReady": fully_authored_characters,
            "charactersWithDebt": len(characters_with_debt),
            "directionBanksChecked": sum(
                report["directionBanks"] for report in character_reports
            ),
            "authoredBanksRequired": (
                len(character_reports) * len(AUTHORED_DIRECTIONS)
            ),
            "authoredBanksReady": sum(
                report["authoredBanksReady"] for report in character_reports
            ),
            "authoredSourcesResolved": sum(
                report["authoredSourcesResolved"] for report in character_reports
            ),
            "animationSheetsChecked": sum(
                report["sheets"] for report in character_reports
            ),
            "logicalFramesChecked": sum(
                report["declaredFrames"] for report in character_reports
            ),
            "weaponRigFramesChecked": sum(
                report["weaponRigFrames"] for report in character_reports
            ),
            "silhouetteComparisons": sum(
                report["silhouetteComparisons"] for report in character_reports
            ),
            "phaseChecks": sum(
                report["phaseChecks"] for report in character_reports
            ),
            "totalDebtItems": audit.total,
        },
        "debtCounts": dict(sorted(audit.debt_counts.items())),
        "examples": dict(sorted(audit.examples.items())),
        "charactersWithDebt": characters_with_debt,
        "reportOnly": bool(args.report_only),
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if audit.total and not args.report_only:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
