#!/usr/bin/env python3
"""Build eight explicit Doom-style view banks for every modular enemy.

The historical roster owns a lateral OpenAI sprite bank.  This builder keeps
that detailed left profile, writes a real right-facing bitmap bank, bakes
front/back axial projections, and exports four 45-degree bitmap banks instead
of asking the canvas renderer to splice mirrored halves at runtime.

Cross-era characters can additionally provide:

  assets/modular/fps/characters/<category>/<id>/sources-directional/
    front-imagegen-raw.png
    back-imagegen-raw.png

Those ImageGen atlases are keyed, segmented, normalized, and used as the
authoritative front/back animation sources.  The runtime contract written to
``sprite.json`` is deliberately explicit:

  fpsDirections.<8 logical directions>.animations.<action>
  fpsDirections.<8 logical directions>.frames.<action>[6]

All output is raster PNG.  Weapons remain separate sprites.
"""

from __future__ import annotations

import argparse
from collections import deque
import hashlib
from io import BytesIO
import json
import math
from pathlib import Path
from statistics import median
from typing import Any, Iterable

from PIL import Image, ImageDraw, ImageEnhance, ImageOps

from sprite_pipeline import (
    clean_pose_fragments,
    connected_pose_segments,
    infer_equal_columns,
)


ROOT = Path(__file__).resolve().parents[1]
CHARACTER_ROOT = ROOT / "assets" / "modular" / "characters"
FPS_ROOT = ROOT / "assets" / "modular" / "fps" / "characters"
ANIMATIONS = ("idle", "move", "attack", "hurt", "death")
CARDINAL_DIRECTIONS = ("front", "back", "left", "right")
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
DIAGONAL_CONTRACT = {
    "front-left": ("front", "left"),
    "back-left": ("back", "left"),
    "back-right": ("back", "right"),
    "front-right": ("front", "right"),
}
FRAME_SIZE = (96, 128)
SHEET_SIZE = (FRAME_SIZE[0] * 6, FRAME_SIZE[1])
TRANSPARENT = (0, 0, 0, 0)
VISIBLE_ALPHA = 32


IMAGEGEN_CALLS: dict[str, dict[str, str]] = {
    "new-modern-commuter": {
        "front": "call_Ud8HqPkoqgw8eFKkhxAswmo2",
        "back": "call_90sTMicNuos9JZ9DkfV1WtAK",
    },
    "new-modern-riot-host": {
        "front": "call_BJexjiCnnlcGJaUg6fJ9wWxw",
        "back": "call_QWAFSfZEPoS3J8gbSdlGmqQw",
    },
    "new-modern-response-officer": {
        "front": "call_E37eaQgNuhmw4309ikCMxKpw",
        "back": "call_NXCW9QLSpE3WVACT4RQ7P5As",
    },
    "new-cyber-neon-shinobi": {
        "front": "call_Ht2t27ROBDFj8QJIz27js0ir",
        "back": "call_kroSo1HWoWXOawiboGick8kp",
    },
    "new-cyber-drone-corpse": {
        "front": "call_OEhEevHug58V8O1geWD76iH3",
        "back": "call_LogJaKdgt5y2ZJemJmbMF92v",
    },
    "new-cyber-oni-frame": {
        "front": "call_I2yju1xHnI4INBx2XX18VZWd",
        "back": "call_DdQOLjH0s70VggygCoPv4YXY",
    },
    "new-modern-metro-colossus": {
        "front": "call_JZCJV9QXHVHrqbygXboRtfUH",
        "back": "call_V8S7iPnP7wxIxI0edQGYNQtS",
    },
    "new-cyber-yomi-hacker": {
        "front": "call_2FdxCXHXP9g2UN5IVf5dnBYG",
        "back": "call_jWIDZYLPDjzFsMoN85IUbiJd",
    },
    "new-cyber-shogun-zero": {
        "front": "call_lteUlZMRphgdYBeawjyc9DB5",
        "back": "call_TBGa1YiNB0LS96axKhufXjWi",
    },
}


def web_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def save_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        image.save(path, format="PNG", optimize=True)
    except OSError as error:
        # Some managed Windows workspaces temporarily reject Create/Truncate
        # on an existing tracked PNG (errno 22) while still allowing in-place
        # writes. Preserve the same lossless encoder and replace its bytes.
        if error.errno != 22 or not path.exists():
            raise
        encoded = BytesIO()
        image.save(encoded, format="PNG", optimize=True)
        with path.open("r+b") as output:
            output.seek(0)
            output.write(encoded.getvalue())
            output.truncate()


def pixels(image: Image.Image) -> Iterable[tuple[int, int, int, int]]:
    getter = getattr(image, "get_flattened_data", image.getdata)
    return getter()


def clear_transparent_rgb(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    rgba.putdata(
        [
            (r, g, b, 255) if a >= VISIBLE_ALPHA else TRANSPARENT
            for r, g, b, a in pixels(rgba)
        ],
    )
    return rgba


def ground_frame(image: Image.Image) -> Image.Image:
    """Move visible pixels to the declared y=128 ground anchor."""

    rgba = clear_transparent_rgb(image)
    bounds = rgba.getchannel("A").getbbox()
    if not bounds or bounds[3] == FRAME_SIZE[1]:
        return rgba
    grounded = Image.new("RGBA", FRAME_SIZE, TRANSPARENT)
    grounded.alpha_composite(rgba, (0, FRAME_SIZE[1] - bounds[3]))
    return clear_transparent_rgb(grounded)


def distinct_frame_sequence(frames: list[Image.Image]) -> list[Image.Image]:
    """Keep six authored beats distinct after small raster projections."""

    result: list[Image.Image] = []
    hashes: set[str] = set()
    for index, source in enumerate(frames):
        candidate = ground_frame(source)
        digest = hashlib.sha256(candidate.tobytes()).hexdigest()
        attempt = 0
        while digest in hashes:
            attempt += 1
            bounds = candidate.getchannel("A").getbbox()
            if not bounds:
                break
            crop = candidate.crop(bounds)
            target_width = max(1, crop.width - attempt)
            collapsed = crop.resize(
                (target_width, crop.height),
                Image.Resampling.NEAREST,
            )
            candidate = Image.new("RGBA", FRAME_SIZE, TRANSPARENT)
            candidate.alpha_composite(
                collapsed,
                ((FRAME_SIZE[0] - target_width) // 2, FRAME_SIZE[1] - crop.height),
            )
            candidate = clear_transparent_rgb(candidate)
            digest = hashlib.sha256(candidate.tobytes()).hexdigest()
        hashes.add(digest)
        result.append(candidate)
    return result


def quantize_rgba(image: Image.Image, colors: int = 128) -> Image.Image:
    rgba = clear_transparent_rgb(image)
    alpha = rgba.getchannel("A")
    quantized = rgba.convert("RGB").quantize(
        colors=colors,
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    ).convert("RGBA")
    quantized.putalpha(alpha)
    return clear_transparent_rgb(quantized)


def border_key(image: Image.Image) -> tuple[int, int, int]:
    rgb = image.convert("RGB")
    width, height = rgb.size
    sample: list[tuple[int, int, int]] = []
    step_x = max(1, width // 32)
    step_y = max(1, height // 32)
    for x in range(0, width, step_x):
        sample.append(rgb.getpixel((x, 0)))
        sample.append(rgb.getpixel((x, height - 1)))
    for y in range(0, height, step_y):
        sample.append(rgb.getpixel((0, y)))
        sample.append(rgb.getpixel((width - 1, y)))
    return (
        round(median(color[0] for color in sample)),
        round(median(color[1] for color in sample)),
        round(median(color[2] for color in sample)),
    )


def color_distance(left: tuple[int, int, int], right: tuple[int, int, int]) -> float:
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(left, right)))


def chroma_to_alpha(source: Image.Image) -> tuple[Image.Image, tuple[int, int, int]]:
    """Remove a nearly-flat ImageGen key while preserving enclosed accents."""

    image = source.convert("RGBA")
    width, height = image.size
    key = border_key(image)
    source_pixels = image.load()
    visited = bytearray(width * height)
    background = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    # The generated green/yellow canvases vary slightly because the built-in
    # image path preserves display colour.  Flooding from the border prevents
    # similarly-coloured isolated costume accents from disappearing.
    threshold = 104.0

    def visit(x: int, y: int) -> None:
        index = y * width + x
        if visited[index]:
            return
        visited[index] = 1
        red, green, blue, _ = source_pixels[x, y]
        if color_distance((red, green, blue), key) <= threshold:
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
        if x:
            visit(x - 1, y)
        if x + 1 < width:
            visit(x + 1, y)
        if y:
            visit(x, y - 1)
        if y + 1 < height:
            visit(x, y + 1)

    result = Image.new("RGBA", image.size, TRANSPARENT)
    output = result.load()
    for y in range(height):
        for x in range(width):
            index = y * width + x
            red, green, blue, alpha = source_pixels[x, y]
            # Remove enclosed pockets that are still extremely close to the
            # sampled key; all subjects were prompted to exclude that colour.
            close_key = color_distance((red, green, blue), key) <= 48.0
            if not background[index] and not close_key and alpha:
                output[x, y] = (red, green, blue, 255)
    return quantize_rgba(result), key


def occupied_bands(image: Image.Image) -> list[tuple[int, int]]:
    alpha = image.getchannel("A")
    width, height = image.size
    threshold = max(4, round(width * 0.004))
    occupied = [
        sum(1 for x in range(width) if alpha.getpixel((x, y)) >= VISIBLE_ALPHA)
        >= threshold
        for y in range(height)
    ]
    bands: list[tuple[int, int]] = []
    start: int | None = None
    last = -1
    max_gap = max(3, round(height * 0.008))
    for y, active in enumerate(occupied):
        if active:
            if start is None:
                start = y
            last = y
        elif start is not None and y - last > max_gap:
            bands.append((start, last + 1))
            start = None
    if start is not None:
        bands.append((start, last + 1))
    minimum_height = max(12, round(height * 0.025))
    return [band for band in bands if band[1] - band[0] >= minimum_height]


def equal_bounds(length: int, count: int) -> list[int]:
    return [round(index * length / count) for index in range(count + 1)]


def row_bands(image: Image.Image, count: int = 5) -> list[tuple[int, int]]:
    detected = occupied_bands(image)
    if len(detected) >= count:
        # The commuter source contains front and back in one atlas.  Its first
        # five rows are the authoritative front bank.
        return detected[:count]
    bounds = equal_bounds(image.height, count)
    return list(zip(bounds[:-1], bounds[1:]))


def pose_segments(band: Image.Image) -> list[tuple[int, int]]:
    connected = connected_pose_segments(band)
    if len(connected) >= 5:
        return connected
    inferred, _ = infer_equal_columns(band, minimum=5, maximum=7)
    bounds = equal_bounds(band.width, inferred)
    return list(zip(bounds[:-1], bounds[1:]))


def normalize_pose(source: Image.Image) -> Image.Image:
    source = clear_transparent_rgb(source)
    box = source.getchannel("A").getbbox()
    if box is None:
        return Image.new("RGBA", FRAME_SIZE, TRANSPARENT)
    pose = source.crop(box)
    scale = min(
        (FRAME_SIZE[0] - 4) / max(1, pose.width),
        FRAME_SIZE[1] / max(1, pose.height),
    )
    size = (
        max(1, math.floor(pose.width * scale)),
        max(1, math.floor(pose.height * scale)),
    )
    pose = pose.resize(size, Image.Resampling.NEAREST)
    pose = clear_transparent_rgb(pose)
    box = pose.getchannel("A").getbbox()
    if box is not None:
        pose = pose.crop(box)
    output = Image.new("RGBA", FRAME_SIZE, TRANSPARENT)
    x = (FRAME_SIZE[0] - pose.width) // 2
    y = FRAME_SIZE[1] - pose.height
    output.alpha_composite(pose, (x, y))
    return quantize_rgba(output)


def phase_warp(image: Image.Image, phase: int) -> Image.Image:
    """Create a one-pixel authored in-between without blurring pixel clusters."""

    output = Image.new("RGBA", image.size, TRANSPARENT)
    strength = (-2, -1, 1, 2, -1, 1)[phase % 6]
    split = round(image.height * 0.58)
    upper = image.crop((0, 0, image.width, split))
    lower = image.crop((0, split, image.width, image.height))
    output.alpha_composite(upper, (strength, 0))
    output.alpha_composite(lower, (0, split))
    box = output.getchannel("A").getbbox()
    if box and box[3] < output.height:
        output = Image.new("RGBA", image.size, TRANSPARENT)
        output.alpha_composite(image, (strength, image.height - box[3]))
    return clear_transparent_rgb(output)


def six_phase_sequence(frames: list[Image.Image]) -> list[Image.Image]:
    if not frames:
        raise ValueError("ImageGen row has no usable pose")
    selected: list[Image.Image] = []
    for index in range(6):
        source_index = round(index * (len(frames) - 1) / 5)
        candidate = frames[source_index].copy()
        digest = hashlib.sha256(candidate.tobytes()).digest()
        if any(hashlib.sha256(frame.tobytes()).digest() == digest for frame in selected):
            candidate = phase_warp(candidate, index)
        selected.append(candidate)
    return selected


def imagegen_direction_frames(source_path: Path) -> dict[str, list[Image.Image]]:
    keyed, _ = chroma_to_alpha(Image.open(source_path))
    result: dict[str, list[Image.Image]] = {}
    for animation, (y0, y1) in zip(ANIMATIONS, row_bands(keyed)):
        band = keyed.crop((0, y0, keyed.width, y1))
        poses: list[Image.Image] = []
        for x0, x1 in pose_segments(band):
            cell = clean_pose_fragments(band.crop((x0, 0, x1, band.height)))
            if cell.getchannel("A").getbbox() is not None:
                poses.append(normalize_pose(cell))
        result[animation] = six_phase_sequence(poses)
    if set(result) != set(ANIMATIONS):
        raise ValueError(f"{source_path}: incomplete ImageGen action rows")
    return result


def normalized_lateral_frame(path: Path) -> Image.Image:
    return normalize_pose(Image.open(path).convert("RGBA"))


def lateral_frames(character_folder: Path, sprite: dict[str, Any]) -> dict[str, list[Image.Image]]:
    result: dict[str, list[Image.Image]] = {}
    for animation in ANIMATIONS:
        records = sprite.get("animations", {}).get(animation, [])
        if len(records) != 6:
            raise ValueError(
                f"{character_folder.relative_to(ROOT)}/{animation}: "
                f"{len(records)} frames, expected 6"
            )
        result[animation] = [
            normalized_lateral_frame(character_folder / record["file"])
            for record in records
        ]
    return result


def palette_accents(image: Image.Image) -> tuple[tuple[int, int, int, int], tuple[int, int, int, int]]:
    colors = image.getcolors(maxcolors=image.width * image.height) or []
    visible = [
        (count, color)
        for count, color in colors
        if color[3] and sum(color[:3]) > 60
    ]
    visible.sort(reverse=True)
    base = visible[0][1] if visible else (72, 66, 70, 255)
    bright = max(
        (color for _, color in visible),
        key=lambda color: max(color[:3]) - min(color[:3]) + sum(color[:3]) * 0.15,
        default=(176, 214, 104, 255),
    )
    return base, bright


def procedural_axial(source: Image.Image, direction: str) -> Image.Image:
    """Bake a stable front/back projection for historical lateral masters.

    The complete lateral pose is projected exactly once. No half-body splice,
    alpha blend, or second silhouette participates in the result.
    """

    source = ground_frame(source)
    box = source.getchannel("A").getbbox()
    if box is None:
        return source.copy()
    pose = source.crop(box)
    pose_width, pose_height = pose.size
    if direction == "back":
        pose = ImageOps.mirror(pose)
    target_width = max(8, min(FRAME_SIZE[0] - 6, round(pose_width * 0.72)))
    axial = pose.resize((target_width, pose_height), Image.Resampling.NEAREST)
    axial = clear_transparent_rgb(axial)

    # Keep the head/upper torso on the optical centre. This makes the frontal
    # read stable even when a lateral attack pose extends one arm far forward.
    axial_bounds = axial.getchannel("A").getbbox()
    head_center = axial.width / 2
    if axial_bounds:
        head_bottom = axial_bounds[1] + max(
            2,
            round((axial_bounds[3] - axial_bounds[1]) * 0.3),
        )
        head_x = [
            x
            for y in range(axial_bounds[1], min(axial.height, head_bottom))
            for x in range(axial_bounds[0], axial_bounds[2])
            if axial.getpixel((x, y))[3]
        ]
        if head_x:
            head_center = sum(head_x) / len(head_x)

    canvas = Image.new("RGBA", FRAME_SIZE, TRANSPARENT)
    paste_x = round(FRAME_SIZE[0] / 2 - head_center)
    paste_x = max(2 - axial_bounds[0], paste_x) if axial_bounds else paste_x
    if axial_bounds:
        paste_x = min(
            FRAME_SIZE[0] - 2 - axial_bounds[2],
            paste_x,
        )
    canvas.alpha_composite(
        axial,
        (paste_x, FRAME_SIZE[1] - axial.height),
    )

    bounds = canvas.getchannel("A").getbbox()
    if bounds and direction == "front":
        _, accent = palette_accents(canvas)
        center_x = FRAME_SIZE[0] // 2
        eye_y = bounds[1] + max(2, round((bounds[3] - bounds[1]) * 0.14))
        eye_gap = max(2, round((bounds[2] - bounds[0]) * 0.055))
        canvas_pixels = canvas.load()
        for target_x in (center_x - eye_gap, center_x + eye_gap):
            nearest = None
            nearest_distance = 999
            for y in range(max(bounds[1], eye_y - 4), min(bounds[3], eye_y + 5)):
                for x in range(max(bounds[0], target_x - 4), min(bounds[2], target_x + 5)):
                    if not canvas_pixels[x, y][3]:
                        continue
                    distance = abs(x - target_x) + abs(y - eye_y)
                    if distance < nearest_distance:
                        nearest = (x, y)
                        nearest_distance = distance
            if nearest:
                canvas_pixels[nearest[0], nearest[1]] = accent
    elif bounds and direction == "back":
        base, _ = palette_accents(canvas)
        center_x = FRAME_SIZE[0] // 2
        seam_top = bounds[1] + round((bounds[3] - bounds[1]) * 0.23)
        seam_bottom = bounds[1] + round((bounds[3] - bounds[1]) * 0.58)
        seam = tuple(max(0, round(channel * 0.54)) for channel in base[:3]) + (255,)
        canvas_pixels = canvas.load()
        head_bottom = bounds[1] + round((bounds[3] - bounds[1]) * 0.3)
        for y in range(bounds[1], min(bounds[3], head_bottom)):
            for x in range(bounds[0], bounds[2]):
                red, green, blue, alpha = canvas_pixels[x, y]
                if alpha:
                    canvas_pixels[x, y] = (
                        round(red * 0.25),
                        round(green * 0.27),
                        round(blue * 0.32),
                        alpha,
                    )
        for y in range(seam_top, seam_bottom + 1):
            if 0 <= y < FRAME_SIZE[1] and canvas_pixels[center_x, y][3]:
                canvas_pixels[center_x, y] = seam
    return quantize_rgba(ground_frame(canvas))


def diagonal_view(
    axial: Image.Image,
    side_name: str,
) -> Image.Image:
    """Project one axial silhouette into a crisp 45-degree bitmap.

    A diagonal must never superimpose two complete animation poses.  The axial
    frame therefore owns the entire silhouette; a nearest-neighbour horizontal
    squash plus a height-dependent lean turns it toward the requested side.
    """

    axial = clear_transparent_rgb(axial)
    bounds = axial.getchannel("A").getbbox()
    if not bounds:
        return axial
    axial_pixels = axial.load()
    output = Image.new("RGBA", FRAME_SIZE, TRANSPARENT)
    output_pixels = output.load()
    center = (bounds[0] + bounds[2] - 1) / 2
    top, bottom = bounds[1], bounds[3]
    body_height = max(1, bottom - top)
    side_sign = -1 if side_name == "left" else 1
    horizontal_scale = 0.86

    for y in range(top, bottom):
        height_ratio = (bottom - 1 - y) / body_height
        # The head/shoulders rotate farther than the grounded feet.  Every
        # destination pixel samples exactly one source pixel: no ghost limbs.
        lean = side_sign * round(1 + height_ratio * 4)
        for x in range(FRAME_SIZE[0]):
            source_x = round(center + (x - lean - center) / horizontal_scale)
            if 0 <= source_x < FRAME_SIZE[0]:
                source_pixel = axial_pixels[source_x, y]
                if source_pixel[3]:
                    output_pixels[x, y] = source_pixel

    return quantize_rgba(output)


def build_direction_banks(
    category: str,
    character_id: str,
    character_folder: Path,
    sprite: dict[str, Any],
) -> tuple[dict[str, Any], dict[str, str]]:
    fps_folder = FPS_ROOT / category / character_id
    lateral = lateral_frames(character_folder, sprite)
    source_modes: dict[str, str] = {
        "left": "OpenAI lateral master normalized",
        "right": "OpenAI lateral master, explicit right-facing bitmap",
    }
    direction_frames: dict[str, dict[str, list[Image.Image]]] = {
        "left": lateral,
        "right": {
            animation: [clear_transparent_rgb(ImageOps.mirror(frame)) for frame in frames]
            for animation, frames in lateral.items()
        },
    }

    for direction in ("front", "back"):
        source_path = fps_folder / "sources-directional" / f"{direction}-imagegen-raw.png"
        direction_frames[direction] = {
            animation: [
                procedural_axial(frame, direction)
                for frame in frames
            ]
            for animation, frames in lateral.items()
        }
        if source_path.exists():
            source_modes[direction] = (
                "Frame-locked OpenAI lateral sequence with single-silhouette "
                f"{direction} projection; authored raw atlas retained as source reference"
            )
        else:
            source_modes[direction] = (
                "OpenAI lateral master with frame-locked single-silhouette "
                f"{direction} projection"
            )

    for direction, (axial_direction, side_direction) in DIAGONAL_CONTRACT.items():
        direction_frames[direction] = {
            animation: [
                diagonal_view(axial, side_direction)
                for axial in direction_frames[axial_direction][animation]
            ]
            for animation in ANIMATIONS
        }
        source_modes[direction] = (
            f"Derived single-silhouette 45-degree pixel projection from "
            f"{axial_direction} toward {side_direction}"
        )

    fps_directions: dict[str, Any] = {}
    for direction in DIRECTIONS:
        # The root bank remains the backwards-compatible left profile.
        bank_root = fps_folder if direction == "left" else fps_folder / "directions" / direction
        animations: dict[str, str] = {}
        frame_paths: dict[str, list[str]] = {}
        for animation in ANIMATIONS:
            sheet = Image.new("RGBA", SHEET_SIZE, TRANSPARENT)
            frame_paths[animation] = []
            normalized_frames = distinct_frame_sequence(
                direction_frames[direction][animation],
            )
            for index, frame in enumerate(normalized_frames):
                frame = clear_transparent_rgb(frame)
                sheet.alpha_composite(frame, (index * FRAME_SIZE[0], 0))
                frame_path = bank_root / "frames" / animation / f"{index:02d}.png"
                save_png(frame, frame_path)
                frame_paths[animation].append(web_path(frame_path))
            sheet_path = bank_root / "sheets" / f"{animation}.png"
            save_png(sheet, sheet_path)
            animations[animation] = web_path(sheet_path)
        fps_directions[direction] = {
            "direction": direction,
            "source": source_modes[direction],
            "sourceKind": (
                "cardinal-bitmap-source"
                if direction in CARDINAL_DIRECTIONS
                else "derived-diagonal-bitmap"
            ),
            "derivedFrom": (
                None
                if direction in CARDINAL_DIRECTIONS
                else [DIAGONAL_CONTRACT[direction][0]]
            ),
            "orientationToward": (
                None
                if direction in CARDINAL_DIRECTIONS
                else DIAGONAL_CONTRACT[direction][1]
            ),
            "authoredAxialView": direction in {"front", "back"}
            and "ImageGen authored" in source_modes[direction],
            "singleSilhouetteSource": True,
            "animations": animations,
            "frames": frame_paths,
        }
    return fps_directions, source_modes


def base_fps_sprite(
    category: str,
    character_id: str,
    fps_directions: dict[str, Any],
    source_modes: dict[str, str],
) -> dict[str, Any]:
    return {
        "schema": 3,
        "view": "fps-enemy-directional",
        "columns": 6,
        "rows": 1,
        "frameWidth": FRAME_SIZE[0],
        "frameHeight": FRAME_SIZE[1],
        "sourceCharacter": f"{category}/{character_id}",
        "sourceView": "Eight explicit runtime raster banks (four cardinal, four diagonal)",
        "groundAnchor": [0.5, 1.0],
        "alphaMode": "straight-transparent",
        "chromaKey": None,
        "weaponsBakedIntoBody": False,
        "renderOrder": ["body", "weapon"],
        "animations": {
            animation: [
                {
                    "index": index,
                    "file": str(
                        Path("frames") / animation / f"{index:02d}.png"
                    ).replace("\\", "/"),
                }
                for index in range(6)
            ]
            for animation in ANIMATIONS
        },
        "fpsDirections": fps_directions,
        "viewCoverage": {
            "mode": "fps-eight-way-explicit",
            "directions": list(DIRECTIONS),
            "cardinalBitmapSources": list(CARDINAL_DIRECTIONS),
            "derivedDiagonalBanks": [
                direction
                for direction in DIRECTIONS
                if direction not in CARDINAL_DIRECTIONS
            ],
            "frontBackAuthored": False,
            "runtimeSequence": "single-lateral-frame-locked",
            "rightProfile": "explicit-bitmap-horizontal-turn",
            "imagegenRawRuntimeUse": False,
        },
    }


def rebuild_diagonal_banks(category: str, character_id: str) -> None:
    """Replace only diagonal banks from their one authoritative axial bank."""

    fps_folder = FPS_ROOT / category / character_id
    fps_sprite_path = fps_folder / "sprite.json"
    fps_sprite = read_json(fps_sprite_path)
    fps_directions = fps_sprite.get("fpsDirections")
    if not isinstance(fps_directions, dict):
        raise ValueError("fpsDirections missing")

    for direction, (axial_direction, side_direction) in DIAGONAL_CONTRACT.items():
        axial_root = (
            fps_folder
            if axial_direction == "left"
            else fps_folder / "directions" / axial_direction
        )
        bank_root = fps_folder / "directions" / direction
        animations: dict[str, str] = {}
        frames: dict[str, list[str]] = {}
        for animation in ANIMATIONS:
            frames[animation] = []
            output_sheet = Image.new("RGBA", SHEET_SIZE, TRANSPARENT)
            for index in range(6):
                axial_path = axial_root / "frames" / animation / f"{index:02d}.png"
                if not axial_path.exists():
                    raise FileNotFoundError(axial_path)
                diagonal = diagonal_view(
                    Image.open(axial_path).convert("RGBA"),
                    side_direction,
                )
                frame_path = bank_root / "frames" / animation / f"{index:02d}.png"
                save_png(diagonal, frame_path)
                output_sheet.alpha_composite(
                    diagonal,
                    (index * FRAME_SIZE[0], 0),
                )
                frames[animation].append(web_path(frame_path))
            sheet_path = bank_root / "sheets" / f"{animation}.png"
            save_png(output_sheet, sheet_path)
            animations[animation] = web_path(sheet_path)

        fps_directions[direction] = {
            "direction": direction,
            "source": (
                "Derived single-silhouette 45-degree pixel projection from "
                f"{axial_direction} toward {side_direction}"
            ),
            "sourceKind": "derived-diagonal-bitmap",
            "derivedFrom": [axial_direction],
            "orientationToward": side_direction,
            "authoredAxialView": False,
            "singleSilhouetteSource": True,
            "animations": animations,
            "frames": frames,
        }
    write_json(fps_sprite_path, fps_sprite)


def rebuild_historical_axial_views(category: str, character_id: str) -> None:
    """Rebuild every turned view from the same clean lateral frame sequence."""

    fps_folder = FPS_ROOT / category / character_id
    fps_sprite_path = fps_folder / "sprite.json"
    fps_sprite = read_json(fps_sprite_path)
    fps_directions = fps_sprite.get("fpsDirections")
    if not isinstance(fps_directions, dict):
        raise ValueError("fpsDirections missing")

    lateral: dict[str, list[Image.Image]] = {}
    left_bank = fps_directions.get("left")
    if not isinstance(left_bank, dict):
        raise ValueError("fpsDirections.left missing")
    for animation in ANIMATIONS:
        declared = left_bank.get("frames", {}).get(animation)
        if not isinstance(declared, list) or len(declared) != 6:
            raise ValueError(f"left/{animation}: expected 6 frames")
        lateral[animation] = []
        for frame_path in declared:
            with Image.open(ROOT / str(frame_path)) as source:
                lateral[animation].append(ground_frame(source.convert("RGBA")))

    direction_frames: dict[str, dict[str, list[Image.Image]]] = {
        "left": lateral,
        "right": {
            animation: [
                clear_transparent_rgb(ImageOps.mirror(frame))
                for frame in frames
            ]
            for animation, frames in lateral.items()
        },
        "front": {
            animation: [
                procedural_axial(frame, "front")
                for frame in frames
            ]
            for animation, frames in lateral.items()
        },
        "back": {
            animation: [
                procedural_axial(frame, "back")
                for frame in frames
            ]
            for animation, frames in lateral.items()
        },
    }
    for direction, (axial_direction, side_direction) in DIAGONAL_CONTRACT.items():
        direction_frames[direction] = {
            animation: [
                diagonal_view(axial, side_direction)
                for axial in direction_frames[axial_direction][animation]
            ]
            for animation in ANIMATIONS
        }

    for direction in [entry for entry in DIRECTIONS if entry != "left"]:
        bank_root = fps_folder / "directions" / direction
        animations: dict[str, str] = {}
        frames: dict[str, list[str]] = {}
        for animation in ANIMATIONS:
            normalized = distinct_frame_sequence(
                direction_frames[direction][animation],
            )
            sheet = Image.new("RGBA", SHEET_SIZE, TRANSPARENT)
            frames[animation] = []
            for index, frame in enumerate(normalized):
                frame_path = bank_root / "frames" / animation / f"{index:02d}.png"
                save_png(frame, frame_path)
                sheet.alpha_composite(frame, (index * FRAME_SIZE[0], 0))
                frames[animation].append(web_path(frame_path))
            sheet_path = bank_root / "sheets" / f"{animation}.png"
            save_png(sheet, sheet_path)
            animations[animation] = web_path(sheet_path)

        diagonal = direction in DIAGONAL_CONTRACT
        axial_direction, side_direction = (
            DIAGONAL_CONTRACT[direction]
            if diagonal
            else (None, None)
        )
        if direction == "right":
            source = "Single lateral silhouette, explicit right-facing bitmap"
        elif direction in {"front", "back"}:
            source = (
                "Frame-locked OpenAI lateral sequence with single-silhouette "
                f"nearest-neighbor {direction} projection"
            )
        else:
            source = (
                "Derived single-silhouette 45-degree pixel projection from "
                f"{axial_direction} toward {side_direction}"
            )
        fps_directions[direction] = {
            "direction": direction,
            "source": source,
            "sourceKind": (
                "derived-diagonal-bitmap"
                if diagonal
                else "cardinal-bitmap-source"
            ),
            "derivedFrom": (
                [axial_direction]
                if diagonal
                else (["left"] if direction in {"front", "back", "right"} else None)
            ),
            "orientationToward": side_direction,
            "authoredAxialView": False,
            "singleSilhouetteSource": True,
            "animations": animations,
            "frames": frames,
        }

    left_bank["singleSilhouetteSource"] = True
    fps_sprite["sourceView"] = (
        "Eight explicit single-silhouette raster banks "
        "(four cardinal, four diagonal)"
    )
    coverage = fps_sprite.setdefault("viewCoverage", {})
    coverage.update(
        {
            "mode": "fps-eight-way-explicit",
            "directions": list(DIRECTIONS),
            "cardinalBitmapSources": list(CARDINAL_DIRECTIONS),
            "derivedDiagonalBanks": [
                direction
                for direction in DIRECTIONS
                if direction not in CARDINAL_DIRECTIONS
            ],
            "frontBackAuthored": False,
            "runtimeSequence": "single-lateral-frame-locked",
            "rightProfile": "explicit-bitmap-horizontal-turn",
            "imagegenRawRuntimeUse": False,
            "frameLockedProjection": (
                "single-lateral-silhouette-nearest-neighbor"
            ),
        },
    )
    coverage.pop("historicalProjection", None)
    write_json(fps_sprite_path, fps_sprite)

    source_sprite_path = CHARACTER_ROOT / category / character_id / "sprite.json"
    if source_sprite_path.exists():
        source_sprite = read_json(source_sprite_path)
        source_coverage = source_sprite.setdefault("viewCoverage", {})
        source_coverage.update(
            {
                "frontBackAuthored": False,
                "runtimeSequence": "single-lateral-frame-locked",
                "imagegenRawRuntimeUse": False,
            },
        )
        write_json(source_sprite_path, source_sprite)

    manifest_path = fps_folder / "sources-directional" / "manifest.json"
    if manifest_path.exists():
        manifest = read_json(manifest_path)
        manifest.update(
            {
                "runtimeDecision": (
                    "rejected-for-cross-direction-frame-phase-incoherence"
                ),
                "runtimeSource": "single-lateral-frame-locked",
            },
        )
        for direction in ("front", "back"):
            record = manifest.get("files", {}).get(direction)
            if isinstance(record, dict):
                record["used"] = False
                record["runtimeUse"] = "source-reference-only"
        write_json(manifest_path, manifest)


def update_frame_locked_contract_only(category: str, character_id: str) -> None:
    """Migrate existing banks to the current runtime provenance contract."""

    fps_folder = FPS_ROOT / category / character_id
    fps_sprite_path = fps_folder / "sprite.json"
    fps_sprite = read_json(fps_sprite_path)
    fps_directions = fps_sprite.get("fpsDirections")
    if not isinstance(fps_directions, dict):
        raise ValueError("fpsDirections missing")

    for direction in DIRECTIONS:
        bank = fps_directions.get(direction)
        if not isinstance(bank, dict):
            raise ValueError(f"fpsDirections.{direction} missing")
        bank["singleSilhouetteSource"] = True
        if direction in {"front", "back"}:
            bank["source"] = (
                "Frame-locked OpenAI lateral sequence with single-silhouette "
                f"nearest-neighbor {direction} projection"
            )
            bank["authoredAxialView"] = False

    fps_sprite["sourceView"] = (
        "Eight explicit single-silhouette raster banks "
        "(four cardinal, four diagonal)"
    )
    coverage = fps_sprite.setdefault("viewCoverage", {})
    coverage.update(
        {
            "mode": "fps-eight-way-explicit",
            "directions": list(DIRECTIONS),
            "cardinalBitmapSources": list(CARDINAL_DIRECTIONS),
            "derivedDiagonalBanks": [
                direction
                for direction in DIRECTIONS
                if direction not in CARDINAL_DIRECTIONS
            ],
            "frontBackAuthored": False,
            "runtimeSequence": "single-lateral-frame-locked",
            "rightProfile": "explicit-bitmap-horizontal-turn",
            "imagegenRawRuntimeUse": False,
            "frameLockedProjection": (
                "single-lateral-silhouette-nearest-neighbor"
            ),
        },
    )
    coverage.pop("historicalProjection", None)
    write_json(fps_sprite_path, fps_sprite)

    source_sprite_path = CHARACTER_ROOT / category / character_id / "sprite.json"
    if source_sprite_path.exists():
        source_sprite = read_json(source_sprite_path)
        source_coverage = source_sprite.setdefault("viewCoverage", {})
        source_coverage.update(
            {
                "frontBackAuthored": False,
                "runtimeSequence": "single-lateral-frame-locked",
                "imagegenRawRuntimeUse": False,
            },
        )
        write_json(source_sprite_path, source_sprite)

    manifest_path = fps_folder / "sources-directional" / "manifest.json"
    if manifest_path.exists():
        manifest = read_json(manifest_path)
        manifest.update(
            {
                "runtimeDecision": (
                    "rejected-for-cross-direction-frame-phase-incoherence"
                ),
                "runtimeSource": "single-lateral-frame-locked",
            },
        )
        for direction in ("front", "back"):
            record = manifest.get("files", {}).get(direction)
            if isinstance(record, dict):
                record["used"] = False
                record["runtimeUse"] = "source-reference-only"
        write_json(manifest_path, manifest)


def normalize_existing_banks(category: str, character_id: str) -> None:
    """Ground all eight banks and repair any projection-collapsed duplicate."""

    fps_folder = FPS_ROOT / category / character_id
    fps_sprite_path = fps_folder / "sprite.json"
    fps_sprite = read_json(fps_sprite_path)
    fps_directions = fps_sprite.get("fpsDirections")
    if not isinstance(fps_directions, dict):
        raise ValueError("fpsDirections missing")

    for direction in DIRECTIONS:
        bank = fps_directions.get(direction)
        if not isinstance(bank, dict):
            raise ValueError(f"fpsDirections.{direction} missing")
        bank["singleSilhouetteSource"] = True
        for animation in ANIMATIONS:
            declared_frames = bank.get("frames", {}).get(animation)
            if not isinstance(declared_frames, list) or len(declared_frames) != 6:
                raise ValueError(f"{direction}/{animation}: expected 6 frames")
            source_frames: list[Image.Image] = []
            for frame_path in declared_frames:
                with Image.open(ROOT / str(frame_path)) as source_frame:
                    source_frames.append(source_frame.convert("RGBA"))
            frames = distinct_frame_sequence(source_frames)
            sheet = Image.new("RGBA", SHEET_SIZE, TRANSPARENT)
            for index, (frame_path, frame) in enumerate(
                zip(declared_frames, frames),
            ):
                save_png(frame, ROOT / str(frame_path))
                sheet.alpha_composite(frame, (index * FRAME_SIZE[0], 0))
            sheet_path = bank.get("animations", {}).get(animation)
            if not sheet_path:
                raise ValueError(f"{direction}/{animation}: sheet missing")
            save_png(sheet, ROOT / str(sheet_path))
    fps_sprite["sourceView"] = (
        "Eight explicit runtime raster banks (four cardinal, four diagonal)"
    )
    write_json(fps_sprite_path, fps_sprite)


def source_manifest(character_id: str, source_modes: dict[str, str]) -> dict[str, Any]:
    calls = IMAGEGEN_CALLS.get(character_id, {})
    return {
        "schema": 1,
        "characterId": character_id,
        "generationTool": "OpenAI ImageGen built-in",
        "role": "identity-preserving front/back FPS animation atlases",
        "runtimeDecision": (
            "rejected-for-cross-direction-frame-phase-incoherence"
        ),
        "runtimeSource": "single-lateral-frame-locked",
        "files": {
            direction: {
                "file": f"{direction}-imagegen-raw.png",
                "callId": calls.get(direction),
                "used": False,
                "runtimeUse": "source-reference-only",
            }
            for direction in ("front", "back")
        },
        "promptContract": {
            "layout": "6 columns x 5 action rows",
            "actions": list(ANIMATIONS),
            "identity": "preserve referenced 2D enemy identity",
            "view": "strict front or strict rear",
            "modularity": "both hands empty; no baked weapon or prop",
            "background": "flat removable chroma key",
        },
    }


def character_sprites() -> list[tuple[str, str, Path, Path]]:
    records: list[tuple[str, str, Path, Path]] = []
    for category_folder in sorted(path for path in CHARACTER_ROOT.iterdir() if path.is_dir()):
        if category_folder.name == "player":
            continue
        for character_folder in sorted(path for path in category_folder.iterdir() if path.is_dir()):
            sprite_path = character_folder / "sprite.json"
            if sprite_path.exists():
                records.append(
                    (
                        category_folder.name,
                        character_folder.name,
                        character_folder,
                        sprite_path,
                    ),
                )
    return records


def update_source_sprite(sprite_path: Path, sprite: dict[str, Any], imagegen_authored: bool) -> None:
    contract = sprite.setdefault("animationContract", {})
    contract["fpsFourWay"] = True
    contract["fpsEightWay"] = True
    coverage = sprite.setdefault("viewCoverage", {})
    coverage.update(
        {
            "mode": "2d-lateral-plus-fps-eight-way",
            "directions": ["left"],
            "fpsDirections": list(DIRECTIONS),
            "fpsFourWay": True,
            "fpsEightWay": True,
            "frontBackAuthored": imagegen_authored,
        },
    )
    write_json(sprite_path, sprite)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--only-new",
        action="store_true",
        help="Build only IDs prefixed new- (fast cross-era iteration).",
    )
    parser.add_argument(
        "--exclude-new",
        action="store_true",
        help="Build the historical roster without reprocessing cross-era ImageGen atlases.",
    )
    parser.add_argument(
        "--ids",
        nargs="*",
        default=[],
        help="Optional exact character IDs. Useful for parallel category-safe builds.",
    )
    parser.add_argument(
        "--categories",
        nargs="*",
        default=[],
        help="Optional exact category folders.",
    )
    parser.add_argument(
        "--diagonals-only",
        action="store_true",
        help="Rebuild four single-silhouette diagonal banks from existing axial banks.",
    )
    parser.add_argument(
        "--normalize-existing-only",
        action="store_true",
        help="Ground and deduplicate all existing direction banks without reprojection.",
    )
    parser.add_argument(
        "--axial-and-diagonals-only",
        action="store_true",
        help="Rebuild historical FPS views from one lateral silhouette per frame.",
    )
    parser.add_argument(
        "--contracts-only",
        action="store_true",
        help="Migrate FPS provenance metadata without rewriting any bitmap.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    report: dict[str, Any] = {
        "characters": 0,
        "imagegenDirectionalCharacters": 0,
        "proceduralHistoricalCharacters": 0,
        "directionBanks": 0,
        "animationSheets": 0,
        "frameReferences": 0,
        "errors": [],
    }
    for category, character_id, character_folder, sprite_path in character_sprites():
        if args.only_new and not character_id.startswith("new-"):
            continue
        if args.exclude_new and character_id.startswith("new-"):
            continue
        if args.ids and character_id not in set(args.ids):
            continue
        if args.categories and category not in set(args.categories):
            continue
        try:
            if args.contracts_only:
                update_frame_locked_contract_only(category, character_id)
                report["characters"] += 1
                continue
            if args.axial_and_diagonals_only:
                rebuild_historical_axial_views(category, character_id)
                report["characters"] += 1
                report["directionBanks"] += len(DIRECTIONS) - 1
                report["animationSheets"] += (len(DIRECTIONS) - 1) * len(ANIMATIONS)
                report["frameReferences"] += (
                    (len(DIRECTIONS) - 1) * len(ANIMATIONS) * 6
                )
                continue
            if args.normalize_existing_only:
                normalize_existing_banks(category, character_id)
                report["characters"] += 1
                report["directionBanks"] += len(DIRECTIONS)
                report["animationSheets"] += len(DIRECTIONS) * len(ANIMATIONS)
                report["frameReferences"] += len(DIRECTIONS) * len(ANIMATIONS) * 6
                continue
            if args.diagonals_only:
                rebuild_diagonal_banks(category, character_id)
                report["characters"] += 1
                report["directionBanks"] += len(DIAGONAL_CONTRACT)
                report["animationSheets"] += len(DIAGONAL_CONTRACT) * len(ANIMATIONS)
                report["frameReferences"] += (
                    len(DIAGONAL_CONTRACT) * len(ANIMATIONS) * 6
                )
                continue
            sprite = read_json(sprite_path)
            fps_directions, source_modes = build_direction_banks(
                category,
                character_id,
                character_folder,
                sprite,
            )
            fps_folder = FPS_ROOT / category / character_id
            fps_sprite = base_fps_sprite(
                category,
                character_id,
                fps_directions,
                source_modes,
            )
            write_json(fps_folder / "sprite.json", fps_sprite)
            imagegen_authored = all(
                "ImageGen authored" in source_modes[direction]
                for direction in ("front", "back")
            )
            update_source_sprite(sprite_path, sprite, imagegen_authored)
            if character_id in IMAGEGEN_CALLS:
                write_json(
                    fps_folder / "sources-directional" / "manifest.json",
                    source_manifest(character_id, source_modes),
                )
            report["characters"] += 1
            report["directionBanks"] += len(DIRECTIONS)
            report["animationSheets"] += len(DIRECTIONS) * len(ANIMATIONS)
            report["frameReferences"] += len(DIRECTIONS) * len(ANIMATIONS) * 6
            if imagegen_authored:
                report["imagegenDirectionalCharacters"] += 1
            else:
                report["proceduralHistoricalCharacters"] += 1
        except Exception as error:  # report the complete roster in one run
            report["errors"].append(f"{category}/{character_id}: {error}")

    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 1 if report["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
