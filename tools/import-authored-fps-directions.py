#!/usr/bin/env python3
"""Import six genuinely authored FPS direction atlases without deriving pixels.

This tool is intentionally separate from ``build-fps-directional.py``.  It is
the upgrade path from projected historical views to final authored artwork.
Each imported source must be one strict 6-column x 5-row atlas:

    columns: animation frames 00..05
    rows:    idle, move, attack, hurt, death

Only these directions are accepted:

    front, front-left, back-left, back, back-right, front-right

The complete lateral ``left`` and ``right`` banks are immutable inputs.  The
importer fingerprints them before and after the transaction and aborts with a
rollback if either bank changes.

Raw sources follow the production-queue convention and are retained in:

    assets/modular/fps/characters/<category>/<id>/
      sources-authored-six-way-v1/
        front-imagegen-raw.png
        front-left-imagegen-raw.png
        back-left-imagegen-raw.png
        back-imagegen-raw.png
        back-right-imagegen-raw.png
        front-right-imagegen-raw.png

The importer never mirrors, projects, blends, splices, interpolates, invents,
deduplicates, or phase-warps a frame.  Normalization is limited to:

* 6x5 cell extraction along real transparent atlas gutters;
* alpha preservation or chroma-to-alpha conversion;
* one global nearest-neighbour scale for all 180 authored cells;
* bottom-centre placement on the existing 96x128 runtime canvas.

Preflight also rejects duplicated/mirrored direction masks, duplicate phases,
more than one body-scale silhouette in a cell, inconsistent direction scale,
and semantically reordered animation phases. Temporal agreement is compared
between the six authored views after per-view normalization; raw lateral,
frontal and rear silhouette areas are never compared. The importer therefore
fails closed instead of silently repairing bad art.

Running with ``--manifest`` performs a complete read-only preflight.  Add
``--apply`` only after the report is clean.  An apply is transactional: the six
old direction folders and ``sprite.json`` are moved to a timestamped backup
under ``tmp/fps-authored-import-backups`` before the staged outputs are moved
into place.  A failed verification restores the old files.

Examples:

    py tools/import-authored-fps-directions.py --print-manifest-template

    py tools/import-authored-fps-directions.py ^
      --manifest authoring/01-shibito-villager-directions.json

    py tools/import-authored-fps-directions.py ^
      --manifest authoring/01-shibito-villager-directions.json --apply
"""

from __future__ import annotations

import argparse
from collections import deque
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
from statistics import median
import sys
from typing import Any
from uuid import uuid4

from PIL import Image


SCRIPT_ROOT = Path(__file__).resolve().parents[1]
ANIMATIONS = ("idle", "move", "attack", "hurt", "death")
AUTHORED_DIRECTIONS = (
    "front",
    "front-left",
    "back-left",
    "back",
    "back-right",
    "front-right",
)
LATERAL_DIRECTIONS = ("left", "right")
ALL_DIRECTIONS = (
    "front",
    "front-left",
    "left",
    "back-left",
    "back",
    "back-right",
    "right",
    "front-right",
)
FRAME_SIZE = (96, 128)
SHEET_SIZE = (FRAME_SIZE[0] * 6, FRAME_SIZE[1])
TRANSPARENT = (0, 0, 0, 0)
VISIBLE_ALPHA = 16
SLUG = re.compile(r"^[a-z0-9][a-z0-9-]*$")
IMPORT_PIPELINE_VERSION = "authored-six-way-v3-interior-chroma"
SEMANTIC_CONSENSUS_LIMITS: dict[str, tuple[float, float]] = {
    # minimum cosine similarity, maximum mean absolute signature delta
    "move": (0.78, 0.34),
    "attack": (0.80, 0.35),
    "hurt": (0.78, 0.35),
    # Death silhouettes vary the most between front, rear and diagonal views,
    # especially for very broad characters once they are fully prone. Keep a
    # high cosine floor, but allow a tiny extra MAE margin for legitimate
    # view-dependent topology. Deliberately disordered deaths such as R06
    # front-right (cos=0.886 / mae=0.204) remain far outside this gate.
    "death": (0.94, 0.17),
}
GEOMETRY_CHANNELS = (
    "height",
    "width",
    "area",
    "centroidY",
    "spreadX",
    "spreadY",
)
ACTION_EXCURSION_THRESHOLDS: dict[str, tuple[float, ...]] = {
    # A valid attack can extend vertically (overhead strike), horizontally
    # (thrust), or through a silhouette/weight transfer. Requiring the
    # Euclidean aggregate to move on every axis rejects legitimate authored
    # actions, so one semantically meaningful channel may carry the motion.
    "attack": (0.018, 0.020, 0.0050, 0.012, 0.008, 0.008),
    "hurt": (0.012, 0.014, 0.0035, 0.009, 0.006, 0.006),
}


MANIFEST_TEMPLATE: dict[str, Any] = {
    "schema": 1,
    "character": {
        "category": "legacy",
        "id": "01-shibito-villager",
    },
    "layout": {
        "columns": 6,
        "rows": 5,
        "rowOrder": list(ANIMATIONS),
    },
    "assertions": {
        "directionsAreIndividuallyAuthored": True,
        "handsEmpty": True,
        "weaponsBakedIntoBody": False,
        "oneCharacterPerCell": True,
    },
    "background": {
        "mode": "auto",
        "color": "#ff00ff",
        "tolerance": 72,
        "alphaThreshold": 8,
    },
    "normalization": {
        "frameWidth": FRAME_SIZE[0],
        "frameHeight": FRAME_SIZE[1],
        "padding": 2,
        "scaleMode": "global-character",
        "resampling": "nearest",
        "grounding": "bottom-center",
        "allowUpscale": False,
        "maxIdleMoveDirectionScaleRatio": 1.35,
        "phaseValidation": "semantic-v1",
    },
    "directions": {
        direction: {"file": f"{direction}-imagegen-raw.png"}
        for direction in AUTHORED_DIRECTIONS
    },
}


class ImportContractError(ValueError):
    """Raised when authored input would violate the runtime contract."""


@dataclass(frozen=True)
class SourceCell:
    direction: str
    animation: str
    frame: int
    image: Image.Image
    content_box: tuple[int, int, int, int]
    cell_height: int


@dataclass(frozen=True)
class FrameGeometry:
    height: float
    width: float
    area: float
    centroid_y: float
    spread_x: float
    spread_y: float

    def vector(self) -> tuple[float, ...]:
        return (
            self.height,
            self.width,
            self.area,
            self.centroid_y,
            self.spread_x,
            self.spread_y,
        )


@dataclass
class PreparedImport:
    project_root: Path
    manifest_path: Path
    category: str
    character_id: str
    fps_folder: Path
    existing_sprite: dict[str, Any]
    updated_sprite: dict[str, Any]
    normalized: dict[str, dict[str, list[Image.Image]]]
    source_paths: dict[str, Path]
    source_hashes: dict[str, str]
    source_runtime_names: dict[str, str]
    lateral_hashes: dict[str, str]
    lateral_sheet_frames: dict[str, dict[str, list[Image.Image]]]
    missing_lateral_frames: list[tuple[str, str, int, Path, Image.Image]]
    fingerprint: str
    scale: float
    warnings: list[str]
    settings: dict[str, Any]


def json_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


def read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise ImportContractError(f"Fichier absent : {path}") from error
    except json.JSONDecodeError as error:
        raise ImportContractError(
            f"JSON invalide dans {path} : ligne {error.lineno}, colonne {error.colno}"
        ) from error
    if not isinstance(value, dict):
        raise ImportContractError(f"{path} doit contenir un objet JSON")
    return value


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


@contextmanager
def inheriting_staging_directory(parent: Path, prefix: str):
    """Create a private-name staging folder while preserving parent ACLs.

    ``tempfile.TemporaryDirectory`` protects its Windows directory with an
    owner-only DACL. Files moved from it keep that DACL and become unreadable
    to sandboxed build/QA processes. A UUID-named regular directory inherits
    the project's ACL while retaining the same collision resistance.
    """

    path = parent / f"{prefix}{uuid4().hex}"
    path.mkdir(parents=False, exist_ok=False)
    try:
        yield path
    finally:
        shutil.rmtree(path, ignore_errors=True)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def safe_relative(path: Path, root: Path, label: str) -> Path:
    resolved = path.resolve()
    try:
        return resolved.relative_to(root.resolve())
    except ValueError as error:
        raise ImportContractError(
            f"{label} doit rester sous la racine du projet : {resolved}"
        ) from error


def web_path(path: Path, root: Path) -> str:
    return safe_relative(path, root, "Chemin runtime").as_posix()


def parse_hex_color(value: Any) -> tuple[int, int, int]:
    if not isinstance(value, str) or not re.fullmatch(r"#[0-9a-fA-F]{6}", value):
        raise ImportContractError(
            "background.color doit être une couleur hexadécimale #RRGGBB"
        )
    return tuple(int(value[index : index + 2], 16) for index in (1, 3, 5))


def color_distance_squared(
    left: tuple[int, int, int],
    right: tuple[int, int, int],
) -> int:
    return sum((a - b) ** 2 for a, b in zip(left, right))


def border_color(image: Image.Image) -> tuple[int, int, int]:
    rgb = image.convert("RGB")
    width, height = rgb.size
    samples: list[tuple[int, int, int]] = []
    for x in range(width):
        samples.append(rgb.getpixel((x, 0)))
        samples.append(rgb.getpixel((x, height - 1)))
    for y in range(height):
        samples.append(rgb.getpixel((0, y)))
        samples.append(rgb.getpixel((width - 1, y)))
    middle = len(samples) // 2
    return tuple(
        sorted(color[channel] for color in samples)[middle]
        for channel in range(3)
    )


def clear_transparent_rgb(
    image: Image.Image,
    alpha_threshold: int,
) -> Image.Image:
    rgba = image.convert("RGBA")
    data = []
    getter = getattr(rgba, "get_flattened_data", rgba.getdata)
    for red, green, blue, alpha in getter():
        if alpha <= alpha_threshold:
            data.append(TRANSPARENT)
        else:
            data.append((red, green, blue, alpha))
    rgba.putdata(data)
    return rgba


def chroma_border_to_alpha(
    source: Image.Image,
    key: tuple[int, int, int],
    tolerance: int,
    alpha_threshold: int,
) -> Image.Image:
    """Remove only key-coloured pixels connected to a cell border.

    Flooding each authored grid cell separately preserves similarly coloured
    costume accents while still clearing the complete surrounding chroma field.
    It never combines pixels from multiple cells or silhouettes.
    """

    image = source.convert("RGBA")
    width, height = image.size
    source_pixels = image.load()
    visited = bytearray(width * height)
    background = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()
    tolerance_squared = tolerance * tolerance

    def key_candidate(x: int, y: int) -> bool:
        red, green, blue, alpha = source_pixels[x, y]
        return (
            alpha <= alpha_threshold
            or color_distance_squared((red, green, blue), key)
            <= tolerance_squared
        )

    def visit(x: int, y: int) -> None:
        index = y * width + x
        if visited[index]:
            return
        visited[index] = 1
        if key_candidate(x, y):
            background[index] = 1
            queue.append((x, y))

    for x in range(width):
        visit(x, 0)
        visit(x, height - 1)
    for y in range(height):
        visit(0, y)
        visit(width - 1, y)

    while queue:
        x, y = queue.popleft()
        if x > 0:
            visit(x - 1, y)
        if x + 1 < width:
            visit(x + 1, y)
        if y > 0:
            visit(x, y - 1)
        if y + 1 < height:
            visit(x, y + 1)

    output = Image.new("RGBA", image.size, TRANSPARENT)
    output_pixels = output.load()
    for y in range(height):
        for x in range(width):
            index = y * width + x
            if background[index]:
                continue
            red, green, blue, alpha = source_pixels[x, y]
            if alpha > alpha_threshold:
                output_pixels[x, y] = (red, green, blue, alpha)
    cleaned = remove_chroma_pixels(
        clear_transparent_rgb(output, alpha_threshold),
        key,
        tolerance,
        alpha_threshold,
    )
    return suppress_chroma_spill(
        cleaned,
        key,
        min(220, tolerance + 40),
        alpha_threshold,
    )


def remove_chroma_pixels(
    image: Image.Image,
    key: tuple[int, int, int],
    tolerance: int,
    alpha_threshold: int,
) -> Image.Image:
    """Clear enclosed key-colour pockets as well as the connected backdrop.

    Hair, sleeves and bent limbs can surround a small island of the flat source
    backdrop, so a border flood alone leaves bright magenta holes. The authored
    input contract explicitly forbids the key colour on the character, making
    a global within-tolerance removal deterministic and safe.
    """

    rgba = image.convert("RGBA")
    output = Image.new("RGBA", rgba.size, TRANSPARENT)
    source = rgba.load()
    target = output.load()
    tolerance_squared = tolerance * tolerance
    for y in range(rgba.height):
        for x in range(rgba.width):
            red, green, blue, alpha = source[x, y]
            if (
                alpha > alpha_threshold
                and color_distance_squared((red, green, blue), key)
                > tolerance_squared
            ):
                target[x, y] = (red, green, blue, alpha)
    rgba.close()
    return clear_transparent_rgb(output, alpha_threshold)


def suppress_chroma_spill(
    image: Image.Image,
    key: tuple[int, int, int],
    tolerance: int,
    alpha_threshold: int,
) -> Image.Image:
    """Replace key-coloured edge spill with neighbouring body colour.

    Image generation often leaves a one- or two-pixel opaque magenta halo just
    inside the hard chroma boundary. Removing those pixels would erode the
    silhouette; copying the nearest non-key opaque contour colour keeps the
    authored shape while eliminating the visible key fringe. Only pixels near
    transparency are eligible, so internal costume colours remain untouched.
    """

    rgba = image.convert("RGBA")
    width, height = rgba.size
    source = rgba.load()
    tolerance_squared = tolerance * tolerance
    visible = [False] * (width * height)
    spill = [False] * (width * height)
    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = source[x, y]
            index = y * width + x
            if alpha <= alpha_threshold:
                continue
            visible[index] = True
            spill[index] = (
                color_distance_squared((red, green, blue), key)
                <= tolerance_squared
            )

    output = rgba.copy()
    target = output.load()
    for y in range(height):
        for x in range(width):
            index = y * width + x
            if not spill[index]:
                continue
            near_transparency = any(
                not visible[near_y * width + near_x]
                for near_y in range(max(0, y - 2), min(height, y + 3))
                for near_x in range(max(0, x - 2), min(width, x + 3))
            )
            if not near_transparency:
                continue
            replacement: tuple[int, int, int, int] | None = None
            for radius in (1, 2, 3):
                candidates: list[tuple[int, int, int, int, int]] = []
                for near_y in range(max(0, y - radius), min(height, y + radius + 1)):
                    for near_x in range(max(0, x - radius), min(width, x + radius + 1)):
                        near_index = near_y * width + near_x
                        if not visible[near_index] or spill[near_index]:
                            continue
                        distance = abs(near_x - x) + abs(near_y - y)
                        candidates.append((distance, near_y, near_x, near_index, radius))
                if candidates:
                    _, near_y, near_x, _, _ = min(candidates)
                    red, green, blue, _ = source[near_x, near_y]
                    replacement = (red, green, blue, source[x, y][3])
                    break
            if replacement is None:
                target[x, y] = TRANSPARENT
            else:
                target[x, y] = replacement
    return clear_transparent_rgb(output, alpha_threshold)


def prepare_alpha(
    cell: Image.Image,
    background: dict[str, Any],
) -> Image.Image:
    mode = background["mode"]
    alpha_threshold = background["alphaThreshold"]
    rgba = cell.convert("RGBA")
    alpha = rgba.getchannel("A")
    width, height = rgba.size
    border_alpha = (
        [alpha.getpixel((x, 0)) for x in range(width)]
        + [alpha.getpixel((x, height - 1)) for x in range(width)]
        + [alpha.getpixel((0, y)) for y in range(height)]
        + [alpha.getpixel((width - 1, y)) for y in range(height)]
    )
    transparent_border_ratio = sum(
        value <= alpha_threshold for value in border_alpha
    ) / max(1, len(border_alpha))
    has_transparent_background = transparent_border_ratio >= 0.75
    if mode == "alpha":
        if not has_transparent_background:
            raise ImportContractError(
                "Une cellule déclarée en mode alpha n’a pas de fond "
                "majoritairement transparent sur son contour"
            )
        return clear_transparent_rgb(cell, alpha_threshold)
    if mode == "color":
        key = background["color"]
    elif mode == "auto":
        if has_transparent_background:
            return clear_transparent_rgb(cell, alpha_threshold)
        key = border_color(cell)
    else:
        raise ImportContractError(
            "background.mode doit être alpha, color ou auto"
        )
    return chroma_border_to_alpha(
        cell,
        key,
        background["tolerance"],
        alpha_threshold,
    )


def connected_components(image: Image.Image) -> list[tuple[int, tuple[int, int, int, int]]]:
    alpha = image.getchannel("A")
    width, height = image.size
    active = bytearray(1 if value >= VISIBLE_ALPHA else 0 for value in alpha.tobytes())
    components: list[tuple[int, tuple[int, int, int, int]]] = []
    for start in range(width * height):
        if not active[start]:
            continue
        active[start] = 0
        queue = [start]
        area = 0
        min_x = max_x = start % width
        min_y = max_y = start // width
        while queue:
            index = queue.pop()
            x = index % width
            y = index // width
            area += 1
            min_x = min(min_x, x)
            max_x = max(max_x, x)
            min_y = min(min_y, y)
            max_y = max(max_y, y)
            for neighbor_y in range(max(0, y - 1), min(height, y + 2)):
                row = neighbor_y * width
                for neighbor_x in range(max(0, x - 1), min(width, x + 2)):
                    neighbor = row + neighbor_x
                    if active[neighbor]:
                        active[neighbor] = 0
                        queue.append(neighbor)
        components.append((area, (min_x, min_y, max_x + 1, max_y + 1)))
    components.sort(reverse=True, key=lambda entry: entry[0])
    return components


def assert_single_authored_silhouette(
    image: Image.Image,
    label: str,
) -> tuple[int, int, int, int]:
    bounds = image.getchannel("A").getbbox()
    if bounds is None:
        raise ImportContractError(f"{label} est vide après détourage")
    components = connected_components(image)
    if not components:
        raise ImportContractError(f"{label} ne contient aucune silhouette")
    largest_area, _ = components[0]
    body_height = bounds[3] - bounds[1]
    body_scale_components = [
        (area, component_bounds)
        for area, component_bounds in components
        if area >= max(24, largest_area * 0.38)
        and component_bounds[3] - component_bounds[1] >= body_height * 0.52
    ]
    if len(body_scale_components) > 1:
        raise ImportContractError(
            f"{label} semble contenir {len(body_scale_components)} silhouettes "
            "complètes ; aucune fusion automatique ne sera tentée"
        )
    return bounds


def validate_manifest(
    manifest: dict[str, Any],
    manifest_path: Path,
    project_root: Path,
) -> tuple[
    str,
    str,
    dict[str, Path],
    dict[str, Any],
    dict[str, Any],
]:
    if manifest.get("schema") != 1:
        raise ImportContractError("Le manifeste authored doit utiliser schema: 1")

    character = manifest.get("character")
    if not isinstance(character, dict):
        raise ImportContractError("character doit être un objet")
    category = character.get("category")
    character_id = character.get("id")
    if not isinstance(category, str) or not SLUG.fullmatch(category):
        raise ImportContractError("character.category contient un nom dangereux ou invalide")
    if not isinstance(character_id, str) or not SLUG.fullmatch(character_id):
        raise ImportContractError("character.id contient un nom dangereux ou invalide")

    layout = manifest.get("layout")
    expected_layout = {
        "columns": 6,
        "rows": 5,
        "rowOrder": list(ANIMATIONS),
    }
    if not isinstance(layout, dict) or any(
        layout.get(key) != value for key, value in expected_layout.items()
    ):
        raise ImportContractError(
            "layout doit être exactement 6 colonnes x 5 lignes dans l’ordre "
            "idle, move, attack, hurt, death"
        )

    assertions = manifest.get("assertions")
    required_assertions = {
        "directionsAreIndividuallyAuthored": True,
        "handsEmpty": True,
        "weaponsBakedIntoBody": False,
        "oneCharacterPerCell": True,
    }
    if not isinstance(assertions, dict) or any(
        assertions.get(key) != value
        for key, value in required_assertions.items()
    ):
        raise ImportContractError(
            "Les quatre assertions authored/mains vides/personnage unique "
            "doivent être explicitement confirmées dans le manifeste"
        )

    directions = manifest.get("directions")
    if not isinstance(directions, dict):
        raise ImportContractError("directions doit être un objet")
    supplied = set(directions)
    expected = set(AUTHORED_DIRECTIONS)
    if supplied != expected:
        missing = sorted(expected - supplied)
        forbidden = sorted(supplied - expected)
        raise ImportContractError(
            "Le manifeste doit fournir exactement les six vues authored. "
            f"Manquantes={missing}, interdites/inconnues={forbidden}. "
            "left et right ne peuvent pas être importées par cet outil."
        )

    fps_folder = (
        project_root
        / "assets"
        / "modular"
        / "fps"
        / "characters"
        / category
        / character_id
    )
    safe_relative(fps_folder, project_root, "Dossier FPS")
    source_folder = fps_folder / "sources-authored-six-way-v1"
    source_paths: dict[str, Path] = {}
    missing_sources: list[str] = []
    for direction in AUTHORED_DIRECTIONS:
        record = directions[direction]
        if not isinstance(record, dict) or not isinstance(record.get("file"), str):
            raise ImportContractError(f"directions.{direction}.file est requis")
        raw_path = Path(record["file"])
        source_path = (
            raw_path
            if raw_path.is_absolute()
            else manifest_path.parent / raw_path
        ).resolve()
        expected_path = (
            source_folder / f"{direction}-imagegen-raw.png"
        ).resolve()
        if source_path != expected_path:
            raise ImportContractError(
                f"{direction}: la source doit suivre la convention "
                f"{expected_path}, reçu {source_path}"
            )
        if not source_path.is_file():
            missing_sources.append(direction)
        source_paths[direction] = source_path
    if missing_sources:
        raise ImportContractError(
            "Lot authored incomplet dans sources-authored-six-way-v1 : "
            f"{len(missing_sources)}/6 atlas manquants "
            f"({', '.join(missing_sources)})"
        )

    background_raw = manifest.get("background", {})
    if not isinstance(background_raw, dict):
        raise ImportContractError("background doit être un objet")
    mode = background_raw.get("mode", "auto")
    if mode not in {"auto", "alpha", "color"}:
        raise ImportContractError("background.mode doit être auto, alpha ou color")
    tolerance = background_raw.get("tolerance", 72)
    alpha_threshold = background_raw.get("alphaThreshold", 8)
    if not isinstance(tolerance, int) or not 0 <= tolerance <= 255:
        raise ImportContractError("background.tolerance doit être un entier 0..255")
    if not isinstance(alpha_threshold, int) or not 0 <= alpha_threshold <= 254:
        raise ImportContractError(
            "background.alphaThreshold doit être un entier 0..254"
        )
    background = {
        "mode": mode,
        "color": parse_hex_color(background_raw.get("color", "#ff00ff")),
        "tolerance": tolerance,
        "alphaThreshold": alpha_threshold,
    }

    normalization_raw = manifest.get("normalization", {})
    if not isinstance(normalization_raw, dict):
        raise ImportContractError("normalization doit être un objet")
    required_normalization = {
        "frameWidth": FRAME_SIZE[0],
        "frameHeight": FRAME_SIZE[1],
        "scaleMode": "global-character",
        "resampling": "nearest",
        "grounding": "bottom-center",
        "phaseValidation": "semantic-v1",
    }
    if any(
        normalization_raw.get(key, MANIFEST_TEMPLATE["normalization"].get(key))
        != value
        for key, value in required_normalization.items()
    ):
        raise ImportContractError(
            "La cible doit rester 96x128, en échelle globale, nearest-neighbour "
            "et bottom-center"
        )
    padding = normalization_raw.get("padding", 2)
    if not isinstance(padding, int) or not 0 <= padding <= 12:
        raise ImportContractError("normalization.padding doit être un entier 0..12")
    max_scale_ratio = normalization_raw.get(
        "maxIdleMoveDirectionScaleRatio",
        1.35,
    )
    if (
        not isinstance(max_scale_ratio, (int, float))
        or not 1.0 <= max_scale_ratio <= 2.0
    ):
        raise ImportContractError(
            "maxIdleMoveDirectionScaleRatio doit être compris entre 1.0 et 2.0"
        )
    normalization = {
        "frameWidth": FRAME_SIZE[0],
        "frameHeight": FRAME_SIZE[1],
        "padding": padding,
        "scaleMode": "global-character",
        "resampling": "nearest",
        "grounding": "bottom-center",
        "allowUpscale": normalization_raw.get("allowUpscale", False) is True,
        "maxIdleMoveDirectionScaleRatio": float(max_scale_ratio),
        "phaseValidation": "semantic-v1",
    }

    return category, character_id, source_paths, background, normalization


def equal_grid_bounds(length: int, count: int) -> list[int]:
    """Return nominal grid bounds for reporting and scale reference.

    Image generation commonly returns sizes such as 1536x1024, whose height is
    not divisible by five. Rounded proportional boundaries still provide a
    stable cell pitch, but they are not safe crop lines: authored figures can
    drift across them. Actual extraction uses transparent gutters below.
    """

    return [round(index * length / count) for index in range(count + 1)]


def transparent_gutter_bounds(
    image: Image.Image,
    axis: str,
    expected_cells: int,
    label: str,
) -> tuple[list[int], list[dict[str, int]]]:
    """Resolve authored cells without cutting or discarding visible pixels.

    Generated atlases are visually arranged as a grid but their characters are
    not always centred inside mathematically equal cells. A nominal 1536/6 cut
    can therefore contain the tail of one pose and most of the next pose.
    We instead select the widest fully transparent internal gutters. The
    operation only chooses crop boundaries; every visible source pixel remains
    assigned to exactly one neighbouring cell.
    """

    if axis not in {"x", "y"}:
        raise ValueError(f"Axe de projection invalide : {axis}")
    alpha = image.getchannel("A")
    visible = alpha.point(
        lambda value: 255 if value >= VISIBLE_ALPHA else 0,
    )
    x_projection, y_projection = visible.getprojection()
    projection = x_projection if axis == "x" else y_projection
    occupied = [bool(value) for value in projection]
    try:
        first_occupied = occupied.index(True)
        last_occupied = len(occupied) - 1 - occupied[::-1].index(True)
    except ValueError as error:
        raise ImportContractError(
            f"{label}: atlas vide pendant la recherche des gouttières"
        ) from error

    gaps: list[tuple[int, int, int]] = []
    index = first_occupied + 1
    while index < last_occupied:
        if occupied[index]:
            index += 1
            continue
        start = index
        while index <= last_occupied and not occupied[index]:
            index += 1
        gaps.append((index - start, start, index))

    required_gaps = expected_cells - 1
    usable = [gap for gap in gaps if gap[0] >= 2]
    if len(usable) < required_gaps:
        raise ImportContractError(
            f"{label}: {required_gaps} gouttières transparentes requises sur "
            f"l’axe {axis}, {len(usable)} trouvées. Les corps se touchent ou "
            "la grille authored n’est pas séparable sans supprimer des pixels."
        )

    # True inter-cell gutters are substantially wider than incidental holes
    # inside a pose. Picking the widest N-1 gaps is deterministic and remains
    # independent of the pose's absolute scale or camera direction.
    selected = sorted(
        sorted(usable, key=lambda gap: (-gap[0], gap[1]))[:required_gaps],
        key=lambda gap: gap[1],
    )
    separators = [(start + end) // 2 for _, start, end in selected]
    bounds = [0, *separators, len(projection)]
    if any(right <= left for left, right in zip(bounds[:-1], bounds[1:])):
        raise ImportContractError(
            f"{label}: ordre de gouttières invalide sur l’axe {axis}"
        )

    for cell_index, (left, right) in enumerate(
        zip(bounds[:-1], bounds[1:]),
    ):
        if not any(occupied[left:right]):
            raise ImportContractError(
                f"{label}: cellule {cell_index:02d} vide après séparation "
                f"des gouttières sur l’axe {axis}"
            )

    return bounds, [
        {
            "start": start,
            "end": end,
            "width": length,
            "separator": (start + end) // 2,
        }
        for length, start, end in selected
    ]


def extract_source_cells(
    source_paths: dict[str, Path],
    background: dict[str, Any],
) -> tuple[list[SourceCell], dict[str, str], dict[str, dict[str, Any]]]:
    cells: list[SourceCell] = []
    source_hashes: dict[str, str] = {}
    grid_metrics: dict[str, dict[str, Any]] = {}
    for direction in AUTHORED_DIRECTIONS:
        source_path = source_paths[direction]
        source_hashes[direction] = sha256_file(source_path)
        try:
            with Image.open(source_path) as opened:
                opened.load()
                atlas = opened.convert("RGBA")
        except (OSError, ValueError) as error:
            raise ImportContractError(
                f"Impossible de lire l’atlas {direction} : {source_path}"
            ) from error
        nominal_column_bounds = equal_grid_bounds(atlas.width, 6)
        nominal_row_bounds = equal_grid_bounds(atlas.height, 5)
        nominal_column_widths = [
            right - left
            for left, right in zip(
                nominal_column_bounds[:-1],
                nominal_column_bounds[1:],
            )
        ]
        nominal_row_heights = [
            bottom - top
            for top, bottom in zip(
                nominal_row_bounds[:-1],
                nominal_row_bounds[1:],
            )
        ]
        if (
            min(nominal_column_widths) < 8
            or min(nominal_row_heights) < 8
        ):
            raise ImportContractError(
                f"{direction}: grille 6x5 trop petite dans "
                f"{atlas.width}x{atlas.height}"
            )
        keyed_atlas = prepare_alpha(atlas, background)
        row_bounds, row_gutters = transparent_gutter_bounds(
            keyed_atlas,
            "y",
            5,
            direction,
        )
        row_heights = [
            bottom - top
            for top, bottom in zip(row_bounds[:-1], row_bounds[1:])
        ]
        normalization_cell_height = round(atlas.height / 5)
        column_bounds_by_row: dict[str, list[int]] = {}
        column_gutters_by_row: dict[str, list[dict[str, int]]] = {}
        grid_metrics[direction] = {
            "atlas": [atlas.width, atlas.height],
            "segmentation": "transparent-gutters-v1",
            "nominalColumnWidths": nominal_column_widths,
            "nominalRowHeights": nominal_row_heights,
            "normalizationCellHeight": normalization_cell_height,
            "rowBounds": row_bounds,
            "rowHeights": row_heights,
            "rowGutters": row_gutters,
            "columnBoundsByRow": column_bounds_by_row,
            "columnGuttersByRow": column_gutters_by_row,
        }
        for row, animation in enumerate(ANIMATIONS):
            y0, y1 = row_bounds[row], row_bounds[row + 1]
            row_image = keyed_atlas.crop((0, y0, atlas.width, y1))
            column_bounds, column_gutters = transparent_gutter_bounds(
                row_image,
                "x",
                6,
                f"{direction}/{animation}",
            )
            column_bounds_by_row[animation] = column_bounds
            column_gutters_by_row[animation] = column_gutters
            for frame in range(6):
                x0, x1 = column_bounds[frame], column_bounds[frame + 1]
                keyed = keyed_atlas.crop(
                    (x0, y0, x1, y1),
                )
                label = f"{direction}/{animation}/{frame:02d}"
                bounds = assert_single_authored_silhouette(keyed, label)
                cells.append(
                    SourceCell(
                        direction=direction,
                        animation=animation,
                        frame=frame,
                        image=keyed,
                        content_box=bounds,
                        cell_height=normalization_cell_height,
                    ),
                )
    digest_to_directions: dict[str, list[str]] = {}
    for direction, digest in source_hashes.items():
        digest_to_directions.setdefault(digest, []).append(direction)
    duplicated = [
        directions
        for directions in digest_to_directions.values()
        if len(directions) > 1
    ]
    if duplicated:
        raise ImportContractError(
            "Chaque vue authored doit provenir d’un atlas distinct ; SHA-256 "
            f"dupliqués pour {duplicated}"
        )
    return cells, source_hashes, grid_metrics


def validate_direction_scale(
    cells: list[SourceCell],
    maximum_ratio: float,
) -> dict[str, float]:
    medians: dict[str, float] = {}
    for direction in AUTHORED_DIRECTIONS:
        ratios = sorted(
            (cell.content_box[3] - cell.content_box[1]) / cell.cell_height
            for cell in cells
            if cell.direction == direction
            and cell.animation in {"idle", "move"}
        )
        if not ratios:
            raise ImportContractError(f"{direction}: poses idle/move absentes")
        middle = len(ratios) // 2
        medians[direction] = (
            ratios[middle]
            if len(ratios) % 2
            else (ratios[middle - 1] + ratios[middle]) / 2
        )
    smallest = min(medians.values())
    largest = max(medians.values())
    observed_ratio = largest / max(smallest, 1e-9)
    if observed_ratio > maximum_ratio:
        raise ImportContractError(
            "Échelle authored incohérente entre directions : "
            f"ratio {observed_ratio:.3f}, maximum {maximum_ratio:.3f}. "
            "Recadrez les atlas sources au lieu de corriger chaque frame."
        )
    return medians


def normalize_cells(
    cells: list[SourceCell],
    normalization: dict[str, Any],
) -> tuple[dict[str, dict[str, list[Image.Image]]], float]:
    padding = normalization["padding"]
    max_width_units = max(
        (cell.content_box[2] - cell.content_box[0]) / cell.cell_height
        for cell in cells
    )
    max_height_units = max(
        (cell.content_box[3] - cell.content_box[1]) / cell.cell_height
        for cell in cells
    )
    scale = min(
        (FRAME_SIZE[0] - 2 * padding) / max_width_units,
        (FRAME_SIZE[1] - padding) / max_height_units,
    )
    normalized: dict[str, dict[str, list[Image.Image]]] = {
        direction: {animation: [] for animation in ANIMATIONS}
        for direction in AUTHORED_DIRECTIONS
    }

    for cell in cells:
        crop = cell.image.crop(cell.content_box)
        width_units = crop.width / cell.cell_height
        height_units = crop.height / cell.cell_height
        target_width = max(1, round(width_units * scale))
        target_height = max(1, round(height_units * scale))
        if (
            not normalization["allowUpscale"]
            and (target_width > crop.width or target_height > crop.height)
        ):
            raise ImportContractError(
                f"{cell.direction}/{cell.animation}/{cell.frame:02d}: "
                f"la source {crop.width}x{crop.height} exigerait un upscale "
                f"vers {target_width}x{target_height}"
            )
        pose = crop.resize(
            (target_width, target_height),
            Image.Resampling.NEAREST,
        )
        pose = clear_transparent_rgb(pose, 0)
        # Nearest-neighbour downscaling can legitimately skip an isolated
        # contact pixel from the source's final row. Re-crop the *resized*
        # authored silhouette, then translate that complete bitmap to the
        # baseline. This is grounding only: no second scale, projection,
        # interpolation, invented pixel, or pose synthesis occurs.
        resized_bounds = pose.getchannel("A").getbbox()
        if resized_bounds is None:
            raise ImportContractError(
                f"{cell.direction}/{cell.animation}/{cell.frame:02d}: "
                "silhouette perdue pendant la normalisation nearest"
            )
        pose = pose.crop(resized_bounds)
        target_width, target_height = pose.size
        output = Image.new("RGBA", FRAME_SIZE, TRANSPARENT)
        x = (FRAME_SIZE[0] - target_width) // 2
        y = FRAME_SIZE[1] - target_height
        if x < 0 or y < 0:
            raise ImportContractError(
                f"{cell.direction}/{cell.animation}/{cell.frame:02d}: "
                "normalisation hors canvas"
            )
        output.alpha_composite(pose, (x, y))
        bounds = output.getchannel("A").getbbox()
        if bounds is None or bounds[3] != FRAME_SIZE[1]:
            raise ImportContractError(
                f"{cell.direction}/{cell.animation}/{cell.frame:02d}: "
                "la silhouette normalisée ne touche pas la ligne de sol"
            )
        normalized[cell.direction][cell.animation].append(output)

    for direction in AUTHORED_DIRECTIONS:
        for animation in ANIMATIONS:
            frames = normalized[direction][animation]
            if len(frames) != 6:
                raise ImportContractError(
                    f"{direction}/{animation}: {len(frames)} frames au lieu de 6"
                )
    return normalized, scale


def sheet_frames_for_bank(
    bank: dict[str, Any],
    project_root: Path,
    label: str,
) -> dict[str, list[Image.Image]]:
    animations = bank.get("animations")
    if not isinstance(animations, dict):
        raise ImportContractError(f"{label}: table animations absente")
    result: dict[str, list[Image.Image]] = {}
    for animation in ANIMATIONS:
        value = animations.get(animation)
        if not isinstance(value, str):
            raise ImportContractError(f"{label}/{animation}: planche non déclarée")
        path = (project_root / value).resolve()
        safe_relative(path, project_root, f"{label}/{animation}")
        if not path.is_file():
            raise ImportContractError(f"{label}/{animation}: planche absente {value}")
        try:
            with Image.open(path) as opened:
                opened.load()
                sheet = opened.convert("RGBA")
        except (OSError, ValueError) as error:
            raise ImportContractError(
                f"{label}/{animation}: planche illisible {value}"
            ) from error
        if sheet.size != SHEET_SIZE:
            raise ImportContractError(
                f"{label}/{animation}: dimensions {sheet.size}, "
                f"attendu {SHEET_SIZE}"
            )
        result[animation] = [
            sheet.crop(
                (
                    index * FRAME_SIZE[0],
                    0,
                    (index + 1) * FRAME_SIZE[0],
                    FRAME_SIZE[1],
                ),
            )
            for index in range(6)
        ]
    return result


def lateral_frame_exports(
    direction: str,
    bank: dict[str, Any],
    sheet_frames: dict[str, list[Image.Image]],
    project_root: Path,
) -> list[tuple[str, str, int, Path, Image.Image]]:
    """Return missing derived frames and reject stale non-identical exports."""

    frame_map = bank.get("frames")
    if not isinstance(frame_map, dict):
        raise ImportContractError(
            f"{direction}: table de frames latérales absente"
        )
    missing: list[tuple[str, str, int, Path, Image.Image]] = []
    for animation in ANIMATIONS:
        declared = frame_map.get(animation)
        if not isinstance(declared, list) or len(declared) != 6:
            raise ImportContractError(
                f"{direction}/{animation}: six chemins de frames attendus"
            )
        for index, value in enumerate(declared):
            if not isinstance(value, str):
                raise ImportContractError(
                    f"{direction}/{animation}/{index:02d}: chemin invalide"
                )
            target = (project_root / value).resolve()
            safe_relative(target, project_root, "Frame latérale dérivée")
            expected = sheet_frames[animation][index]
            if not target.exists():
                missing.append(
                    (direction, animation, index, target, expected),
                )
                continue
            try:
                with Image.open(target) as opened:
                    opened.load()
                    actual = opened.convert("RGBA")
            except (OSError, ValueError) as error:
                raise ImportContractError(
                    f"{direction}/{animation}/{index:02d}: "
                    "frame latérale illisible"
                ) from error
            if actual.size != FRAME_SIZE or actual.tobytes() != expected.tobytes():
                raise ImportContractError(
                    f"{direction}/{animation}/{index:02d}: frame dérivée "
                    "différente de la cellule de sa planche maîtresse"
                )
    return missing


def frame_geometry(image: Image.Image, label: str) -> FrameGeometry:
    alpha = image.getchannel("A")
    bounds = alpha.getbbox()
    if bounds is None:
        raise ImportContractError(f"{label}: frame vide")
    width, height = image.size
    area = 0
    sum_x = 0.0
    sum_y = 0.0
    points: list[tuple[int, int]] = []
    for index, value in enumerate(alpha.tobytes()):
        if value < VISIBLE_ALPHA:
            continue
        x = index % width
        y = index // width
        points.append((x, y))
        area += 1
        sum_x += x
        sum_y += y
    if not area:
        raise ImportContractError(f"{label}: masque alpha vide")
    centroid_x = sum_x / area
    centroid_y = sum_y / area
    variance_x = sum((x - centroid_x) ** 2 for x, _ in points) / area
    variance_y = sum((y - centroid_y) ** 2 for _, y in points) / area
    return FrameGeometry(
        height=(bounds[3] - bounds[1]) / height,
        width=(bounds[2] - bounds[0]) / width,
        area=area / (width * height),
        centroid_y=centroid_y / height,
        spread_x=math.sqrt(variance_x) / width,
        spread_y=math.sqrt(variance_y) / height,
    )


def geometry_distance(left: FrameGeometry, right: FrameGeometry) -> float:
    weights = (1.0, 1.0, 2.0, 1.0, 1.0, 1.0)
    squared = sum(
        ((a - b) * weight) ** 2
        for a, b, weight in zip(
            left.vector(),
            right.vector(),
            weights,
            strict=True,
        )
    )
    return math.sqrt(squared / len(weights))


def semantic_distance_signature(frames: list[FrameGeometry]) -> list[float]:
    """Encode temporal relationships, normalized inside one camera view.

    Absolute frontal/rear/lateral areas are deliberately discarded. Each
    geometry channel is z-scored across its own six-frame row, then the fifteen
    pairwise phase distances are normalized. Reordering phases therefore
    changes the signature while a natural view-dependent silhouette scale does
    not.
    """

    vectors = [frame.vector() for frame in frames]
    channels: list[list[float]] = []
    for channel_index in range(len(vectors[0])):
        values = [vector[channel_index] for vector in vectors]
        mean = sum(values) / len(values)
        deviation = math.sqrt(
            sum((value - mean) ** 2 for value in values) / len(values)
        )
        denominator = max(deviation, 0.005)
        channels.append([(value - mean) / denominator for value in values])
    signature: list[float] = []
    for left_index in range(6):
        for right_index in range(left_index + 1, 6):
            signature.append(
                math.sqrt(
                    sum(
                        (channel[left_index] - channel[right_index]) ** 2
                        for channel in channels
                    )
                    / len(channels)
                ),
            )
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


def validate_semantic_phase_contract(
    normalized: dict[str, dict[str, list[Image.Image]]],
) -> dict[str, Any]:
    """Validate phase order without comparing raw side/front silhouette area."""

    geometries: dict[str, dict[str, list[FrameGeometry]]] = {}
    report: dict[str, Any] = {
        "version": "semantic-v1",
        "directions": {},
        "consensus": {},
    }
    errors: list[str] = []

    for direction in AUTHORED_DIRECTIONS:
        geometries[direction] = {}
        report["directions"][direction] = {}
        for animation in ANIMATIONS:
            frames = [
                frame_geometry(
                    image,
                    f"{direction}/{animation}/{index:02d}",
                )
                for index, image in enumerate(normalized[direction][animation])
            ]
            geometries[direction][animation] = frames
            heights = [frame.height for frame in frames]
            centroid_y = [frame.centroid_y for frame in frames]
            pair_distances = [
                geometry_distance(frames[left], frames[right])
                for left in range(6)
                for right in range(left + 1, 6)
            ]
            overall_span = max(pair_distances, default=0.0)
            animation_report: dict[str, float | int | str] = {
                "geometrySpan": round(overall_span, 6),
            }

            if animation == "idle":
                relative_height_spread = (
                    max(heights) - min(heights)
                ) / max(median(heights), 1e-9)
                vertical_spread = max(centroid_y) - min(centroid_y)
                closure = geometry_distance(frames[0], frames[5])
                animation_report.update(
                    {
                        "relativeHeightSpread": round(
                            relative_height_spread,
                            6,
                        ),
                        "verticalSpread": round(vertical_spread, 6),
                        "loopClosure": round(closure, 6),
                    },
                )
                if relative_height_spread > 0.24 or vertical_spread > 0.08:
                    errors.append(
                        f"{direction}/idle: cycle non stationnaire "
                        f"(hauteur={relative_height_spread:.3f}, "
                        f"vertical={vertical_spread:.3f})"
                    )
                if closure > max(0.04, overall_span * 1.35):
                    errors.append(
                        f"{direction}/idle: frame 05 ne reboucle pas vers 00 "
                        f"(écart={closure:.3f})"
                    )

            elif animation == "move":
                upright_ratio = min(heights) / max(max(heights), 1e-9)
                endpoint_height_delta = abs(heights[5] - heights[0]) / max(
                    heights[0],
                    1e-9,
                )
                animation_report.update(
                    {
                        "uprightRatio": round(upright_ratio, 6),
                        "endpointHeightDelta": round(
                            endpoint_height_delta,
                            6,
                        ),
                    },
                )
                if upright_ratio < 0.62 or endpoint_height_delta > 0.34:
                    errors.append(
                        f"{direction}/move: locomotion remplacée par une "
                        f"chute ou un ordre incohérent "
                        f"(upright={upright_ratio:.3f}, "
                        f"retour={endpoint_height_delta:.3f})"
                    )
                if overall_span < 0.006:
                    errors.append(
                        f"{direction}/move: cycle sans variation locomotrice"
                    )

            elif animation in {"attack", "hurt"}:
                middle_escape = max(
                    min(
                        geometry_distance(frames[index], frames[0]),
                        geometry_distance(frames[index], frames[5]),
                    )
                    for index in range(1, 5)
                )
                vectors = [frame.vector() for frame in frames]
                thresholds = ACTION_EXCURSION_THRESHOLDS[animation]
                channel_spans = [
                    max(vector[channel] for vector in vectors)
                    - min(vector[channel] for vector in vectors)
                    for channel in range(len(GEOMETRY_CHANNELS))
                ]
                channel_middle_escapes = [
                    max(
                        min(
                            abs(
                                vectors[index][channel]
                                - vectors[0][channel]
                            ),
                            abs(
                                vectors[index][channel]
                                - vectors[5][channel]
                            ),
                        )
                        for index in range(1, 5)
                    )
                    for channel in range(len(GEOMETRY_CHANNELS))
                ]
                channel_evidence = [
                    {
                        "channel": GEOMETRY_CHANNELS[channel],
                        "span": channel_spans[channel],
                        "middle": channel_middle_escapes[channel],
                        "spanScore": (
                            channel_spans[channel] / thresholds[channel]
                        ),
                        "middleScore": (
                            channel_middle_escapes[channel]
                            / thresholds[channel]
                        ),
                    }
                    for channel in range(len(GEOMETRY_CHANNELS))
                ]
                best_channel = max(
                    channel_evidence,
                    key=lambda evidence: min(
                        evidence["spanScore"],
                        evidence["middleScore"] / 0.45,
                    ),
                )
                directional_excursion = any(
                    evidence["spanScore"] >= 1.0
                    and evidence["middleScore"] >= 0.45
                    for evidence in channel_evidence
                )
                terminal_upright = heights[5] / max(max(heights), 1e-9)
                animation_report.update(
                    {
                        "middleEscape": round(middle_escape, 6),
                        "bestExcursionChannel": best_channel["channel"],
                        "bestExcursionSpan": round(
                            best_channel["span"],
                            6,
                        ),
                        "bestExcursionMiddle": round(
                            best_channel["middle"],
                            6,
                        ),
                        "bestExcursionSpanScore": round(
                            best_channel["spanScore"],
                            6,
                        ),
                        "bestExcursionMiddleScore": round(
                            best_channel["middleScore"],
                            6,
                        ),
                        "terminalUpright": round(terminal_upright, 6),
                    },
                )
                minimum_span = 0.025 if animation == "attack" else 0.014
                minimum_escape = max(
                    0.012 if animation == "attack" else 0.009,
                    overall_span * (0.14 if animation == "attack" else 0.10),
                )
                aggregate_excursion = (
                    overall_span >= minimum_span
                    and middle_escape >= minimum_escape
                )
                if not aggregate_excursion and not directional_excursion:
                    errors.append(
                        f"{direction}/{animation}: aucune "
                        "anticipation/extension significative ne traverse la "
                        "fenêtre centrale, ni en mouvement global ni sur un "
                        f"axe (span={overall_span:.3f}, "
                        f"milieu={middle_escape:.3f}, meilleur="
                        f"{best_channel['channel']} "
                        f"{best_channel['spanScore']:.2f}/"
                        f"{best_channel['middleScore']:.2f})"
                    )
                if terminal_upright < 0.58:
                    errors.append(
                        f"{direction}/{animation}: terminaison confondue avec "
                        "une phase de mort"
                    )

            elif animation == "death":
                first = frames[0]
                final = frames[5]
                fall_scores = [
                    0.60 * (first.height - frame.height)
                    + 0.30 * (frame.centroid_y - first.centroid_y)
                    + 0.10 * (frame.width - first.width)
                    for frame in frames
                ]
                ordered_steps = sum(
                    fall_scores[index + 1] + 0.015 >= fall_scores[index]
                    for index in range(5)
                )
                peak_index = max(
                    range(6),
                    key=lambda index: fall_scores[index],
                )
                terminal_height_ratio = final.height / max(first.height, 1e-9)
                vertical_drop = final.centroid_y - first.centroid_y
                terminal_width_ratio = final.width / max(first.width, 1e-9)
                terminal_aspect_gain = (
                    final.width / max(final.height, 1e-9)
                ) / (first.width / max(first.height, 1e-9))
                standard_fall = (
                    terminal_height_ratio <= 0.62
                    and vertical_drop >= 0.07
                )
                # A broad, grounded body can be visibly prone while losing
                # less than 38% of its bounding-box height: its mass spreads
                # horizontally instead. This alternate path is intentionally
                # fail-closed. It requires strong aspect expansion plus a
                # fully ordered 5/5 progression whose maximum occurs only on
                # the final frame. It therefore accepts genuine sumotori falls
                # without accepting R06's peak-at-4 or 3/5 regressions.
                broad_prone_fall = (
                    terminal_height_ratio <= 0.68
                    and vertical_drop >= 0.05
                    and terminal_aspect_gain >= 1.75
                    and ordered_steps == 5
                    and peak_index == 5
                )
                animation_report.update(
                    {
                        "orderedFallSteps": ordered_steps,
                        "fallPeakFrame": peak_index,
                        "terminalHeightRatio": round(
                            terminal_height_ratio,
                            6,
                        ),
                        "verticalDrop": round(vertical_drop, 6),
                        "terminalWidthRatio": round(
                            terminal_width_ratio,
                            6,
                        ),
                        "terminalAspectGain": round(
                            terminal_aspect_gain,
                            6,
                        ),
                        "fallProfile": (
                            "standard"
                            if standard_fall
                            else "broad-prone"
                            if broad_prone_fall
                            else "invalid"
                        ),
                    },
                )
                if (
                    not (standard_fall or broad_prone_fall)
                    or ordered_steps < 4
                    or peak_index not in {4, 5}
                ):
                    errors.append(
                        f"{direction}/death: ordre de chute incohérent "
                        f"(hauteur finale={terminal_height_ratio:.3f}, "
                        f"descente={vertical_drop:.3f}, "
                        f"aspect={terminal_aspect_gain:.3f}, "
                        f"étapes={ordered_steps}/5, pic={peak_index})"
                    )

            report["directions"][direction][animation] = animation_report

    # Cross-view phase agreement compares only each row's normalized temporal
    # distance topology. Absolute area/width/height never cross camera views.
    for animation, (minimum_cosine, maximum_mae) in (
        SEMANTIC_CONSENSUS_LIMITS.items()
    ):
        signatures = {
            direction: semantic_distance_signature(
                geometries[direction][animation],
            )
            for direction in AUTHORED_DIRECTIONS
        }
        consensus = [
            median(
                signatures[direction][index]
                for direction in AUTHORED_DIRECTIONS
            )
            for index in range(len(next(iter(signatures.values()))))
        ]
        report["consensus"][animation] = {}
        for direction in AUTHORED_DIRECTIONS:
            cosine = cosine_similarity(signatures[direction], consensus)
            mae = sum(
                abs(left - right)
                for left, right in zip(
                    signatures[direction],
                    consensus,
                    strict=True,
                )
            ) / len(consensus)
            report["consensus"][animation][direction] = {
                "cosine": round(cosine, 6),
                "mae": round(mae, 6),
            }
            if cosine < minimum_cosine or mae > maximum_mae:
                errors.append(
                    f"{direction}/{animation}: ordre temporel différent du "
                    f"consensus des six vues (cos={cosine:.3f}, "
                    f"mae={mae:.3f})"
                )

    if errors:
        detail = " | ".join(errors[:12])
        if len(errors) > 12:
            detail += f" | +{len(errors) - 12} autres"
        raise ImportContractError(
            f"Contrat de phase semantic-v1 refusé : {detail}"
        )
    return report


def assert_authored_frame_distinction(
    normalized: dict[str, dict[str, list[Image.Image]]],
) -> None:
    """Reject duplicated animation beats and copied/mirrored direction masks."""

    for direction in AUTHORED_DIRECTIONS:
        for animation in ANIMATIONS:
            hashes = [
                hashlib.sha256(frame.tobytes()).hexdigest()
                for frame in normalized[direction][animation]
            ]
            if len(set(hashes)) != 6:
                raise ImportContractError(
                    f"{direction}/{animation}: les six phases authored "
                    "doivent être visuellement distinctes"
                )

    for animation in ANIMATIONS:
        for frame_index in range(6):
            masks: dict[str, tuple[str, str]] = {}
            for direction in AUTHORED_DIRECTIONS:
                image = normalized[direction][animation][frame_index]
                alpha = image.getchannel("A")
                mask = alpha.point(lambda value: 255 if value >= VISIBLE_ALPHA else 0)
                mirrored = mask.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                masks[direction] = (
                    hashlib.sha256(mask.tobytes()).hexdigest(),
                    hashlib.sha256(mirrored.tobytes()).hexdigest(),
                )
            for left_index, left_direction in enumerate(AUTHORED_DIRECTIONS):
                left_hash, left_mirror = masks[left_direction]
                for right_direction in AUTHORED_DIRECTIONS[left_index + 1 :]:
                    right_hash, right_mirror = masks[right_direction]
                    if left_hash == right_hash:
                        raise ImportContractError(
                            f"{animation}/{frame_index:02d}: "
                            f"{left_direction} et {right_direction} ont un "
                            "masque identique"
                        )
                    if left_mirror == right_hash or right_mirror == left_hash:
                        raise ImportContractError(
                            f"{animation}/{frame_index:02d}: "
                            f"{left_direction} et {right_direction} sont des "
                            "miroirs exacts"
                        )


def bank_content_hash(
    bank: dict[str, Any],
    project_root: Path,
) -> str:
    digest = hashlib.sha256()
    digest.update(json_bytes(bank))
    required_sheets: set[str] = set()
    animations = bank.get("animations", {})
    if isinstance(animations, dict):
        required_sheets.update(
            path for path in animations.values() if isinstance(path, str)
        )
    for relative in sorted(required_sheets):
        path = (project_root / relative).resolve()
        safe_relative(path, project_root, "Asset latéral")
        if not path.is_file():
            raise ImportContractError(f"Planche latérale absente : {relative}")
        digest.update(relative.encode("utf-8"))
        digest.update(bytes.fromhex(sha256_file(path)))
    return digest.hexdigest()


def source_runtime_name(direction: str, source_path: Path) -> str:
    suffix = source_path.suffix.lower()
    if not re.fullmatch(r"\.[a-z0-9]{1,8}", suffix):
        suffix = ".png"
    return f"{direction}-imagegen-raw{suffix}"


def build_updated_sprite(
    existing: dict[str, Any],
    project_root: Path,
    fps_folder: Path,
    source_hashes: dict[str, str],
    source_runtime_names: dict[str, str],
    fingerprint: str,
) -> dict[str, Any]:
    updated = json.loads(json.dumps(existing))
    banks = updated.get("fpsDirections")
    if not isinstance(banks, dict):
        raise ImportContractError("sprite.json ne contient pas fpsDirections")
    for direction in ALL_DIRECTIONS:
        if not isinstance(banks.get(direction), dict):
            raise ImportContractError(f"fpsDirections.{direction} est absent")

    for direction in AUTHORED_DIRECTIONS:
        bank_root = fps_folder / "directions" / direction
        source_copy = (
            fps_folder
            / "sources-authored-six-way-v1"
            / source_runtime_names[direction]
        )
        animations = {
            animation: web_path(
                bank_root / "sheets" / f"{animation}.png",
                project_root,
            )
            for animation in ANIMATIONS
        }
        frames = {
            animation: [
                web_path(
                    bank_root / "frames" / animation / f"{index:02d}.png",
                    project_root,
                )
                for index in range(6)
            ]
            for animation in ANIMATIONS
        }
        banks[direction] = {
            "direction": direction,
            "source": (
                "Individually authored 6x5 atlas normalized as one complete "
                "silhouette per cell"
            ),
            "sourceKind": "authored-directional-atlas",
            "sourceAtlas": web_path(source_copy, project_root),
            "sourceSha256": source_hashes[direction],
            "derivedFrom": None,
            "orientationToward": None,
            "authoredDirection": True,
            "authoredAxialView": direction in {"front", "back"},
            "singleSilhouetteSource": True,
            "pixelTransforms": {
                "gridCrop": True,
                "gridSegmentation": "transparent-gutters-v1",
                "chromaOrAlphaCleanup": True,
                "globalNearestScale": True,
                "grounding": "bottom-center",
                "fusion": False,
                "mirror": False,
                "projection": False,
                "interpolation": False,
                "phaseSynthesis": False,
            },
            "weaponsBakedIntoBody": False,
            "animations": animations,
            "frames": frames,
        }

    updated["sourceView"] = (
        "Six individually authored FPS directions plus preserved complete "
        "left/right lateral banks"
    )
    coverage = updated.setdefault("viewCoverage", {})
    coverage.update(
        {
            "mode": "fps-eight-way-explicit-authored",
            "directions": list(ALL_DIRECTIONS),
            "authoredDirections": list(AUTHORED_DIRECTIONS),
            "lateralDirectionsPreserved": list(LATERAL_DIRECTIONS),
            "cardinalBitmapSources": ["front", "back", "left", "right"],
            "derivedDiagonalBanks": [],
            "frontBackAuthored": True,
            "runtimeSequence": "authored-six-plus-preserved-lateral",
            "rightProfile": (
                coverage.get("rightProfile")
                or "explicit-complete-lateral-bitmap"
            ),
            "imagegenRawRuntimeUse": False,
            "authoredAtlasRuntimeUse": "normalized-exports",
            "authoredImportFingerprint": fingerprint,
            "forbiddenTransforms": [
                "fusion",
                "mirror-authored-directions",
                "projection",
                "interpolation",
                "phase-synthesis",
            ],
        },
    )
    coverage.pop("frameLockedProjection", None)
    coverage.pop("historicalProjection", None)
    return updated


def prepare_import(
    manifest_path: Path,
    project_root: Path,
) -> PreparedImport:
    project_root = project_root.resolve()
    manifest_path = manifest_path.resolve()
    manifest = read_json(manifest_path)
    (
        category,
        character_id,
        source_paths,
        background,
        normalization,
    ) = validate_manifest(manifest, manifest_path, project_root)
    fps_folder = (
        project_root
        / "assets"
        / "modular"
        / "fps"
        / "characters"
        / category
        / character_id
    )
    sprite_path = fps_folder / "sprite.json"
    existing_sprite = read_json(sprite_path)
    if existing_sprite.get("frameWidth") != FRAME_SIZE[0] or existing_sprite.get(
        "frameHeight"
    ) != FRAME_SIZE[1]:
        raise ImportContractError(
            f"{sprite_path}: le canvas runtime doit être 96x128"
        )
    banks = existing_sprite.get("fpsDirections")
    if not isinstance(banks, dict):
        raise ImportContractError(f"{sprite_path}: fpsDirections absent")
    lateral_hashes: dict[str, str] = {}
    lateral_sheet_frames: dict[str, dict[str, list[Image.Image]]] = {}
    missing_lateral_frames: list[
        tuple[str, str, int, Path, Image.Image]
    ] = []
    for direction in LATERAL_DIRECTIONS:
        bank = banks.get(direction)
        if not isinstance(bank, dict):
            raise ImportContractError(
                f"{sprite_path}: banque latérale {direction} absente"
            )
        lateral_hashes[direction] = bank_content_hash(bank, project_root)
        sheet_frames = sheet_frames_for_bank(
            bank,
            project_root,
            f"{category}/{character_id}/{direction}",
        )
        lateral_sheet_frames[direction] = sheet_frames
        missing_lateral_frames.extend(
            lateral_frame_exports(
                direction,
                bank,
                sheet_frames,
                project_root,
            ),
        )

    cells, source_hashes, grid_metrics = extract_source_cells(
        source_paths,
        background,
    )
    direction_scale = validate_direction_scale(
        cells,
        normalization["maxIdleMoveDirectionScaleRatio"],
    )
    normalized, scale = normalize_cells(cells, normalization)
    assert_authored_frame_distinction(normalized)
    semantic_phase = validate_semantic_phase_contract(normalized)
    source_runtime_names = {
        direction: source_runtime_name(
            direction,
            source_paths[direction],
        )
        for direction in AUTHORED_DIRECTIONS
    }
    fingerprint_payload = {
        "schema": 1,
        "pipelineVersion": IMPORT_PIPELINE_VERSION,
        "category": category,
        "characterId": character_id,
        "sources": source_hashes,
        "layout": {
            "columns": 6,
            "rows": 5,
            "rowOrder": list(ANIMATIONS),
            "sourceGrids": {
                direction: grid_metrics[direction]
                for direction in AUTHORED_DIRECTIONS
            },
        },
        "background": {
            "mode": background["mode"],
            "color": list(background["color"]),
            "tolerance": background["tolerance"],
            "alphaThreshold": background["alphaThreshold"],
        },
        "normalization": normalization,
    }
    fingerprint = hashlib.sha256(json_bytes(fingerprint_payload)).hexdigest()
    updated_sprite = build_updated_sprite(
        existing_sprite,
        project_root,
        fps_folder,
        source_hashes,
        source_runtime_names,
        fingerprint,
    )
    warnings: list[str] = []
    previous_fingerprint = (
        existing_sprite.get("viewCoverage", {}).get("authoredImportFingerprint")
        if isinstance(existing_sprite.get("viewCoverage"), dict)
        else None
    )
    if previous_fingerprint == fingerprint:
        warnings.append(
            "Ce même import authored est déjà déclaré ; --apply restera "
            "idempotent visuellement mais créera une nouvelle sauvegarde."
        )
    return PreparedImport(
        project_root=project_root,
        manifest_path=manifest_path,
        category=category,
        character_id=character_id,
        fps_folder=fps_folder,
        existing_sprite=existing_sprite,
        updated_sprite=updated_sprite,
        normalized=normalized,
        source_paths=source_paths,
        source_hashes=source_hashes,
        source_runtime_names=source_runtime_names,
        lateral_hashes=lateral_hashes,
        lateral_sheet_frames=lateral_sheet_frames,
        missing_lateral_frames=missing_lateral_frames,
        fingerprint=fingerprint,
        scale=scale,
        warnings=warnings,
        settings={
            **fingerprint_payload,
            "directionScaleMedians": direction_scale,
            "semanticPhase": semantic_phase,
        },
    )


def save_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True)


def stage_import(
    prepared: PreparedImport,
    stage_root: Path,
    backup_relative: str,
) -> dict[str, Any]:
    output_hashes: dict[str, dict[str, Any]] = {}
    for direction in AUTHORED_DIRECTIONS:
        staged_bank = stage_root / "directions" / direction
        output_hashes[direction] = {"sheets": {}, "frames": {}}
        for animation in ANIMATIONS:
            sheet = Image.new("RGBA", SHEET_SIZE, TRANSPARENT)
            output_hashes[direction]["frames"][animation] = []
            for index, frame in enumerate(prepared.normalized[direction][animation]):
                frame_path = (
                    staged_bank
                    / "frames"
                    / animation
                    / f"{index:02d}.png"
                )
                save_png(frame, frame_path)
                sheet.alpha_composite(frame, (index * FRAME_SIZE[0], 0))
                output_hashes[direction]["frames"][animation].append(
                    sha256_file(frame_path)
                )
            sheet_path = staged_bank / "sheets" / f"{animation}.png"
            save_png(sheet, sheet_path)
            output_hashes[direction]["sheets"][animation] = sha256_file(sheet_path)

    write_json(stage_root / "sprite.json", prepared.updated_sprite)
    staged_sources = stage_root / "sources"
    for direction in AUTHORED_DIRECTIONS:
        target = staged_sources / prepared.source_runtime_names[direction]
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(prepared.source_paths[direction], target)
        if sha256_file(target) != prepared.source_hashes[direction]:
            raise ImportContractError(
                f"{direction}: la copie de la source authored a changé"
            )

    authored_manifest = {
        "schema": 1,
        "kind": "yomi-fps-authored-direction-import",
        "category": prepared.category,
        "characterId": prepared.character_id,
        "importFingerprint": prepared.fingerprint,
        "sourceManifest": {
            "name": prepared.manifest_path.name,
            "sha256": sha256_file(prepared.manifest_path),
        },
        "sourceContract": {
            "layout": "6 columns x 5 action rows",
            "cellSegmentation": "transparent-gutters-v1",
            "rowOrder": list(ANIMATIONS),
            "directions": list(AUTHORED_DIRECTIONS),
            "handsEmpty": True,
            "weaponsBakedIntoBody": False,
            "oneCompleteSilhouettePerCell": True,
        },
        "normalization": {
            "canvas": list(FRAME_SIZE),
            "globalScale": prepared.scale,
            "scaleMode": "global-character",
            "resampling": "nearest",
            "grounding": "bottom-center",
            "phaseValidation": "semantic-v1",
            "phaseComparison": (
                "per-view normalized temporal geometry across six authored "
                "directions; no raw cross-camera area comparison"
            ),
            "fusion": False,
            "mirror": False,
            "projection": False,
            "interpolation": False,
            "phaseSynthesis": False,
        },
        "sources": {
            direction: {
                "file": (
                    prepared.source_runtime_names[direction]
                ),
                "sha256": prepared.source_hashes[direction],
                "runtimeUse": "normalized-exports",
            }
            for direction in AUTHORED_DIRECTIONS
        },
        "outputs": output_hashes,
        "lateralPreservation": {
            direction: {
                "sha256Before": prepared.lateral_hashes[direction],
                "modified": False,
            }
            for direction in LATERAL_DIRECTIONS
        },
        "lateralDerivedFrames": {
            "authority": "unchanged left/right animation sheets",
            "expected": len(LATERAL_DIRECTIONS) * len(ANIMATIONS) * 6,
            "missingBeforeImport": len(prepared.missing_lateral_frames),
            "materialization": "exact 96x128 sheet-cell crops",
            "sheetFingerprintsRemainAuthoritative": True,
        },
        "backup": backup_relative,
    }
    write_json(stage_root / "authored-manifest.json", authored_manifest)
    return authored_manifest


def stage_missing_lateral_frames(
    prepared: PreparedImport,
    stage_root: Path,
    backup_root: Path,
) -> list[tuple[Path, Path, Path]]:
    """Stage exact sheet crops required by the deterministic weapon-rig tool."""

    targets: list[tuple[Path, Path, Path]] = []
    for direction, animation, index, target, expected in (
        prepared.missing_lateral_frames
    ):
        # A concurrent build may have restored the frame since preflight.
        if target.exists():
            try:
                with Image.open(target) as opened:
                    opened.load()
                    actual = opened.convert("RGBA")
            except (OSError, ValueError) as error:
                raise ImportContractError(
                    f"{direction}/{animation}/{index:02d}: "
                    "frame latérale devenue illisible pendant le staging"
                ) from error
            if actual.size != FRAME_SIZE or actual.tobytes() != expected.tobytes():
                raise ImportContractError(
                    f"{direction}/{animation}/{index:02d}: une frame "
                    "concurrente diffère de la planche maîtresse"
                )
            continue
        staged = (
            stage_root
            / "lateral-derived-frames"
            / direction
            / animation
            / f"{index:02d}.png"
        )
        save_png(expected, staged)
        with Image.open(staged) as opened:
            opened.load()
            staged_pixels = opened.convert("RGBA")
        if staged_pixels.tobytes() != expected.tobytes():
            raise ImportContractError(
                f"{direction}/{animation}/{index:02d}: l’export PNG latéral "
                "ne conserve pas exactement les pixels de la planche"
            )
        targets.append(
            (
                staged,
                target,
                backup_root
                / "derived-lateral-frames"
                / direction
                / animation
                / f"{index:02d}.png",
            ),
        )
    return targets


def verify_all_lateral_frames(
    prepared: PreparedImport,
    installed_sprite: dict[str, Any],
) -> None:
    banks = installed_sprite.get("fpsDirections")
    if not isinstance(banks, dict):
        raise ImportContractError("fpsDirections absent après transaction")
    for direction in LATERAL_DIRECTIONS:
        bank = banks.get(direction)
        if not isinstance(bank, dict):
            raise ImportContractError(
                f"Banque latérale {direction} absente après transaction"
            )
        # This call validates all 30 declared files against exact sheet crops.
        missing = lateral_frame_exports(
            direction,
            bank,
            prepared.lateral_sheet_frames[direction],
            prepared.project_root,
        )
        if missing:
            raise ImportContractError(
                f"{direction}: {len(missing)} frames latérales encore absentes"
            )


def move_into_transaction(
    staged: Path,
    target: Path,
    backup: Path,
    installed: list[tuple[Path, Path | None]],
) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    prior: Path | None = None
    if target.exists():
        prior = backup
        prior.parent.mkdir(parents=True, exist_ok=True)
        os.replace(target, prior)
    try:
        os.replace(staged, target)
    except Exception:
        if prior is not None and prior.exists() and not target.exists():
            os.replace(prior, target)
        raise
    installed.append((target, prior))


def rollback_transaction(
    installed: list[tuple[Path, Path | None]],
    failed_root: Path,
) -> list[str]:
    errors: list[str] = []
    for target, prior in reversed(installed):
        try:
            if target.exists():
                failed_path = failed_root / target.name
                failed_path.parent.mkdir(parents=True, exist_ok=True)
                if failed_path.exists():
                    failed_path = failed_root / f"{target.name}-{uuid4().hex[:8]}"
                os.replace(target, failed_path)
            if prior is not None and prior.exists():
                target.parent.mkdir(parents=True, exist_ok=True)
                os.replace(prior, target)
        except Exception as error:  # preserve every rollback failure for recovery
            errors.append(f"{target}: {error}")
    return errors


def apply_import(
    prepared: PreparedImport,
    backup_base: Path,
) -> tuple[Path, dict[str, Any]]:
    project_root = prepared.project_root
    safe_relative(backup_base, project_root, "Racine de sauvegarde")
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup_root = (
        backup_base
        / prepared.category
        / prepared.character_id
        / f"{timestamp}-{prepared.fingerprint[:12]}-{uuid4().hex[:8]}"
    )
    safe_relative(backup_root, project_root, "Sauvegarde")
    backup_root.mkdir(parents=True, exist_ok=False)
    stage_parent = project_root / "tmp"
    stage_parent.mkdir(parents=True, exist_ok=True)

    with inheriting_staging_directory(
        stage_parent,
        prefix=f"fps-authored-{prepared.character_id}-",
    ) as stage_root:
        backup_relative = web_path(backup_root, project_root)
        authored_manifest = stage_import(
            prepared,
            stage_root,
            backup_relative,
        )
        targets = stage_missing_lateral_frames(
            prepared,
            stage_root,
            backup_root,
        )
        authored_manifest["lateralDerivedFrames"]["stagedForMaterialization"] = (
            len(targets)
        )
        for direction in AUTHORED_DIRECTIONS:
            targets.append(
                (
                    stage_root / "directions" / direction,
                    prepared.fps_folder / "directions" / direction,
                    backup_root / "directions" / direction,
                ),
            )
        for direction in AUTHORED_DIRECTIONS:
            runtime_name = prepared.source_runtime_names[direction]
            source_target = (
                prepared.fps_folder
                / "sources-authored-six-way-v1"
                / runtime_name
            )
            targets.append(
                (
                    stage_root / "sources" / runtime_name,
                    source_target,
                    backup_root / "sources-authored-six-way-v1" / runtime_name,
                ),
            )
        targets.extend(
            [
                (
                    stage_root / "authored-manifest.json",
                    prepared.fps_folder
                    / "sources-authored-six-way-v1"
                    / "import-manifest.json",
                    backup_root
                    / "sources-authored-six-way-v1"
                    / "import-manifest.json",
                ),
                (
                    stage_root / "sprite.json",
                    prepared.fps_folder / "sprite.json",
                    backup_root / "sprite.json",
                ),
            ],
        )

        installed: list[tuple[Path, Path | None]] = []
        try:
            for staged, target, backup in targets:
                move_into_transaction(staged, target, backup, installed)
            installed_sprite = read_json(prepared.fps_folder / "sprite.json")
            installed_banks = installed_sprite.get("fpsDirections", {})
            verify_all_lateral_frames(prepared, installed_sprite)
            for direction in LATERAL_DIRECTIONS:
                bank = installed_banks.get(direction)
                if not isinstance(bank, dict):
                    raise ImportContractError(
                        f"Banque latérale {direction} perdue après transaction"
                    )
                after = bank_content_hash(bank, project_root)
                before = prepared.lateral_hashes[direction]
                if after != before:
                    raise ImportContractError(
                        f"La banque latérale {direction} a changé "
                        f"({before[:12]} -> {after[:12]})"
                    )
                authored_manifest["lateralPreservation"][direction][
                    "sha256After"
                ] = after
            authored_manifest["importedAt"] = datetime.now(
                timezone.utc,
            ).isoformat()
            write_json(
                prepared.fps_folder
                / "sources-authored-six-way-v1"
                / "import-manifest.json",
                authored_manifest,
            )
        except Exception as error:
            rollback_errors = rollback_transaction(
                installed,
                backup_root / "failed-new-output",
            )
            if rollback_errors:
                raise RuntimeError(
                    f"Import échoué ({error}); restauration incomplète : "
                    + " | ".join(rollback_errors)
                ) from error
            raise

    transaction_report = {
        "schema": 1,
        "status": "applied",
        "character": f"{prepared.category}/{prepared.character_id}",
        "fingerprint": prepared.fingerprint,
        "lateralHashes": prepared.lateral_hashes,
        "importedDirections": list(AUTHORED_DIRECTIONS),
        "preservedDirections": list(LATERAL_DIRECTIONS),
        "lateralDerivedFramesMaterialized": authored_manifest[
            "lateralDerivedFrames"
        ].get("stagedForMaterialization", 0),
        "authoredManifest": web_path(
            prepared.fps_folder
            / "sources-authored-six-way-v1"
            / "import-manifest.json",
            project_root,
        ),
    }
    write_json(backup_root / "transaction-report.json", transaction_report)
    return backup_root, authored_manifest


def report_for(
    prepared: PreparedImport,
    applied: bool,
    backup_root: Path | None = None,
) -> dict[str, Any]:
    return {
        "status": "applied" if applied else "validated-read-only",
        "character": f"{prepared.category}/{prepared.character_id}",
        "sourceAtlases": len(AUTHORED_DIRECTIONS),
        "sourceCells": len(AUTHORED_DIRECTIONS) * len(ANIMATIONS) * 6,
        "importedDirections": list(AUTHORED_DIRECTIONS),
        "preservedDirections": {
            direction: prepared.lateral_hashes[direction]
            for direction in LATERAL_DIRECTIONS
        },
        "animationSheets": len(AUTHORED_DIRECTIONS) * len(ANIMATIONS),
        "frameExports": len(AUTHORED_DIRECTIONS) * len(ANIMATIONS) * 6,
        "lateralDerivedFrames": {
            "expected": len(LATERAL_DIRECTIONS) * len(ANIMATIONS) * 6,
            "present": (
                len(LATERAL_DIRECTIONS) * len(ANIMATIONS) * 6
                - len(prepared.missing_lateral_frames)
            ),
            "missing": len(prepared.missing_lateral_frames),
            "materializedByApply": (
                len(prepared.missing_lateral_frames) if applied else 0
            ),
            "source": "unchanged left/right sheets",
        },
        "normalization": {
            "canvas": list(FRAME_SIZE),
            "globalScale": round(prepared.scale, 6),
            "cellSegmentation": "transparent-gutters-v1",
            "resampling": "nearest",
            "grounding": "bottom-center",
            "phaseValidation": "semantic-v1",
            "phaseComparison": (
                "per-view normalized temporal geometry across six authored "
                "directions"
            ),
        },
        "authoredContract": {
            "handsEmpty": True,
            "authoredDirection": True,
            "fusion": False,
            "mirror": False,
            "projection": False,
            "interpolation": False,
            "phaseSynthesis": False,
        },
        "fingerprint": prepared.fingerprint,
        "backup": (
            web_path(backup_root, prepared.project_root)
            if backup_root is not None
            else None
        ),
        "warnings": prepared.warnings,
        "requiredFollowUp": (
            [
                (
                    "py tools/build-weapon-rigs.py "
                    f"--categories {prepared.category} "
                    f"--ids {prepared.character_id}"
                ),
                "node tools/build-modular-catalog.mjs",
                (
                    "py tools/validate-fps-authored-directions.py "
                    f"--only {prepared.character_id}"
                ),
                "node tools/verify-modular-registry.mjs",
            ]
            if applied
            else []
        ),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Valide puis importe six atlas FPS directionnels réellement dessinés "
            "sans fusion, miroir, projection ni interpolation. La validation "
            "seule est le comportement par défaut."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Contrat source : un atlas PNG par direction, grille exacte 6x5, "
            "lignes idle/move/attack/hurt/death, six phases par ligne, mains "
            "vides. Placez import-input.json et les six fichiers "
            "<direction>-imagegen-raw.png dans le dossier du personnage "
            "sources-authored-six-way-v1. Les banques latérales left/right "
            "ne sont jamais réécrites."
        ),
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        help="Manifeste JSON authored. Les fichiers relatifs partent de son dossier.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Installe transactionnellement les six banques après la prévalidation.",
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=SCRIPT_ROOT,
        help="Racine du projet (défaut : racine détectée depuis cet outil).",
    )
    parser.add_argument(
        "--backup-root",
        type=Path,
        help=(
            "Racine de sauvegarde, obligatoirement sous le projet "
            "(défaut : tmp/fps-authored-import-backups)."
        ),
    )
    parser.add_argument(
        "--print-manifest-template",
        action="store_true",
        help="Affiche un manifeste complet prêt à copier puis quitte.",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Affiche la traceback complète en cas d’échec.",
    )
    args = parser.parse_args()
    if not args.print_manifest_template and args.manifest is None:
        parser.error("--manifest est requis sauf avec --print-manifest-template")
    if args.print_manifest_template and args.apply:
        parser.error("--apply est incompatible avec --print-manifest-template")
    return args


def main() -> int:
    args = parse_args()
    if args.print_manifest_template:
        print(json.dumps(MANIFEST_TEMPLATE, ensure_ascii=False, indent=2))
        return 0

    try:
        project_root = args.root.resolve()
        manifest_path = (
            args.manifest
            if args.manifest.is_absolute()
            else Path.cwd() / args.manifest
        )
        prepared = prepare_import(manifest_path, project_root)
        backup_root: Path | None = None
        if args.apply:
            backup_base = (
                args.backup_root
                if args.backup_root is not None
                else project_root / "tmp" / "fps-authored-import-backups"
            )
            if not backup_base.is_absolute():
                backup_base = project_root / backup_base
            backup_root, _ = apply_import(prepared, backup_base.resolve())
        print(
            json.dumps(
                report_for(prepared, args.apply, backup_root),
                ensure_ascii=False,
                indent=2,
            ),
        )
        return 0
    except Exception as error:
        if args.debug:
            raise
        print(
            json.dumps(
                {
                    "status": "error",
                    "error": str(error),
                    "writesCommitted": False,
                },
                ensure_ascii=False,
                indent=2,
            ),
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
