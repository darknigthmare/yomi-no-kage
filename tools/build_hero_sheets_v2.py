"""Construit les planches haute définition et cohérentes d'Akio.

Les sources OpenAI sont générées animation par animation sous forme de grilles
3x2. Ce packer applique une seule échelle à toutes les poses d'une vue :

- 2D : 6 cellules de 192x160, alpha binaire et palette commune ;
- FPS : 6 cellules de 960x640, alpha doux propre pour le grand viewmodel.

Contrairement à l'ancien pipeline, une pose agenouillée ou couchée n'est jamais
agrandie pour remplir sa cellule. La taille du corps reste donc stable.
"""

from __future__ import annotations

from collections import deque
import json
import math
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageChops, ImageFilter


ANIMATIONS = ("idle", "move", "attack", "hurt", "death")
SOURCE_COLUMNS = 3
SOURCE_ROWS = 2
SIDE_FRAME_SIZE = (192, 160)
FPS_FRAME_SIZE = (960, 640)
SIDE_PALETTE_COLORS = 96
TRANSPARENT = (0, 0, 0, 0)

SIDE_ROOT = Path("assets/modular/characters/player/akio")
FPS_ROOT = Path("assets/modular/fps/player/akio")
SIDE_SOURCE_ROOT = SIDE_ROOT / "sources-v2"
FPS_SOURCE_ROOT = FPS_ROOT / "sources-v2"
FPS_BODY_ROOT = FPS_ROOT / "body"
REGISTRY_PATH = Path("assets/modular/registry.json")
PLAYER_MANIFEST_PATH = Path("assets/modular/manifests/player.json")

SIDE_SOURCE_ARCHIVE = {
    "idle": "call_bQYXZuIywnb54fmtjWDUrCql",
    "move": "call_tPCcq2yEXDCJnl5A47dhqIof",
    "attack": "call_RvLTwyvXClCrv40VLqg6KD10",
    "hurt": "call_06lP8QrSEaUIzL9BPysArQVO",
    "death": "call_h62QhHaSLuGUO237G331npbL",
}
FPS_SOURCE_ARCHIVE = {
    "idle": "call_ycJOzczCQWctdnNBo9mn6Aq2",
    "move": "call_kb07JO3i8cPQXewMv2wFnbJb",
    "attack": "call_as0T5zhq0z4LNHPygO4BW8fH",
    "hurt": "call_RARUWVaKUmum3dl6Nx7Yf4Ou",
    "death": "call_HZfSdkPxYBruRRXW3Iw93Fqu",
}

FPS_ROTATIONS = {
    "idle": [-1.78, -1.76, -1.79, -1.81, -1.77, -1.80],
    "move": [-1.82, -1.76, -1.70, -1.70, -1.78, -1.82],
    "attack": [-1.96, -1.70, -1.38, -0.95, -0.43, 0.08],
    "hurt": [-2.04, -2.25, -2.48, -2.24, -2.02, -1.80],
    "death": [-1.78, -1.28, -0.82, -0.34, 0.10, 0.32],
}

FPS_WEAPON_ALPHA = {
    "idle": [1.0] * 6,
    "move": [1.0] * 6,
    "attack": [1.0] * 6,
    "hurt": [1.0, 0.95, 0.82, 0.72, 0.88, 1.0],
    # Akio lâche son katana dès la première pose de mort. Les mains s'écartent,
    # donc conserver la lame au centre la ferait flotter sans point de contact.
    "death": [0.0] * 6,
}

SIDE_WEAPON_MOUNTS = {
    "idle": [
        [0.5000, 0.4625, -0.62, 1.00], [0.5000, 0.4500, -0.62, 1.00],
        [0.5104, 0.4375, -0.62, 1.00], [0.5000, 0.4500, -0.62, 1.00],
        [0.5000, 0.4625, -0.62, 1.00], [0.5000, 0.4625, -0.62, 1.00],
    ],
    "move": [
        [0.6042, 0.4750, -0.52, 0.92], [0.5833, 0.4875, -0.46, 0.92],
        [0.5625, 0.5000, -0.40, 0.92], [0.5833, 0.4750, -0.48, 0.92],
        [0.6146, 0.4625, -0.56, 0.92], [0.5938, 0.4875, -0.48, 0.92],
    ],
    "attack": [
        [0.3646, 0.4625, -1.42, 1.06], [0.4271, 0.4125, -1.20, 1.08],
        [0.5729, 0.4000, -0.82, 1.10], [0.6771, 0.4375, -0.28, 1.12],
        [0.6979, 0.5500, 0.18, 1.10], [0.5625, 0.5750, 0.52, 1.04],
    ],
    "hurt": [
        [0.4167, 0.5000, -0.22, 0.92], [0.4479, 0.4750, -0.10, 0.90],
        [0.4792, 0.5125, 0.06, 0.88], [0.5104, 0.5375, 0.12, 0.88],
        [0.5312, 0.5125, -0.08, 0.90], [0.5417, 0.4875, -0.30, 0.94],
    ],
    "death": [[0.5, 0.5, 0.0, 1.0, 0.0] for _ in range(6)],
}


def boundaries(length: int, count: int) -> list[int]:
    return [round(index * length / count) for index in range(count + 1)]


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    return image.getchannel("A").getbbox()


def chroma_to_alpha(image: Image.Image) -> Image.Image:
    """Détoure les sources OpenAI sur fond magenta sans dépendre d'intermédiaires."""
    rgba = image.convert("RGBA")
    pixel_data = getattr(rgba, "get_flattened_data", rgba.getdata)
    rgba.putdata(
        [
            TRANSPARENT
            if (
                red >= 180
                and blue >= 150
                and green <= 90
                and red >= green + 80
                and blue >= green + 60
            )
            else (red, green, blue, 255)
            for red, green, blue, _ in pixel_data()
        ]
    )
    return rgba


def connected_components(
    image: Image.Image,
    alpha_threshold: int = 32,
) -> list[dict]:
    """Retourne les composantes 4-connexes opaques d'une cellule."""
    alpha = image.getchannel("A")
    width, height = image.size
    pixels = alpha.load()
    visited = bytearray(width * height)
    components: list[dict] = []

    for start_y in range(height):
        for start_x in range(width):
            start_index = start_y * width + start_x
            if visited[start_index] or pixels[start_x, start_y] < alpha_threshold:
                continue
            visited[start_index] = 1
            queue = deque([(start_x, start_y)])
            indices: list[int] = []
            min_x = max_x = start_x
            min_y = max_y = start_y
            while queue:
                x, y = queue.popleft()
                index = y * width + x
                indices.append(index)
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if nx < 0 or nx >= width or ny < 0 or ny >= height:
                        continue
                    neighbor = ny * width + nx
                    if visited[neighbor] or pixels[nx, ny] < alpha_threshold:
                        continue
                    visited[neighbor] = 1
                    queue.append((nx, ny))
            components.append(
                {
                    "indices": indices,
                    "area": len(indices),
                    "bbox": (min_x, min_y, max_x + 1, max_y + 1),
                }
            )
    components.sort(key=lambda item: item["area"], reverse=True)
    return components


def keep_subject_components(image: Image.Image, view: str) -> Image.Image:
    """Supprime débris et fragments de cellules voisines.

    Le héros 2D forme une seule silhouette. En FPS, les deux bras peuvent être
    séparés : on conserve donc toutes les grandes composantes anatomiques.
    """
    image = image.convert("RGBA")
    components = connected_components(image)
    if not components:
        return Image.new("RGBA", image.size, TRANSPARENT)

    largest = components[0]["area"]
    if view == "side":
        kept = components[:1]
    else:
        kept = [
            component
            for component in components
            if component["area"] >= max(64, largest * 0.10)
        ]

    hard_mask = Image.new("L", image.size, 0)
    mask_pixels = hard_mask.load()
    width = image.width
    for component in kept:
        for index in component["indices"]:
            mask_pixels[index % width, index // width] = 255

    # Récupère les quelques pixels d'antialiasing contigus au sujet, mais pas
    # les poussières éloignées laissées par la génération.
    expanded = hard_mask.filter(ImageFilter.MaxFilter(5))
    original_alpha = image.getchannel("A")
    cleaned_alpha = ImageChops.multiply(original_alpha, expanded)
    cleaned = image.copy()
    cleaned.putalpha(cleaned_alpha)
    return cleaned


def load_source_cells(root: Path, view: str) -> dict[str, list[Image.Image]]:
    result: dict[str, list[Image.Image]] = {}
    for animation in ANIMATIONS:
        source_path = root / f"{animation}.png"
        if not source_path.exists():
            raise FileNotFoundError(f"Source Akio absente : {source_path}")
        source = chroma_to_alpha(Image.open(source_path))
        x_bounds = boundaries(source.width, SOURCE_COLUMNS)
        y_bounds = boundaries(source.height, SOURCE_ROWS)
        cells = []
        for frame in range(6):
            row, column = divmod(frame, SOURCE_COLUMNS)
            cell = source.crop(
                (
                    x_bounds[column],
                    y_bounds[row],
                    x_bounds[column + 1],
                    y_bounds[row + 1],
                )
            )
            cell = keep_subject_components(cell, view)
            if alpha_bbox(cell) is None:
                raise ValueError(f"{source_path}: frame {frame} vide")
            cells.append(cell)
        result[animation] = cells
    return result


def global_scale(
    cells: Iterable[Image.Image],
    frame_size: tuple[int, int],
    padding: tuple[int, int],
) -> float:
    max_width = 1
    max_height = 1
    for cell in cells:
        box = alpha_bbox(cell)
        if box is None:
            continue
        max_width = max(max_width, box[2] - box[0])
        max_height = max(max_height, box[3] - box[1])
    return min(
        (frame_size[0] - padding[0] * 2) / max_width,
        (frame_size[1] - padding[1]) / max_height,
    )


def contact_anchor_x(subject: Image.Image, animation: str) -> float:
    """Estime le pivot horizontal sans recentrer les membres étendus."""
    box = alpha_bbox(subject)
    if box is None:
        return subject.width / 2
    if animation == "death":
        return (box[0] + box[2]) / 2

    alpha = subject.getchannel("A")
    band_height = max(5, round((box[3] - box[1]) * 0.08))
    start_y = max(box[1], box[3] - band_height)
    xs = [
        x
        for y in range(start_y, box[3])
        for x in range(box[0], box[2])
        if alpha.getpixel((x, y)) >= 96
    ]
    if not xs:
        return (box[0] + box[2]) / 2
    return (min(xs) + max(xs)) / 2


def fit_side_cell(
    cell: Image.Image,
    animation: str,
    scale: float,
) -> Image.Image:
    box = alpha_bbox(cell)
    if box is None:
        return Image.new("RGBA", SIDE_FRAME_SIZE, TRANSPARENT)
    anchor_x = contact_anchor_x(cell, animation)
    subject = cell.crop(box)
    width = max(1, round(subject.width * scale))
    height = max(1, round(subject.height * scale))
    subject = subject.resize((width, height), Image.Resampling.LANCZOS)
    subject = subject.filter(ImageFilter.UnsharpMask(radius=0.7, percent=125, threshold=2))

    output = Image.new("RGBA", SIDE_FRAME_SIZE, TRANSPARENT)
    scaled_anchor = (anchor_x - box[0]) * scale
    x = round(SIDE_FRAME_SIZE[0] / 2 - scaled_anchor)
    x = min(max(x, 0), SIDE_FRAME_SIZE[0] - width)
    y = SIDE_FRAME_SIZE[1] - height
    output.alpha_composite(subject, (x, y))
    return output


def fit_fps_cell(cell: Image.Image, scale: float) -> Image.Image:
    box = alpha_bbox(cell)
    if box is None:
        return Image.new("RGBA", FPS_FRAME_SIZE, TRANSPARENT)
    subject = cell.crop(box)
    width = max(1, round(subject.width * scale))
    height = max(1, round(subject.height * scale))
    subject = subject.resize((width, height), Image.Resampling.LANCZOS)
    subject = subject.filter(ImageFilter.UnsharpMask(radius=1.0, percent=135, threshold=2))
    output = Image.new("RGBA", FPS_FRAME_SIZE, TRANSPARENT)
    x = (FPS_FRAME_SIZE[0] - width) // 2
    y = FPS_FRAME_SIZE[1] - height
    output.alpha_composite(subject, (x, y))
    return clear_visible_magenta(output)


def clear_visible_magenta(image: Image.Image) -> Image.Image:
    """Supprime les derniers pixels de chroma visibles après redimensionnement."""
    output = image.convert("RGBA")
    pixel_data = getattr(output, "get_flattened_data", output.getdata)
    output.putdata(
        [
            TRANSPARENT
            if (
                alpha > 0
                and red >= 180
                and blue >= 150
                and green <= 90
                and red >= green + 80
                and blue >= green + 60
            )
            else (red, green, blue, alpha)
            for red, green, blue, alpha in pixel_data()
        ]
    )
    return output


def shared_palette(frames: Iterable[Image.Image], colors: int) -> Image.Image:
    opaque_pixels: list[tuple[int, int, int]] = []
    for frame in frames:
        rgba = frame.convert("RGBA")
        pixel_data = getattr(rgba, "get_flattened_data", rgba.getdata)
        for red, green, blue, alpha in pixel_data():
            if alpha >= 96:
                opaque_pixels.append((red, green, blue))
    if not opaque_pixels:
        raise ValueError("Impossible de construire une palette depuis des frames vides")

    max_samples = 240_000
    if len(opaque_pixels) > max_samples:
        stride = math.ceil(len(opaque_pixels) / max_samples)
        opaque_pixels = opaque_pixels[::stride]
    width = 512
    height = math.ceil(len(opaque_pixels) / width)
    sample = Image.new("RGB", (width, height), (0, 0, 0))
    sample.putdata(opaque_pixels + [(0, 0, 0)] * (width * height - len(opaque_pixels)))
    return sample.quantize(
        colors=colors,
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    )


def apply_side_palette(frame: Image.Image, palette: Image.Image) -> Image.Image:
    alpha = frame.getchannel("A").point(lambda value: 255 if value >= 96 else 0)
    rgb = frame.convert("RGB").quantize(
        palette=palette,
        dither=Image.Dither.NONE,
    ).convert("RGB")
    output = rgb.convert("RGBA")
    output.putalpha(alpha)
    pixel_data = getattr(output, "get_flattened_data", output.getdata)
    pixels = list(pixel_data())
    output.putdata(
        [
            (red, green, blue, 255) if alpha_value else TRANSPARENT
            for red, green, blue, alpha_value in pixels
        ]
    )
    return output


def save_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.tmp")
    try:
        image.save(temporary, format="PNG", optimize=True)
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def write_json_atomic(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.tmp")
    try:
        temporary.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def skin_centroid(frame: Image.Image) -> tuple[float, float]:
    """Approxime le centre de prise FPS depuis les pixels de peau."""
    candidates: list[tuple[int, int]] = []
    for y in range(frame.height):
        for x in range(frame.width):
            red, green, blue, alpha = frame.getpixel((x, y))
            if (
                alpha >= 64
                and red >= 105
                and green >= 55
                and blue <= 155
                and red >= green + 24
                and green >= blue - 8
            ):
                candidates.append((x, y))
    if not candidates:
        return (0.5, 0.52)
    return (
        sum(x for x, _ in candidates) / len(candidates) / frame.width,
        sum(y for _, y in candidates) / len(candidates) / frame.height,
    )


def build_side_sheets() -> tuple[dict[str, str], dict[str, list[str]], dict]:
    cells = load_source_cells(SIDE_SOURCE_ROOT, "side")
    scale = global_scale(
        (cell for frames in cells.values() for cell in frames),
        SIDE_FRAME_SIZE,
        padding=(4, 4),
    )
    fitted = {
        animation: [
            fit_side_cell(cell, animation, scale)
            for cell in cells[animation]
        ]
        for animation in ANIMATIONS
    }
    palette = shared_palette(
        (frame for frames in fitted.values() for frame in frames),
        SIDE_PALETTE_COLORS,
    )
    fitted = {
        animation: [apply_side_palette(frame, palette) for frame in frames]
        for animation, frames in fitted.items()
    }

    sheet_paths: dict[str, str] = {}
    frame_paths: dict[str, list[str]] = {}
    master = Image.new(
        "RGBA",
        (SIDE_FRAME_SIZE[0] * 6, SIDE_FRAME_SIZE[1] * len(ANIMATIONS)),
        TRANSPARENT,
    )
    animation_records: dict[str, list[dict]] = {}

    for row, animation in enumerate(ANIMATIONS):
        sheet = Image.new(
            "RGBA",
            (SIDE_FRAME_SIZE[0] * 6, SIDE_FRAME_SIZE[1]),
            TRANSPARENT,
        )
        animation_records[animation] = []
        frame_paths[animation] = []
        for frame_index, frame in enumerate(fitted[animation]):
            x = frame_index * SIDE_FRAME_SIZE[0]
            sheet.alpha_composite(frame, (x, 0))
            master.alpha_composite(frame, (x, row * SIDE_FRAME_SIZE[1]))
            frame_path = SIDE_ROOT / "frames" / animation / f"{frame_index:02d}.png"
            save_png(frame, frame_path)
            web_path = frame_path.as_posix()
            frame_paths[animation].append(web_path)
            animation_records[animation].append(
                {
                    "index": frame_index,
                    "file": f"frames/{animation}/{frame_index:02d}.png",
                    "rect": [x, row * SIDE_FRAME_SIZE[1], *SIDE_FRAME_SIZE],
                    "nonEmpty": alpha_bbox(frame) is not None,
                }
            )
        sheet_path = SIDE_ROOT / "sheets" / f"{animation}.png"
        save_png(sheet, sheet_path)
        sheet_paths[animation] = sheet_path.as_posix()

    save_png(master, SIDE_ROOT / "master.png")
    sprite_record = {
        "schema": 2,
        "master": "master.png",
        "generationTool": "OpenAI ImageGen built-in",
        "sourceLayout": {"columns": SOURCE_COLUMNS, "rows": SOURCE_ROWS},
        "sourceArchive": {
            "provider": "OpenAI ImageGen built-in",
            "layoutPerAnimation": "3x2",
            "generationIds": SIDE_SOURCE_ARCHIVE,
            "sourceFiles": {
                animation: f"sources-v2/{animation}.png"
                for animation in ANIMATIONS
            },
        },
        "grid": {"columns": 6, "rows": len(ANIMATIONS)},
        "frameWidth": SIDE_FRAME_SIZE[0],
        "frameHeight": SIDE_FRAME_SIZE[1],
        "renderedLogicalSize": [96, 80],
        "groundAnchor": {
            "normalized": [0.5, 1.0],
            "baseline": "bottom-edge",
            "transparentPaddingBelowFeet": 0,
        },
        "normalization": {
            "strategy": "single-global-scale",
            "scale": round(scale, 6),
            "perPoseScaling": False,
            "sharedPaletteColors": SIDE_PALETTE_COLORS,
            "alphaMode": "binary",
        },
        "animations": animation_records,
        "weaponsBakedIntoBody": False,
        "weaponMountsPerFrame": True,
        "weaponMount": {
            "normalized": True,
            "perFrame": True,
            "coordinateSpace": "renderedLogicalSize",
            "renderOrder": "behind-body",
            "animations": SIDE_WEAPON_MOUNTS,
        },
    }
    write_json_atomic(SIDE_ROOT / "sprite.json", sprite_record)
    return sheet_paths, frame_paths, sprite_record


def build_fps_sheets() -> tuple[dict[str, str], dict[str, list[str]], dict]:
    cells = load_source_cells(FPS_SOURCE_ROOT, "fps")
    scale = global_scale(
        (cell for frames in cells.values() for cell in frames),
        FPS_FRAME_SIZE,
        padding=(8, 0),
    )
    fitted = {
        animation: [fit_fps_cell(cell, scale) for cell in cells[animation]]
        for animation in ANIMATIONS
    }

    sheet_paths: dict[str, str] = {}
    frame_paths: dict[str, list[str]] = {}
    animation_records: dict[str, list[dict]] = {}
    for animation in ANIMATIONS:
        sheet = Image.new(
            "RGBA",
            (FPS_FRAME_SIZE[0] * 6, FPS_FRAME_SIZE[1]),
            TRANSPARENT,
        )
        animation_records[animation] = []
        frame_paths[animation] = []
        for frame_index, frame in enumerate(fitted[animation]):
            x = frame_index * FPS_FRAME_SIZE[0]
            sheet.alpha_composite(frame, (x, 0))
            frame_path = FPS_BODY_ROOT / "frames" / animation / f"{frame_index:02d}.png"
            save_png(frame, frame_path)
            web_path = frame_path.as_posix()
            frame_paths[animation].append(web_path)

            grip_x, grip_y = skin_centroid(frame)
            weapon_mount = [
                round(grip_x, 4),
                round(grip_y, 4),
                FPS_ROTATIONS[animation][frame_index],
                1.0,
                FPS_WEAPON_ALPHA[animation][frame_index],
            ]
            animation_records[animation].append(
                {
                    "index": frame_index,
                    "file": f"frames/{animation}/{frame_index:02d}.png",
                    "weaponMount": weapon_mount,
                }
            )
        sheet_path = FPS_BODY_ROOT / "sheets" / f"{animation}.png"
        save_png(sheet, sheet_path)
        sheet_paths[animation] = sheet_path.as_posix()

    sprite_record = {
        "schema": 2,
        "view": "first-person-player",
        "generationTool": "OpenAI ImageGen built-in",
        "sourceLayout": {"columns": SOURCE_COLUMNS, "rows": SOURCE_ROWS},
        "sourceArchive": {
            "provider": "OpenAI ImageGen built-in",
            "layoutPerAnimation": "3x2",
            "generationIds": FPS_SOURCE_ARCHIVE,
            "sourceFiles": {
                animation: f"../sources-v2/{animation}.png"
                for animation in ANIMATIONS
            },
        },
        "grid": {"columns": 6, "rows": 5},
        "frameWidth": FPS_FRAME_SIZE[0],
        "frameHeight": FPS_FRAME_SIZE[1],
        "renderedLogicalSize": [480, 320],
        "normalization": {
            "strategy": "single-global-scale",
            "scale": round(scale, 6),
            "perPoseScaling": False,
            "alphaMode": "straight-transparent",
        },
        "animations": animation_records,
        "renderOrder": ["weapon", "body"],
        "weaponsBakedIntoBody": False,
    }
    write_json_atomic(FPS_BODY_ROOT / "sprite.json", sprite_record)
    return sheet_paths, frame_paths, sprite_record


def update_registry(
    side_sheets: dict[str, str],
    side_frames: dict[str, list[str]],
    fps_sheets: dict[str, str],
    fps_frames: dict[str, list[str]],
    fps_record: dict,
) -> None:
    if not REGISTRY_PATH.exists():
        return
    registry = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    player = next(
        (
            entry
            for entry in registry.get("characters", [])
            if entry.get("category") == "player"
        ),
        None,
    )
    if player is not None:
        player["animations"] = side_sheets
        player["frames"] = side_frames
        player["sprite"] = (SIDE_ROOT / "sprite.json").as_posix()
        player["fpsAnimations"] = fps_sheets
        player["fpsFrames"] = fps_frames
        player["fpsSprite"] = (FPS_BODY_ROOT / "sprite.json").as_posix()
        player["fpsWeaponMounts"] = {
            animation: [
                frame["weaponMount"]
                for frame in fps_record["animations"][animation]
            ]
            for animation in ANIMATIONS
        }
        player["generation"] = {
            "tool": "OpenAI ImageGen built-in",
            "revision": 2,
            "separateSourceSheetPerAnimation": True,
            "consistentGlobalScale": True,
            "weaponsBakedIntoBody": False,
        }
    registry.setdefault("fps", {})
    registry["fps"]["playerFrameSize"] = list(FPS_FRAME_SIZE)
    registry["fps"]["playerSource"] = (
        "Five OpenAI ImageGen 3x2 source sheets normalized with one global scale"
    )
    write_json_atomic(REGISTRY_PATH, registry)


def update_player_manifest() -> None:
    if not PLAYER_MANIFEST_PATH.exists():
        return
    manifest = json.loads(PLAYER_MANIFEST_PATH.read_text(encoding="utf-8"))
    manifest["schema"] = 2
    manifest["animationStandard"] = {
        "rows": list(ANIMATIONS),
        "framesPerRow": 6,
        "sideFrameSize": list(SIDE_FRAME_SIZE),
        "fpsFrameSize": list(FPS_FRAME_SIZE),
        "singleGlobalScale": True,
        "weaponsBakedIntoBody": False,
    }
    entry = manifest.get("entries", [{}])[0]
    entry["gameplay"] = (
        "Héros jouable. Cinq planches 2D et cinq planches FPS de six frames, "
        "générées séparément puis normalisées à échelle constante. Les dix "
        "katanas restent des sprites indépendants."
    )
    entry["promptPack"] = {
        "revision": 2,
        "tool": "OpenAI ImageGen built-in",
        "layoutPerAnimation": "3x2",
        "sourceSheets2d": f"{SIDE_ROOT.as_posix()}/sources-v2",
        "sourceSheetsFps": f"{FPS_ROOT.as_posix()}/sources-v2",
        "sourceArchive2d": SIDE_SOURCE_ARCHIVE,
        "sourceArchiveFps": FPS_SOURCE_ARCHIVE,
    }
    write_json_atomic(PLAYER_MANIFEST_PATH, manifest)


def main() -> None:
    side_sheets, side_frames, side_record = build_side_sheets()
    fps_sheets, fps_frames, fps_record = build_fps_sheets()
    update_registry(
        side_sheets,
        side_frames,
        fps_sheets,
        fps_frames,
        fps_record,
    )
    update_player_manifest()
    print(
        json.dumps(
            {
                "side": {
                    "frameSize": list(SIDE_FRAME_SIZE),
                    "sheets": len(side_sheets),
                    "frames": sum(map(len, side_frames.values())),
                    "scale": side_record["normalization"]["scale"],
                    "paletteColors": SIDE_PALETTE_COLORS,
                },
                "fps": {
                    "frameSize": list(FPS_FRAME_SIZE),
                    "sheets": len(fps_sheets),
                    "frames": sum(map(len, fps_frames.values())),
                    "scale": fps_record["normalization"]["scale"],
                },
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
