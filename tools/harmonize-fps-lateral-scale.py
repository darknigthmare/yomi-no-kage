#!/usr/bin/env python3
"""Harmonize oversized FPS left/right banks against six authored views.

The six banks whose ``authoredDirection`` flag is exactly ``true`` are the
immutable scale reference.  The original left/right canonical sheets are read
from a versioned, checksummed ``lateral-pristine-v1`` archive, cropped into
their declared animation phases, resized with one shared left/right
nearest-neighbour factor *per phase*, and placed on a transparent 96x128
canvas around the bottom-centre ground anchor. Normal planning never reads
lateral input pixels from Git or the mutable runtime worktree.

Before the first apply, ``--capture-pristine-from <revision>`` captures that
archive transactionally from an explicit Git revision. Existing archive bytes
are accepted only when the complete manifest and every checksum match; a
different archive is never overwritten.

No source atlas or metadata is edited.  No frame is mirrored, fused, projected,
interpolated, reordered, or synthesized.  Apply mode stages every replacement
before performing atomic file swaps and rolls the complete selection back if a
write or verification fails.  ``--check`` performs the same planning and pixel
comparison without writing anything.

Examples:

    py tools/harmonize-fps-lateral-scale.py --check \
      --categories regular special \
      --ids r05-kome-porter r06-yama-woodcutter s01-kusa-shinobi

    py tools/harmonize-fps-lateral-scale.py \
      --categories regular --ids r05-kome-porter

    py tools/harmonize-fps-lateral-scale.py \
      --capture-pristine-from HEAD --categories regular \
      --ids r05-kome-porter
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
import hashlib
from io import BytesIO
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
from statistics import median
from typing import Any, Iterable
from uuid import uuid4

from PIL import Image, UnidentifiedImageError


ROOT = Path(__file__).resolve().parents[1]
FPS_CHARACTER_ROOT = ROOT / "assets" / "modular" / "fps" / "characters"
AUTHORING_SOURCE_DIRNAME = "sources-authored-six-way-v1"
PRISTINE_DIRNAME = "lateral-pristine-v1"
PRISTINE_MANIFEST_NAME = "manifest.json"
PRISTINE_SCHEMA = 1
PRISTINE_KIND = "fps-lateral-pristine-v1"
ANIMATIONS = ("idle", "move", "attack", "hurt", "death")
LIVE_ANIMATIONS = ("idle", "move", "attack", "hurt")
AUTHORED_DIRECTIONS = (
    "front",
    "front-left",
    "back-left",
    "back",
    "back-right",
    "front-right",
)
LATERAL_DIRECTIONS = ("left", "right")
FRAME_WIDTH = 96
FRAME_HEIGHT = 128
FRAME_COUNT = 6
SHEET_SIZE = (FRAME_WIDTH * FRAME_COUNT, FRAME_HEIGHT)
TOP_MARGIN = 2
VISIBLE_ALPHA = 16
MIN_SCALE = 0.50
MAX_SCALE = 1.0
# Once the robust paired scale is within 2% of unity, another nearest-neighbour
# pass would only introduce rounding drift. Treat that range as converged so
# repeated --check/apply runs are pixel-idempotent.
NO_OP_SCALE = 0.98
# Each semantic phase is constrained against the median of the six authored
# views. The selected phase factor is still shared by left and right.
MIN_PHASE_HEIGHT_RATIO = 0.83
MAX_PHASE_HEIGHT_RATIO = 1.18
MIN_PHASE_BBOX_AREA_RATIO = 0.72
MAX_PHASE_BBOX_AREA_RATIO = 1.25
# The measured boxes use integer pixels after nearest-neighbour resampling.
# Allow one small quantisation step around the authored target interval so the
# safety report reflects geometry rather than unavoidable sub-pixel rounding.
PHASE_HEIGHT_ROUNDING_TOLERANCE = 0.025
PHASE_BBOX_AREA_ROUNDING_TOLERANCE = 0.02
MAX_DIMENSION_SCALE_DISAGREEMENT = 1.50
# Per-animation poses can be deliberately much wider than their authored
# directional counterparts (notably shinobi movement). Keep a finite guard,
# but allow that legitimate silhouette variation without falling back to a
# character-wide factor.
MAX_ANIMATION_DIMENSION_SCALE_DISAGREEMENT = 1.75
MAX_LATERAL_ASYMMETRY = 1.25
ROBUST_Z_LIMIT = 3.5
REPORT_PATH_LIMIT = 80


class HarmonizeContractError(ValueError):
    """Raised when a character cannot be transformed without guessing."""


@dataclass(frozen=True)
class Geometry:
    width: int
    height: int
    left: int
    top: int
    right: int
    bottom: int


@dataclass(frozen=True)
class BankFrames:
    direction: str
    sheets: dict[str, Path]
    frame_paths: dict[str, tuple[Path, ...]]
    frames: dict[str, tuple[Image.Image, ...]]


@dataclass
class CharacterPlan:
    category: str
    character_id: str
    sprite_path: Path
    factors: dict[str, tuple[float, ...]]
    expected: dict[Path, Image.Image]
    stale_paths: list[Path]
    missing_paths: list[Path]
    report: dict[str, Any]
    protected_hashes: dict[Path, str]


@dataclass(frozen=True)
class PristineCapturePlan:
    category: str
    character_id: str
    archive_root: Path
    expected: dict[Path, bytes]
    already_current: bool
    sprite_hash: str
    report: dict[str, Any]


def relative(path: Path) -> str:
    try:
        return path.relative_to(ROOT).as_posix()
    except ValueError:
        return str(path)


def read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise HarmonizeContractError(f"metadata absent: {relative(path)}") from error
    except json.JSONDecodeError as error:
        raise HarmonizeContractError(
            f"JSON invalide dans {relative(path)}: ligne {error.lineno}, "
            f"colonne {error.colno}"
        ) from error
    if not isinstance(value, dict):
        raise HarmonizeContractError(f"{relative(path)} doit contenir un objet JSON")
    return value


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def resolve_asset(value: Any, character_folder: Path, field: str) -> Path:
    if not isinstance(value, str) or not value:
        raise HarmonizeContractError(f"{field}: chemin relatif PNG requis")
    declared = Path(value)
    if declared.is_absolute():
        raise HarmonizeContractError(f"{field}: chemin absolu interdit")
    resolved = (ROOT / declared).resolve()
    try:
        resolved.relative_to(character_folder.resolve())
    except ValueError as error:
        raise HarmonizeContractError(
            f"{field}: le chemin sort du personnage ({relative(resolved)})"
        ) from error
    if resolved.suffix.lower() != ".png":
        raise HarmonizeContractError(f"{field}: seule une destination PNG est permise")
    return resolved


def load_png(path: Path, field: str) -> Image.Image:
    try:
        with Image.open(path) as source:
            if source.format != "PNG":
                raise HarmonizeContractError(f"{field}: le fichier n'est pas un PNG")
            source.load()
            image = source.convert("RGBA")
    except FileNotFoundError as error:
        raise HarmonizeContractError(f"{field}: fichier absent ({relative(path)})") from error
    except (OSError, UnidentifiedImageError) as error:
        raise HarmonizeContractError(
            f"{field}: PNG illisible ({relative(path)}: {error})"
        ) from error
    if image.size != SHEET_SIZE:
        image.close()
        raise HarmonizeContractError(
            f"{field}: dimensions {image.size}, attendu {SHEET_SIZE}"
        )
    return image


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def git_bytes(revision: str, path: Path, field: str) -> bytes:
    """Read one tracked file from an explicit revision without checkout."""
    repository_path = relative(path)
    try:
        completed = subprocess.run(
            ["git", "-C", str(ROOT), "show", f"{revision}:{repository_path}"],
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except OSError as error:
        raise HarmonizeContractError(
            f"{field}: impossible d'executer git show ({error})"
        ) from error
    if completed.returncode != 0:
        detail = completed.stderr.decode("utf-8", errors="replace").strip()
        raise HarmonizeContractError(
            f"{field}: source Git {revision} indisponible ({repository_path}: {detail})"
        )
    return completed.stdout


def resolve_git_revision(revision: str) -> str:
    try:
        completed = subprocess.run(
            ["git", "-C", str(ROOT), "rev-parse", "--verify", f"{revision}^{{commit}}"],
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
    except OSError as error:
        raise HarmonizeContractError(
            f"revision Git {revision}: impossible d'executer git ({error})"
        ) from error
    resolved = completed.stdout.strip()
    if completed.returncode != 0 or len(resolved) != 40:
        detail = completed.stderr.strip()
        raise HarmonizeContractError(
            f"revision Git invalide {revision!r}: {detail or 'commit introuvable'}"
        )
    return resolved


def decode_png_bytes(value: bytes, field: str) -> Image.Image:
    try:
        with Image.open(BytesIO(value)) as source:
            if source.format != "PNG":
                raise HarmonizeContractError(f"{field}: contenu non PNG")
            source.load()
            image = source.convert("RGBA")
    except (OSError, UnidentifiedImageError) as error:
        raise HarmonizeContractError(f"{field}: PNG illisible ({error})") from error
    if image.size != SHEET_SIZE:
        image.close()
        raise HarmonizeContractError(
            f"{field}: dimensions {image.size}, attendu {SHEET_SIZE}"
        )
    return image


def pristine_root(character_folder: Path) -> Path:
    return (
        character_folder
        / AUTHORING_SOURCE_DIRNAME
        / PRISTINE_DIRNAME
    )


def load_pristine_index(
    character_folder: Path,
    sprite: dict[str, Any],
    category: str,
    character_id: str,
) -> tuple[dict[tuple[str, str], Path], str]:
    archive_root = pristine_root(character_folder)
    manifest_path = archive_root / PRISTINE_MANIFEST_NAME
    manifest = read_json(manifest_path)
    if manifest.get("schema") != PRISTINE_SCHEMA or manifest.get("kind") != PRISTINE_KIND:
        raise HarmonizeContractError(
            f"archive pristine incompatible: {relative(manifest_path)}"
        )
    if manifest.get("character") != {"category": category, "id": character_id}:
        raise HarmonizeContractError(
            f"archive pristine attribuee au mauvais personnage: {relative(manifest_path)}"
        )
    if manifest.get("canvas") != [FRAME_WIDTH, FRAME_HEIGHT]:
        raise HarmonizeContractError("archive pristine: canvas invalide")
    if manifest.get("sheetSize") != list(SHEET_SIZE):
        raise HarmonizeContractError("archive pristine: sheetSize invalide")
    if manifest.get("frameCount") != FRAME_COUNT:
        raise HarmonizeContractError("archive pristine: frameCount invalide")
    revision = manifest.get("sourceRevision")
    if (
        not isinstance(revision, str)
        or len(revision) != 40
        or any(character not in "0123456789abcdef" for character in revision.lower())
    ):
        raise HarmonizeContractError("archive pristine: sourceRevision invalide")
    entries = manifest.get("entries")
    if not isinstance(entries, list) or len(entries) != len(LATERAL_DIRECTIONS) * len(ANIMATIONS):
        raise HarmonizeContractError("archive pristine: exactement 10 entrees requises")

    banks = sprite.get("fpsDirections")
    if not isinstance(banks, dict):
        raise HarmonizeContractError("fpsDirections doit etre un objet")
    index: dict[tuple[str, str], Path] = {}
    declared_files = {manifest_path.resolve()}
    for entry in entries:
        if not isinstance(entry, dict):
            raise HarmonizeContractError("archive pristine: entree non objet")
        direction = entry.get("direction")
        animation = entry.get("animation")
        key = (direction, animation)
        if direction not in LATERAL_DIRECTIONS or animation not in ANIMATIONS:
            raise HarmonizeContractError(f"archive pristine: cle invalide {key}")
        if key in index:
            raise HarmonizeContractError(f"archive pristine: doublon {key}")
        bank = banks.get(direction)
        animations = bank.get("animations") if isinstance(bank, dict) else None
        runtime_value = animations.get(animation) if isinstance(animations, dict) else None
        runtime_path = resolve_asset(
            runtime_value,
            character_folder,
            f"fpsDirections.{direction}.{animation}.sheet",
        )
        if entry.get("runtimePath") != relative(runtime_path):
            raise HarmonizeContractError(
                f"archive pristine {direction}/{animation}: runtimePath divergent"
            )
        archive_path = (archive_root / direction / f"{animation}.png").resolve()
        if entry.get("archivePath") != relative(archive_path):
            raise HarmonizeContractError(
                f"archive pristine {direction}/{animation}: archivePath divergent"
            )
        try:
            archive_path.relative_to(archive_root.resolve())
        except ValueError as error:
            raise HarmonizeContractError("archive pristine: chemin hors archive") from error
        expected_hash = entry.get("sha256")
        if not isinstance(expected_hash, str) or len(expected_hash) != 64:
            raise HarmonizeContractError(
                f"archive pristine {direction}/{animation}: sha256 invalide"
            )
        if not archive_path.is_file() or sha256(archive_path) != expected_hash:
            raise HarmonizeContractError(
                f"archive pristine {direction}/{animation}: fichier absent ou checksum divergent"
            )
        index[key] = archive_path
        declared_files.add(archive_path)
    expected_keys = {
        (direction, animation)
        for direction in LATERAL_DIRECTIONS
        for animation in ANIMATIONS
    }
    if set(index) != expected_keys:
        raise HarmonizeContractError("archive pristine: couverture direction/animation incomplete")
    actual_files = {path.resolve() for path in archive_root.rglob("*") if path.is_file()}
    if actual_files != declared_files:
        raise HarmonizeContractError("archive pristine: fichiers non declares presents")
    return index, revision


def build_pristine_capture_plan(
    category: str,
    sprite_path: Path,
    resolved_revision: str,
) -> PristineCapturePlan:
    character_id = sprite_path.parent.name
    character_folder = sprite_path.parent
    sprite = read_json(sprite_path)
    if sprite.get("view") != "fps-enemy-directional":
        raise HarmonizeContractError("view doit etre fps-enemy-directional")
    banks = sprite.get("fpsDirections")
    if not isinstance(banks, dict):
        raise HarmonizeContractError("fpsDirections doit etre un objet")
    archive_root = pristine_root(character_folder)
    expected: dict[Path, bytes] = {}
    manifest_entries: list[dict[str, str]] = []
    for direction in LATERAL_DIRECTIONS:
        bank = banks.get(direction)
        animations = bank.get("animations") if isinstance(bank, dict) else None
        if not isinstance(animations, dict):
            raise HarmonizeContractError(
                f"fpsDirections.{direction}.animations doit etre un objet"
            )
        for animation in ANIMATIONS:
            runtime_path = resolve_asset(
                animations.get(animation),
                character_folder,
                f"fpsDirections.{direction}.{animation}.sheet",
            )
            content = git_bytes(
                resolved_revision,
                runtime_path,
                f"capture pristine {direction}/{animation}",
            )
            decoded = decode_png_bytes(
                content, f"capture pristine {direction}/{animation}"
            )
            decoded.close()
            archive_path = archive_root / direction / f"{animation}.png"
            expected[archive_path] = content
            manifest_entries.append(
                {
                    "direction": direction,
                    "animation": animation,
                    "runtimePath": relative(runtime_path),
                    "archivePath": relative(archive_path),
                    "sha256": sha256_bytes(content),
                }
            )
    manifest = {
        "schema": PRISTINE_SCHEMA,
        "kind": PRISTINE_KIND,
        "character": {"category": category, "id": character_id},
        "sourceRevision": resolved_revision,
        "canvas": [FRAME_WIDTH, FRAME_HEIGHT],
        "sheetSize": list(SHEET_SIZE),
        "frameCount": FRAME_COUNT,
        "entries": manifest_entries,
    }
    manifest_bytes = (
        json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    ).encode("utf-8")
    expected[archive_root / PRISTINE_MANIFEST_NAME] = manifest_bytes

    already_current = False
    if archive_root.exists():
        if not archive_root.is_dir():
            raise HarmonizeContractError(
                f"archive pristine occupee par un fichier: {relative(archive_root)}"
            )
        actual_paths = {path for path in archive_root.rglob("*") if path.is_file()}
        if actual_paths != set(expected):
            raise HarmonizeContractError(
                f"archive pristine existante incomplete ou differente; refus d'ecraser "
                f"{relative(archive_root)}"
            )
        mismatched = [
            relative(path)
            for path, content in expected.items()
            if path.read_bytes() != content
        ]
        if mismatched:
            raise HarmonizeContractError(
                "archive pristine existante differente; refus d'ecraser: "
                + ", ".join(mismatched)
            )
        already_current = True
    return PristineCapturePlan(
        category=category,
        character_id=character_id,
        archive_root=archive_root,
        expected=expected,
        already_current=already_current,
        sprite_hash=sha256(sprite_path),
        report={
            "category": category,
            "id": character_id,
            "archiveRoot": relative(archive_root),
            "sourceRevision": resolved_revision,
            "sheets": len(LATERAL_DIRECTIONS) * len(ANIMATIONS),
            "manifest": relative(archive_root / PRISTINE_MANIFEST_NAME),
            "alreadyCurrent": already_current,
        },
    )


def alpha_bbox(image: Image.Image, threshold: int) -> tuple[int, int, int, int] | None:
    alpha = image.getchannel("A")
    try:
        if threshold <= 0:
            return alpha.getbbox()
        mask = alpha.point(lambda value: 255 if value >= threshold else 0)
        try:
            return mask.getbbox()
        finally:
            mask.close()
    finally:
        alpha.close()


def geometry(image: Image.Image, context: str, threshold: int = VISIBLE_ALPHA) -> Geometry:
    box = alpha_bbox(image, threshold)
    if box is None:
        raise HarmonizeContractError(f"{context}: frame transparente")
    left, top, right, bottom = box
    if right <= left or bottom <= top:
        raise HarmonizeContractError(f"{context}: géométrie alpha vide")
    return Geometry(
        width=right - left,
        height=bottom - top,
        left=left,
        top=top,
        right=right,
        bottom=bottom,
    )


def robust_median(values: Iterable[float], context: str) -> float:
    samples = [float(value) for value in values if math.isfinite(float(value))]
    if not samples:
        raise HarmonizeContractError(f"{context}: aucun échantillon valide")
    centre = float(median(samples))
    deviations = [abs(value - centre) for value in samples]
    mad = float(median(deviations))
    if mad <= 1e-12:
        return centre
    robust_sigma = 1.4826 * mad
    kept = [
        value
        for value in samples
        if abs(value - centre) <= ROBUST_Z_LIMIT * robust_sigma
    ]
    # A pathological distribution must not silently collapse to a tiny subset.
    if len(kept) < max(3, math.ceil(len(samples) * 0.60)):
        kept = samples
    return float(median(kept))


def image_equal(expected: Image.Image, path: Path) -> bool:
    try:
        with Image.open(path) as current_source:
            current_source.load()
            current = current_source.convert("RGBA")
    except (FileNotFoundError, OSError, UnidentifiedImageError):
        return False
    try:
        return current.size == expected.size and current.tobytes() == expected.tobytes()
    finally:
        current.close()


def load_bank(
    sprite: dict[str, Any],
    character_folder: Path,
    direction: str,
    *,
    pristine_index: dict[tuple[str, str], Path] | None = None,
) -> BankFrames:
    banks = sprite.get("fpsDirections")
    if not isinstance(banks, dict):
        raise HarmonizeContractError("fpsDirections doit être un objet")
    bank = banks.get(direction)
    if not isinstance(bank, dict):
        raise HarmonizeContractError(f"fpsDirections.{direction}: banque absente")
    animations = bank.get("animations")
    declared_frames = bank.get("frames")
    if not isinstance(animations, dict) or not isinstance(declared_frames, dict):
        raise HarmonizeContractError(
            f"fpsDirections.{direction}: animations et frames doivent être déclarés"
        )

    sheets: dict[str, Path] = {}
    frame_paths: dict[str, tuple[Path, ...]] = {}
    frames: dict[str, tuple[Image.Image, ...]] = {}
    for animation in ANIMATIONS:
        prefix = f"fpsDirections.{direction}.{animation}"
        sheet_path = resolve_asset(
            animations.get(animation), character_folder, f"{prefix}.sheet"
        )
        entries = declared_frames.get(animation)
        if not isinstance(entries, list) or len(entries) != FRAME_COUNT:
            raise HarmonizeContractError(
                f"{prefix}.frames: exactement {FRAME_COUNT} chemins requis"
            )
        destinations = tuple(
            resolve_asset(entry, character_folder, f"{prefix}.frames[{index}]")
            for index, entry in enumerate(entries)
        )
        if len(set(destinations)) != FRAME_COUNT:
            raise HarmonizeContractError(f"{prefix}.frames: chemins dupliqués")
        input_path = (
            pristine_index[(direction, animation)]
            if pristine_index is not None
            else sheet_path
        )
        sheet = load_png(input_path, f"{prefix}.sheet")
        try:
            animation_frames = tuple(
                sheet.crop(
                    (
                        index * FRAME_WIDTH,
                        0,
                        (index + 1) * FRAME_WIDTH,
                        FRAME_HEIGHT,
                    )
                )
                for index in range(FRAME_COUNT)
            )
        finally:
            sheet.close()
        for index, frame in enumerate(animation_frames):
            geometry(frame, f"{prefix}[{index}]")
        sheets[animation] = sheet_path
        frame_paths[animation] = destinations
        frames[animation] = animation_frames
    return BankFrames(
        direction=direction,
        sheets=sheets,
        frame_paths=frame_paths,
        frames=frames,
    )


def close_banks(banks: Iterable[BankFrames]) -> None:
    for bank in banks:
        for animation_frames in bank.frames.values():
            for frame in animation_frames:
                frame.close()


def phase_geometry(
    banks: Iterable[BankFrames],
) -> dict[tuple[str, int], list[Geometry]]:
    result: dict[tuple[str, int], list[Geometry]] = {}
    for animation in ANIMATIONS:
        for index in range(FRAME_COUNT):
            result[(animation, index)] = [
                geometry(
                    bank.frames[animation][index],
                    f"{bank.direction}/{animation}/{index:02d}",
                )
                for bank in banks
            ]
    return result


def animation_metric_summary(
    banks: Iterable[BankFrames], animation: str
) -> dict[str, float | int]:
    frames = [frame for bank in banks for frame in bank.frames[animation]]
    visible = [geometry(frame, f"metric-summary/{animation}") for frame in frames]
    full: list[Geometry] = []
    for frame in frames:
        box = alpha_bbox(frame, 1)
        if box is None:
            raise HarmonizeContractError(
                f"metric-summary/{animation}: frame alpha vide"
            )
        full.append(Geometry(box[2] - box[0], box[3] - box[1], *box))
    return {
        "samples": len(visible),
        "medianVisibleHeight": round(
            robust_median((item.height for item in visible), f"{animation} height"),
            4,
        ),
        "medianVisibleWidth": round(
            robust_median((item.width for item in visible), f"{animation} width"),
            4,
        ),
        "maxAlphaHeight": max(item.height for item in full),
        "maxAlphaWidth": max(item.width for item in full),
        "minimumTopGap": min(item.top for item in full),
        "maximumAlphaBottom": max(item.bottom for item in full),
    }


def output_phase_ratio_summary(
    reference_banks: list[BankFrames],
    output_banks: list[BankFrames],
) -> dict[str, list[dict[str, Any]]]:
    result: dict[str, list[dict[str, Any]]] = {}
    for animation in ANIMATIONS:
        phases: list[dict[str, Any]] = []
        for index in range(FRAME_COUNT):
            reference = [
                geometry(
                    bank.frames[animation][index],
                    f"actual-ratio/reference/{animation}/{index:02d}",
                )
                for bank in reference_banks
            ]
            output = [
                geometry(
                    bank.frames[animation][index],
                    f"actual-ratio/output/{animation}/{index:02d}",
                )
                for bank in output_banks
            ]
            reference_height = robust_median(
                (item.height for item in reference),
                f"actual-ratio/{animation}/{index:02d}/reference-height",
            )
            output_height = robust_median(
                (item.height for item in output),
                f"actual-ratio/{animation}/{index:02d}/output-height",
            )
            reference_area = robust_median(
                (item.width * item.height for item in reference),
                f"actual-ratio/{animation}/{index:02d}/reference-area",
            )
            output_area = robust_median(
                (item.width * item.height for item in output),
                f"actual-ratio/{animation}/{index:02d}/output-area",
            )
            height_ratio = output_height / reference_height
            area_ratio = output_area / reference_area
            phases.append(
                {
                    "phase": index,
                    "height": round(height_ratio, 6),
                    "bboxArea": round(area_ratio, 6),
                    "withinTargets": (
                        MIN_PHASE_HEIGHT_RATIO - PHASE_HEIGHT_ROUNDING_TOLERANCE
                        <= height_ratio
                        <= MAX_PHASE_HEIGHT_RATIO + PHASE_HEIGHT_ROUNDING_TOLERANCE
                        and MIN_PHASE_BBOX_AREA_RATIO - PHASE_BBOX_AREA_ROUNDING_TOLERANCE
                        <= area_ratio
                        <= MAX_PHASE_BBOX_AREA_RATIO + PHASE_BBOX_AREA_ROUNDING_TOLERANCE
                    ),
                }
            )
        result[animation] = phases
    return result


def metric_summary(banks: Iterable[BankFrames]) -> dict[str, float | int]:
    frames = [
        frame
        for bank in banks
        for animation in LIVE_ANIMATIONS
        for frame in bank.frames[animation]
    ]
    visible = [geometry(frame, "metric-summary") for frame in frames]
    full = []
    for frame in frames:
        box = alpha_bbox(frame, 1)
        if box is None:
            raise HarmonizeContractError("metric-summary: frame alpha vide")
        full.append(Geometry(box[2] - box[0], box[3] - box[1], *box))
    return {
        "samples": len(visible),
        "medianVisibleHeight": round(
            robust_median((item.height for item in visible), "median height"), 4
        ),
        "medianVisibleWidth": round(
            robust_median((item.width for item in visible), "median width"), 4
        ),
        "maxAlphaHeight": max(item.height for item in full),
        "maxAlphaWidth": max(item.width for item in full),
        "minimumTopGap": min(item.top for item in full),
        "maximumAlphaBottom": max(item.bottom for item in full),
    }


def scale_frame(image: Image.Image, factor: float, context: str) -> Image.Image:
    box = alpha_bbox(image, 1)
    if box is None:
        raise HarmonizeContractError(f"{context}: frame alpha vide")
    crop = image.crop(box)
    try:
        width = max(1, int(math.floor(crop.width * factor + 0.5)))
        height = max(1, int(math.floor(crop.height * factor + 0.5)))
        if width > FRAME_WIDTH or height > FRAME_HEIGHT - TOP_MARGIN:
            raise HarmonizeContractError(
                f"{context}: sortie {width}x{height} hors canvas sécurisé"
            )
        resized = crop.resize((width, height), Image.Resampling.NEAREST)
    finally:
        crop.close()
    # Nearest-neighbour can legitimately skip the only non-transparent sample
    # on an extreme source edge while reducing. Trim the resized result once
    # more so the *actual* silhouette, rather than its pre-resize rectangle,
    # owns the bottom-centre anchor. This is a translation only; it cannot
    # reorder, synthesize, blend, or clip animation pixels.
    resized_box = alpha_bbox(resized, 1)
    if resized_box is None:
        resized.close()
        raise HarmonizeContractError(f"{context}: le redimensionnement a effacé la frame")
    if resized_box != (0, 0, resized.width, resized.height):
        trimmed = resized.crop(resized_box)
        resized.close()
        resized = trimmed
        width, height = resized.size
    if width > FRAME_WIDTH or height > FRAME_HEIGHT - TOP_MARGIN:
        resized.close()
        raise HarmonizeContractError(
            f"{context}: silhouette {width}x{height} hors canvas sécurisé"
        )
    canvas = Image.new("RGBA", (FRAME_WIDTH, FRAME_HEIGHT), (0, 0, 0, 0))
    x = (FRAME_WIDTH - width) // 2
    y = FRAME_HEIGHT - height
    canvas.paste(resized, (x, y))
    resized.close()
    output_box = alpha_bbox(canvas, 1)
    if output_box is None:
        canvas.close()
        raise HarmonizeContractError(f"{context}: le redimensionnement a effacé la frame")
    if output_box[1] < TOP_MARGIN or output_box[3] != FRAME_HEIGHT:
        canvas.close()
        raise HarmonizeContractError(
            f"{context}: baseline ou marge haute non préservée ({output_box})"
        )
    return canvas


def build_sheet(frames: tuple[Image.Image, ...]) -> Image.Image:
    sheet = Image.new("RGBA", SHEET_SIZE, (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.paste(frame, (index * FRAME_WIDTH, 0))
    return sheet


def ratio(value: float, reference: float) -> float:
    return round(value / reference, 6)


def collect_protected_hashes(
    sprite_path: Path,
    character_folder: Path,
    sprite: dict[str, Any],
) -> dict[Path, str]:
    protected = {sprite_path: sha256(sprite_path)}
    banks = sprite.get("fpsDirections")
    if isinstance(banks, dict):
        for direction in AUTHORED_DIRECTIONS:
            bank = banks.get(direction)
            if not isinstance(bank, dict):
                continue
            source_atlas = bank.get("sourceAtlas")
            if not isinstance(source_atlas, str) or not source_atlas:
                continue
            path = resolve_asset(
                source_atlas,
                character_folder,
                f"fpsDirections.{direction}.sourceAtlas",
            )
            if not path.is_file():
                raise HarmonizeContractError(
                    f"fpsDirections.{direction}.sourceAtlas absent: {relative(path)}"
                )
            protected[path] = sha256(path)
    return protected


def calculate_phase_factors(
    reference_banks: list[BankFrames],
    lateral_banks: list[BankFrames],
) -> tuple[
    dict[str, tuple[float, ...]],
    dict[str, dict[str, Any]],
    dict[str, dict[str, Any]],
]:
    """Return six constrained phase factors per animation, shared L/R."""
    reference_phases = phase_geometry(reference_banks)
    lateral_phases = phase_geometry(lateral_banks)
    factors: dict[str, tuple[float, ...]] = {}
    inputs: dict[str, dict[str, Any]] = {}
    summaries: dict[str, dict[str, Any]] = {}
    for animation in ANIMATIONS:
        height_logs: list[float] = []
        width_logs: list[float] = []
        phase_metrics: list[dict[str, float]] = []
        for index in range(FRAME_COUNT):
            phase = (animation, index)
            reference_height = robust_median(
                (item.height for item in reference_phases[phase]),
                f"{phase} reference height",
            )
            reference_width = robust_median(
                (item.width for item in reference_phases[phase]),
                f"{phase} reference width",
            )
            lateral_height = robust_median(
                (item.height for item in lateral_phases[phase]),
                f"{phase} lateral height",
            )
            lateral_width = robust_median(
                (item.width for item in lateral_phases[phase]),
                f"{phase} lateral width",
            )
            reference_area = robust_median(
                (item.width * item.height for item in reference_phases[phase]),
                f"{phase} reference bbox area",
            )
            lateral_area = robust_median(
                (item.width * item.height for item in lateral_phases[phase]),
                f"{phase} lateral bbox area",
            )
            height_logs.append(math.log(reference_height / lateral_height))
            width_logs.append(math.log(reference_width / lateral_width))
            phase_metrics.append(
                {
                    "referenceHeight": reference_height,
                    "lateralHeight": lateral_height,
                    "referenceArea": reference_area,
                    "lateralArea": lateral_area,
                }
            )

        height_factor = math.exp(
            robust_median(height_logs, f"{animation} paired height ratios")
        )
        width_factor = math.exp(
            robust_median(width_logs, f"{animation} paired width ratios")
        )
        disagreement = max(height_factor, width_factor) / min(
            height_factor, width_factor
        )
        left_summary = animation_metric_summary((lateral_banks[0],), animation)
        right_summary = animation_metric_summary((lateral_banks[1],), animation)
        height_asymmetry = max(
            float(left_summary["medianVisibleHeight"]),
            float(right_summary["medianVisibleHeight"]),
        ) / min(
            float(left_summary["medianVisibleHeight"]),
            float(right_summary["medianVisibleHeight"]),
        )
        width_asymmetry = max(
            float(left_summary["medianVisibleWidth"]),
            float(right_summary["medianVisibleWidth"]),
        ) / min(
            float(left_summary["medianVisibleWidth"]),
            float(right_summary["medianVisibleWidth"]),
        )
        if max(height_asymmetry, width_asymmetry) > MAX_LATERAL_ASYMMETRY:
            raise HarmonizeContractError(
                f"{animation}: left/right differ too much for a shared factor "
                f"(h={height_asymmetry:.4f}, w={width_asymmetry:.4f})"
            )

        combined = math.exp(
            robust_median(
                height_logs + width_logs,
                f"{animation} combined paired ratios",
            )
        )
        phase_factors: list[float] = []
        phase_reports: list[dict[str, Any]] = []
        for index, metrics in enumerate(phase_metrics):
            boxes: list[tuple[int, int, int, int]] = []
            for bank in lateral_banks:
                box = alpha_bbox(bank.frames[animation][index], 1)
                if box is None:
                    raise HarmonizeContractError(
                        f"{animation}/{index:02d}: empty lateral alpha frame"
                    )
                boxes.append(box)
            max_height = max(box[3] - box[1] for box in boxes)
            max_width = max(box[2] - box[0] for box in boxes)
            fit_cap = min(
                MAX_SCALE,
                (FRAME_HEIGHT - TOP_MARGIN) / max_height,
                FRAME_WIDTH / max_width,
            )
            height_min = (
                MIN_PHASE_HEIGHT_RATIO
                * metrics["referenceHeight"]
                / metrics["lateralHeight"]
            )
            height_max = (
                MAX_PHASE_HEIGHT_RATIO
                * metrics["referenceHeight"]
                / metrics["lateralHeight"]
            )
            area_min = math.sqrt(
                MIN_PHASE_BBOX_AREA_RATIO
                * metrics["referenceArea"]
                / metrics["lateralArea"]
            )
            area_max = math.sqrt(
                MAX_PHASE_BBOX_AREA_RATIO
                * metrics["referenceArea"]
                / metrics["lateralArea"]
            )
            lower = max(MIN_SCALE, height_min, area_min)
            upper = min(MAX_SCALE, height_max, area_max, fit_cap)
            if lower > upper + 1e-9:
                raise HarmonizeContractError(
                    f"{animation}/{index:02d}: empty admissible scale interval "
                    f"[{lower:.6f}, {upper:.6f}] (height=[{height_min:.6f}, "
                    f"{height_max:.6f}], area=[{area_min:.6f}, {area_max:.6f}], "
                    f"safety=[{MIN_SCALE:.6f}, {MAX_SCALE:.6f}], "
                    f"fit<={fit_cap:.6f})"
                )
            factor = min(max(combined, lower), upper)
            phase_factors.append(factor)
            height_before = metrics["lateralHeight"] / metrics["referenceHeight"]
            area_before = metrics["lateralArea"] / metrics["referenceArea"]
            phase_reports.append(
                {
                    "phase": index,
                    "factor": round(factor, 8),
                    "preferredFactor": round(combined, 8),
                    "adjustedFromPreferred": abs(factor - combined) > 1e-9,
                    "interval": {
                        "minimum": round(lower, 8),
                        "maximum": round(upper, 8),
                        "height": [round(height_min, 8), round(height_max, 8)],
                        "bboxArea": [round(area_min, 8), round(area_max, 8)],
                        "safety": [MIN_SCALE, MAX_SCALE],
                        "fitMaximum": round(fit_cap, 8),
                    },
                    "ratios": {
                        "before": {
                            "height": round(height_before, 6),
                            "bboxArea": round(area_before, 6),
                        },
                        "predictedAfter": {
                            "height": round(height_before * factor, 6),
                            "bboxArea": round(area_before * factor * factor, 6),
                        },
                        "targets": {
                            "height": [
                                MIN_PHASE_HEIGHT_RATIO,
                                MAX_PHASE_HEIGHT_RATIO,
                            ],
                            "bboxArea": [
                                MIN_PHASE_BBOX_AREA_RATIO,
                                MAX_PHASE_BBOX_AREA_RATIO,
                            ],
                        },
                    },
                }
            )
        factors[animation] = tuple(phase_factors)
        inputs[animation] = {
            "height": round(height_factor, 8),
            "width": round(width_factor, 8),
            "preferredFactor": round(combined, 8),
            "heightWidthDisagreement": round(disagreement, 6),
            "maximumAdjacentFactorDelta": round(
                max(
                    abs(phase_factors[index] - phase_factors[index - 1])
                    for index in range(1, FRAME_COUNT)
                ),
                8,
            ),
            "phases": phase_reports,
        }
        summaries[animation] = {
            "leftBefore": left_summary,
            "rightBefore": right_summary,
            "heightAsymmetry": round(height_asymmetry, 6),
            "widthAsymmetry": round(width_asymmetry, 6),
        }
    return factors, inputs, summaries


def plan_character(category: str, sprite_path: Path) -> CharacterPlan:
    character_id = sprite_path.parent.name
    character_folder = sprite_path.parent
    sprite = read_json(sprite_path)
    if sprite.get("view") != "fps-enemy-directional":
        raise HarmonizeContractError("view doit être fps-enemy-directional")
    if (sprite.get("frameWidth"), sprite.get("frameHeight")) != (
        FRAME_WIDTH,
        FRAME_HEIGHT,
    ):
        raise HarmonizeContractError(
            f"canvas attendu {FRAME_WIDTH}x{FRAME_HEIGHT}"
        )
    if sprite.get("groundAnchor") != [0.5, 1.0]:
        raise HarmonizeContractError("groundAnchor doit être [0.5, 1.0]")
    banks_value = sprite.get("fpsDirections")
    if not isinstance(banks_value, dict):
        raise HarmonizeContractError("fpsDirections doit être un objet")
    authored = tuple(
        direction
        for direction, bank in banks_value.items()
        if isinstance(bank, dict) and bank.get("authoredDirection") is True
    )
    if set(authored) != set(AUTHORED_DIRECTIONS) or len(authored) != len(
        AUTHORED_DIRECTIONS
    ):
        raise HarmonizeContractError(
            "les six références authoredDirection:true doivent être exactement "
            + ", ".join(AUTHORED_DIRECTIONS)
        )
    for direction in LATERAL_DIRECTIONS:
        bank = banks_value.get(direction)
        if not isinstance(bank, dict):
            raise HarmonizeContractError(f"banque latérale {direction} absente")
        if bank.get("authoredDirection") is True:
            raise HarmonizeContractError(
                f"{direction}: une banque authoredDirection:true ne doit pas être recalibrée"
            )

    reference_banks: list[BankFrames] = []
    lateral_banks: list[BankFrames] = []
    output_banks: list[BankFrames] = []
    expected: dict[Path, Image.Image] = {}
    try:
        pristine_index, pristine_revision = load_pristine_index(
            character_folder, sprite, category, character_id
        )
        reference_banks = [
            load_bank(sprite, character_folder, direction)
            for direction in AUTHORED_DIRECTIONS
        ]
        lateral_banks = [
            load_bank(
                sprite,
                character_folder,
                direction,
                pristine_index=pristine_index,
            )
            for direction in LATERAL_DIRECTIONS
        ]

        all_sheet_paths = [
            path
            for bank in reference_banks + lateral_banks
            for path in bank.sheets.values()
        ]
        lateral_destinations = [
            path
            for bank in lateral_banks
            for path in bank.sheets.values()
        ] + [
            path
            for bank in lateral_banks
            for paths in bank.frame_paths.values()
            for path in paths
        ]
        if len(lateral_destinations) != len(set(lateral_destinations)):
            raise HarmonizeContractError(
                "les destinations sheets/frames left/right doivent être toutes distinctes"
            )
        if set(lateral_destinations) & set(
            path for bank in reference_banks for path in bank.sheets.values()
        ):
            raise HarmonizeContractError(
                "une destination latérale chevauche une sheet authoredDirection"
            )
        if len(all_sheet_paths) != len(set(all_sheet_paths)):
            duplicates = sorted(
                relative(path)
                for path in set(all_sheet_paths)
                if all_sheet_paths.count(path) > 1
            )
            raise HarmonizeContractError(
                f"sheets partagées entre banques, transformation ambiguë: {duplicates}"
            )

        reference_phases = phase_geometry(reference_banks)
        lateral_phases = phase_geometry(lateral_banks)
        height_logs: list[float] = []
        width_logs: list[float] = []
        for phase in sorted(reference_phases):
            if phase[0] not in LIVE_ANIMATIONS:
                continue
            reference_height = robust_median(
                (item.height for item in reference_phases[phase]),
                f"{phase} reference height",
            )
            reference_width = robust_median(
                (item.width for item in reference_phases[phase]),
                f"{phase} reference width",
            )
            lateral_height = robust_median(
                (item.height for item in lateral_phases[phase]),
                f"{phase} lateral height",
            )
            lateral_width = robust_median(
                (item.width for item in lateral_phases[phase]),
                f"{phase} lateral width",
            )
            height_logs.append(math.log(reference_height / lateral_height))
            width_logs.append(math.log(reference_width / lateral_width))

        height_factor = math.exp(
            robust_median(height_logs, "paired reference/lateral height ratios")
        )
        width_factor = math.exp(
            robust_median(width_logs, "paired reference/lateral width ratios")
        )
        factor_disagreement = max(height_factor, width_factor) / min(
            height_factor, width_factor
        )
        if factor_disagreement > MAX_DIMENSION_SCALE_DISAGREEMENT:
            raise HarmonizeContractError(
                "les ratios hauteur/largeur divergent trop pour garantir une échelle "
                f"isotrope ({height_factor:.4f} contre {width_factor:.4f})"
            )

        left_summary = metric_summary((lateral_banks[0],))
        right_summary = metric_summary((lateral_banks[1],))
        height_asymmetry = max(
            float(left_summary["medianVisibleHeight"]),
            float(right_summary["medianVisibleHeight"]),
        ) / min(
            float(left_summary["medianVisibleHeight"]),
            float(right_summary["medianVisibleHeight"]),
        )
        width_asymmetry = max(
            float(left_summary["medianVisibleWidth"]),
            float(right_summary["medianVisibleWidth"]),
        ) / min(
            float(left_summary["medianVisibleWidth"]),
            float(right_summary["medianVisibleWidth"]),
        )
        if max(height_asymmetry, width_asymmetry) > MAX_LATERAL_ASYMMETRY:
            raise HarmonizeContractError(
                "left/right divergent trop pour un facteur partagé sans masquer une "
                f"erreur de contenu (h={height_asymmetry:.4f}, w={width_asymmetry:.4f})"
            )

        combined_factor = math.exp(
            robust_median(
                height_logs + width_logs,
                "combined paired reference/lateral ratios",
            )
        )
        all_lateral_frames = [
            frame
            for bank in lateral_banks
            for animation in ANIMATIONS
            for frame in bank.frames[animation]
        ]
        full_boxes = []
        for frame in all_lateral_frames:
            box = alpha_bbox(frame, 1)
            if box is None:
                raise HarmonizeContractError("frame latérale alpha vide")
            full_boxes.append(box)
        max_alpha_height = max(box[3] - box[1] for box in full_boxes)
        max_alpha_width = max(box[2] - box[0] for box in full_boxes)
        fit_factor = min(
            MAX_SCALE,
            (FRAME_HEIGHT - TOP_MARGIN) / max_alpha_height,
            FRAME_WIDTH / max_alpha_width,
        )
        requested_factor = min(MAX_SCALE, combined_factor)
        factor = min(requested_factor, fit_factor)
        if factor >= NO_OP_SCALE and fit_factor >= NO_OP_SCALE:
            factor = MAX_SCALE
        if factor < MIN_SCALE:
            raise HarmonizeContractError(
                f"facteur {factor:.4f} inférieur au garde-fou {MIN_SCALE:.2f}"
            )

        # Runtime outputs use six constrained phase factors per animation from
        # the pristine archive. A single unusual pose can no longer force the
        # scale of the other phases.
        factors, animation_factor_inputs, lateral_animation_summaries = (
            calculate_phase_factors(reference_banks, lateral_banks)
        )

        for bank in lateral_banks:
            output_frames: dict[str, tuple[Image.Image, ...]] = {}
            for animation in ANIMATIONS:
                frames = tuple(
                    scale_frame(
                        frame,
                        factors[animation][index],
                        f"{category}/{character_id}/{bank.direction}/{animation}/{index:02d}",
                    )
                    for index, frame in enumerate(bank.frames[animation])
                )
                output_frames[animation] = frames
                sheet = build_sheet(frames)
                sheet_path = bank.sheets[animation]
                if sheet_path in expected:
                    sheet.close()
                    raise HarmonizeContractError(
                        f"destination dupliquée: {relative(sheet_path)}"
                    )
                expected[sheet_path] = sheet
                for frame_path, output_frame in zip(
                    bank.frame_paths[animation], frames, strict=True
                ):
                    if frame_path in expected:
                        raise HarmonizeContractError(
                            f"destination dupliquée: {relative(frame_path)}"
                        )
                    expected[frame_path] = output_frame.copy()
            output_banks.append(
                BankFrames(
                    direction=bank.direction,
                    sheets=bank.sheets,
                    frame_paths=bank.frame_paths,
                    frames=output_frames,
                )
            )

        reference_summary = metric_summary(reference_banks)
        before_summary = metric_summary(lateral_banks)
        after_summary = metric_summary(output_banks)
        actual_phase_ratios = output_phase_ratio_summary(
            reference_banks, output_banks
        )
        all_phase_ratios_within_targets = all(
            phase["withinTargets"]
            for phases in actual_phase_ratios.values()
            for phase in phases
        )
        reference_height = float(reference_summary["medianVisibleHeight"])
        reference_width = float(reference_summary["medianVisibleWidth"])
        before_height = float(before_summary["medianVisibleHeight"])
        before_width = float(before_summary["medianVisibleWidth"])
        after_height = float(after_summary["medianVisibleHeight"])
        after_width = float(after_summary["medianVisibleWidth"])

        missing_paths = sorted(path for path in expected if not path.is_file())
        stale_paths = sorted(
            path
            for path, image in expected.items()
            if path.is_file() and not image_equal(image, path)
        )
        protected = collect_protected_hashes(
            sprite_path, character_folder, sprite
        )
        protected[pristine_root(character_folder) / PRISTINE_MANIFEST_NAME] = sha256(
            pristine_root(character_folder) / PRISTINE_MANIFEST_NAME
        )
        protected.update(
            {archive_path: sha256(archive_path) for archive_path in pristine_index.values()}
        )
        report = {
            "category": category,
            "id": character_id,
            "sprite": relative(sprite_path),
            "authoredReferenceDirections": list(AUTHORED_DIRECTIONS),
            "lateralDirections": list(LATERAL_DIRECTIONS),
            "factors": {
                animation: [round(value, 8) for value in factors[animation]]
                for animation in ANIMATIONS
            },
            "sameFactorLeftRight": True,
            "factorScope": "phase-specific, shared left/right",
            "factorInputs": animation_factor_inputs,
            "source": {
                "lateralSheets": "versioned lateral-pristine-v1 archive",
                "sourceRevision": pristine_revision,
                "checksumsValidated": True,
                "gitReadDuringNormalPlanning": False,
                "worktreeLateralPixelsUsedAsInput": False,
            },
            "ratios": {
                "before": {
                    "visibleHeightToAuthoredReference": ratio(
                        before_height, reference_height
                    ),
                    "visibleWidthToAuthoredReference": ratio(
                        before_width, reference_width
                    ),
                },
                "after": {
                    "visibleHeightToAuthoredReference": ratio(
                        after_height, reference_height
                    ),
                    "visibleWidthToAuthoredReference": ratio(
                        after_width, reference_width
                    ),
                },
            },
            "geometry": {
                "authoredReference": reference_summary,
                "lateralBefore": before_summary,
                "lateralAfter": after_summary,
                "leftBefore": left_summary,
                "rightBefore": right_summary,
                "perAnimationBefore": lateral_animation_summaries,
                "phaseRatiosAfter": actual_phase_ratios,
            },
            "safety": {
                "canvas": [FRAME_WIDTH, FRAME_HEIGHT],
                "topMarginPixels": TOP_MARGIN,
                "bottomCenterGrounding": True,
                "baselinePreserved": after_summary["maximumAlphaBottom"]
                == FRAME_HEIGHT,
                "phaseOrderPreserved": True,
                "phaseSpecificSharedLeftRight": True,
                "allActualPhaseRatiosWithinTargets": (
                    all_phase_ratios_within_targets
                ),
                "actualPhaseRatioRoundingTolerance": {
                    "height": PHASE_HEIGHT_ROUNDING_TOLERANCE,
                    "bboxArea": PHASE_BBOX_AREA_ROUNDING_TOLERANCE,
                },
                "factorSelection": (
                    "nearest admissible value to the robust animation preference"
                ),
                "semanticPhaseValidation": (
                    "not inferred; the existing animation/frame indices are retained"
                ),
                "clippingPreventedByBoundsCheck": True,
                "resampling": "nearest",
                "mirror": False,
                "fusion": False,
                "projection": False,
                "interpolation": False,
                "synthesis": False,
                "metadataWrites": False,
                "sourceAtlasWrites": False,
            },
            "outputs": {
                "sheets": len(LATERAL_DIRECTIONS) * len(ANIMATIONS),
                "frames": len(LATERAL_DIRECTIONS)
                * len(ANIMATIONS)
                * FRAME_COUNT,
                "missing": len(missing_paths),
                "stale": len(stale_paths),
                "current": len(expected) - len(missing_paths) - len(stale_paths),
            },
        }
        return CharacterPlan(
            category=category,
            character_id=character_id,
            sprite_path=sprite_path,
            factors=factors,
            expected=expected,
            stale_paths=stale_paths,
            missing_paths=missing_paths,
            report=report,
            protected_hashes=protected,
        )
    except Exception:
        for image in expected.values():
            image.close()
        raise
    finally:
        close_banks(reference_banks)
        close_banks(lateral_banks)
        close_banks(output_banks)


def verify_protected(hashes: dict[Path, str]) -> None:
    changed = [
        relative(path)
        for path, expected_hash in sorted(hashes.items())
        if not path.is_file() or sha256(path) != expected_hash
    ]
    if changed:
        raise HarmonizeContractError(
            f"metadata/source raw modifié pendant la transaction: {changed}"
        )


def save_staged_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=False, compress_level=9)
    # Windows rejects fsync on a read-only descriptor (EBADF). Reopen the
    # already encoded staging file read/write solely for the durability flush.
    with path.open("r+b") as handle:
        handle.flush()
        os.fsync(handle.fileno())


def save_staged_bytes(value: bytes, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("wb") as handle:
        handle.write(value)
        handle.flush()
        os.fsync(handle.fileno())


def transactional_capture_pristine(plans: list[PristineCapturePlan]) -> int:
    pending = [plan for plan in plans if not plan.already_current]
    if not pending:
        return 0
    archive_roots = [plan.archive_root.resolve() for plan in pending]
    if len(set(archive_roots)) != len(archive_roots):
        raise HarmonizeContractError("archives pristine dupliquees entre personnages")
    stage_root = ROOT / "tmp" / f".capture-fps-lateral-pristine-{uuid4().hex}"
    staged_roots: dict[Path, Path] = {}
    installed: list[Path] = []
    try:
        for index, plan in enumerate(pending):
            staged_archive = stage_root / f"{index:04d}" / PRISTINE_DIRNAME
            staged_roots[plan.archive_root] = staged_archive
            for destination, content in plan.expected.items():
                suffix = destination.relative_to(plan.archive_root)
                save_staged_bytes(content, staged_archive / suffix)
            for destination, content in plan.expected.items():
                staged_path = staged_archive / destination.relative_to(plan.archive_root)
                if staged_path.read_bytes() != content:
                    raise HarmonizeContractError(
                        f"capture pristine staging divergent: {relative(destination)}"
                    )

        for plan in pending:
            if plan.archive_root.exists():
                raise HarmonizeContractError(
                    f"archive pristine apparue pendant la transaction; refus d'ecraser "
                    f"{relative(plan.archive_root)}"
                )
            sprite_path = FPS_CHARACTER_ROOT / plan.category / plan.character_id / "sprite.json"
            if not sprite_path.is_file() or sha256(sprite_path) != plan.sprite_hash:
                raise HarmonizeContractError(
                    f"metadata modifiee pendant la capture: {relative(sprite_path)}"
                )
            plan.archive_root.parent.mkdir(parents=True, exist_ok=True)
            os.replace(staged_roots[plan.archive_root], plan.archive_root)
            installed.append(plan.archive_root)

        for plan in pending:
            for destination, content in plan.expected.items():
                if not destination.is_file() or destination.read_bytes() != content:
                    raise HarmonizeContractError(
                        f"verification post-capture echouee: {relative(destination)}"
                    )
        return sum(len(plan.expected) for plan in pending)
    except Exception:
        for installed_root in reversed(installed):
            if installed_root.exists():
                rollback_root = stage_root / "rollback" / uuid4().hex
                rollback_root.parent.mkdir(parents=True, exist_ok=True)
                os.replace(installed_root, rollback_root)
        raise
    finally:
        shutil.rmtree(stage_root, ignore_errors=True)


def transactional_write(plans: list[CharacterPlan]) -> int:
    outputs: list[tuple[Path, Image.Image]] = sorted(
        (
            (path, image)
            for plan in plans
            for path, image in plan.expected.items()
        ),
        key=lambda item: relative(item[0]),
    )
    if len({path for path, _ in outputs}) != len(outputs):
        raise HarmonizeContractError("destinations dupliquées entre personnages")
    protected = {
        path: digest
        for plan in plans
        for path, digest in plan.protected_hashes.items()
    }
    stage_root = ROOT / "tmp" / f".harmonize-fps-lateral-scale-{uuid4().hex}"
    new_root = stage_root / "new"
    backup_root = stage_root / "backup"
    installed: list[tuple[Path, Path | None]] = []
    backed_up: list[tuple[Path, Path]] = []
    try:
        for index, (_, image) in enumerate(outputs):
            save_staged_png(image, new_root / f"{index:05d}.png")
        for index, (destination, _) in enumerate(outputs):
            destination.parent.mkdir(parents=True, exist_ok=True)
            backup: Path | None = None
            if destination.exists():
                backup = backup_root / f"{index:05d}.png"
                backup.parent.mkdir(parents=True, exist_ok=True)
                os.replace(destination, backup)
                backed_up.append((destination, backup))
            os.replace(new_root / f"{index:05d}.png", destination)
            installed.append((destination, backup))

        for destination, expected in outputs:
            if not image_equal(expected, destination):
                raise HarmonizeContractError(
                    f"vérification post-écriture échouée: {relative(destination)}"
                )
        verify_protected(protected)
        return len(outputs)
    except Exception:
        installed_destinations = {destination for destination, _ in installed}
        for destination, backup in reversed(installed):
            if backup is not None and backup.exists():
                os.replace(backup, destination)
            elif destination.exists():
                destination.unlink()
        for destination, backup in reversed(backed_up):
            if destination not in installed_destinations and backup.exists():
                os.replace(backup, destination)
        raise
    finally:
        shutil.rmtree(stage_root, ignore_errors=True)


def discover() -> list[tuple[str, str, Path]]:
    if not FPS_CHARACTER_ROOT.exists():
        return []
    return [
        (sprite_path.parent.parent.name, sprite_path.parent.name, sprite_path)
        for sprite_path in sorted(FPS_CHARACTER_ROOT.glob("*/*/sprite.json"))
    ]


def close_plans(plans: Iterable[CharacterPlan]) -> None:
    for plan in plans:
        for image in plan.expected.values():
            image.close()


def run_capture_mode(
    selected: list[tuple[str, str, Path]],
    filter_issues: list[dict[str, str]],
    categories: list[str],
    character_ids: list[str],
    revision: str,
    check: bool,
) -> int:
    issues = list(filter_issues)
    plans: list[PristineCapturePlan] = []
    resolved_revision: str | None = None
    if not issues:
        try:
            resolved_revision = resolve_git_revision(revision)
        except (HarmonizeContractError, OSError) as error:
            issues.append({"character": "revision", "message": str(error)})
    if not issues and resolved_revision is not None:
        for category, character_id, sprite_path in selected:
            try:
                plans.append(
                    build_pristine_capture_plan(
                        category, sprite_path, resolved_revision
                    )
                )
            except (HarmonizeContractError, OSError, UnidentifiedImageError) as error:
                issues.append(
                    {
                        "character": f"{category}/{character_id}",
                        "message": str(error),
                    }
                )
    writes = 0
    try:
        if not issues and not check:
            writes = transactional_capture_pristine(plans)
        would_write = sum(
            len(plan.expected) for plan in plans if not plan.already_current
        )
        report = {
            "schema": 1,
            "mode": "capture-check" if check else "capture",
            "filters": {"categories": categories, "ids": character_ids},
            "requestedRevision": revision,
            "resolvedRevision": resolved_revision,
            "selectedCharacters": len(selected),
            "plannedCharacters": len(plans),
            "characters": [plan.report for plan in plans],
            "transaction": {
                "stagedArchiveBeforeInstall": not check,
                "atomicDirectoryInstall": not check,
                "rollbackOnFailure": not check,
                "refusesDifferentExistingArchive": True,
                "filesWritten": writes,
                "filesThatWouldBeWritten": would_write,
            },
            "issues": issues,
            "ok": not issues,
        }
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 0 if not issues else 2
    except (HarmonizeContractError, OSError) as error:
        report = {
            "schema": 1,
            "mode": "capture",
            "filters": {"categories": categories, "ids": character_ids},
            "requestedRevision": revision,
            "resolvedRevision": resolved_revision,
            "selectedCharacters": len(selected),
            "plannedCharacters": len(plans),
            "characters": [plan.report for plan in plans],
            "transaction": {
                "stagedArchiveBeforeInstall": True,
                "atomicDirectoryInstall": True,
                "rollbackOnFailure": True,
                "refusesDifferentExistingArchive": True,
                "filesWritten": 0,
                "error": str(error),
            },
            "issues": [{"character": "transaction", "message": str(error)}],
            "ok": False,
        }
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 2


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Harmonise les banques FPS left/right avec les six directions authored, "
            "sans modifier les métadonnées ni les sources raw."
        )
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Calcule et compare toutes les sorties sans écrire de fichier.",
    )
    parser.add_argument(
        "--capture-pristine-from",
        metavar="REVISION",
        help=(
            "Capture l'archive lateral-pristine-v1 depuis une revision Git "
            "explicite; avec --check, simule et valide sans ecrire."
        ),
    )
    parser.add_argument(
        "--categories",
        nargs="*",
        default=[],
        help="Dossiers de catégories exacts (par exemple regular special).",
    )
    parser.add_argument(
        "--ids",
        nargs="*",
        default=[],
        help="Identifiants exacts des personnages.",
    )
    args = parser.parse_args()

    categories = sorted(set(args.categories))
    character_ids = sorted(set(args.ids))
    discovered = discover()
    selected = [
        item
        for item in discovered
        if (not categories or item[0] in categories)
        and (not character_ids or item[1] in character_ids)
    ]
    issues: list[dict[str, str]] = []
    matched_categories = {item[0] for item in selected}
    matched_ids = {item[1] for item in selected}
    for category in sorted(set(categories) - matched_categories):
        issues.append(
            {"character": "filters", "message": f"catégorie sans résultat: {category}"}
        )
    for character_id in sorted(set(character_ids) - matched_ids):
        issues.append(
            {"character": "filters", "message": f"ID sans résultat: {character_id}"}
        )
    if not selected:
        issues.append({"character": "filters", "message": "aucun sprite sélectionné"})

    if args.capture_pristine_from:
        return run_capture_mode(
            selected,
            issues,
            categories,
            character_ids,
            args.capture_pristine_from,
            args.check,
        )

    plans: list[CharacterPlan] = []
    if not issues:
        for category, character_id, sprite_path in selected:
            try:
                plans.append(plan_character(category, sprite_path))
            except (HarmonizeContractError, OSError, UnidentifiedImageError) as error:
                issues.append(
                    {
                        "character": f"{category}/{character_id}",
                        "message": str(error),
                    }
                )

    writes = 0
    transaction_error: str | None = None
    try:
        if not issues and not args.check:
            writes = transactional_write(plans)
            for plan in plans:
                plan.report["outputs"]["missing"] = 0
                plan.report["outputs"]["stale"] = 0
                plan.report["outputs"]["current"] = len(plan.expected)
        differences = sorted(
            [relative(path) for plan in plans for path in plan.missing_paths]
            + [relative(path) for plan in plans for path in plan.stale_paths]
        )
        if not args.check and writes:
            differences = []
        ok = not issues and not transaction_error and not differences
        report = {
            "schema": 1,
            "mode": "check" if args.check else "apply",
            "filters": {"categories": categories, "ids": character_ids},
            "selectedCharacters": len(selected),
            "plannedCharacters": len(plans),
            "characters": [plan.report for plan in plans],
            "transaction": {
                "stagedBeforeReplace": not args.check,
                "atomicFileReplacement": not args.check,
                "rollbackOnFailure": not args.check,
                "filesWritten": writes,
            },
            "differences": differences[:REPORT_PATH_LIMIT],
            "differencesOmitted": max(0, len(differences) - REPORT_PATH_LIMIT),
            "issues": issues,
            "ok": ok,
        }
        print(json.dumps(report, ensure_ascii=False, indent=2))
        if issues:
            return 2
        return 0 if ok else 1
    except (HarmonizeContractError, OSError) as error:
        transaction_error = str(error)
        report = {
            "schema": 1,
            "mode": "apply",
            "filters": {"categories": categories, "ids": character_ids},
            "selectedCharacters": len(selected),
            "plannedCharacters": len(plans),
            "characters": [plan.report for plan in plans],
            "transaction": {
                "stagedBeforeReplace": True,
                "atomicFileReplacement": True,
                "rollbackOnFailure": True,
                "filesWritten": 0,
                "error": transaction_error,
            },
            "differences": [],
            "differencesOmitted": 0,
            "issues": [{"character": "transaction", "message": transaction_error}],
            "ok": False,
        }
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 2
    finally:
        close_plans(plans)


if __name__ == "__main__":
    raise SystemExit(main())
