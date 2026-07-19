#!/usr/bin/env python3
"""Build deterministic, frame-accurate weapon rigs for modular characters.

The source sprites are intentionally weaponless.  This tool derives one
normalized grip per animation frame from the declared frame PNG and keeps the
weapon as a separate interchangeable sprite.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
import subprocess
from typing import Any

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
CHARACTER_ROOT = ROOT / "assets" / "modular" / "characters"
FPS_CHARACTER_ROOT = ROOT / "assets" / "modular" / "fps" / "characters"
FPS_PLAYER_SPRITE = (
    ROOT / "assets" / "modular" / "fps" / "player" / "akio" / "body" / "sprite.json"
)
ANIMATIONS = ("idle", "move", "attack", "hurt", "death")
LIVE_LAYERS = {"behind-body", "front-body"}

# Targets are expressed inside the opaque character bounds.  The nearest
# contour pixel is then selected, so different silhouettes get different
# hand positions while identical inputs always produce identical output.
ENEMY_TARGETS: dict[str, tuple[tuple[float, float], tuple[float, float]]] = {
    "idle": ((0.72, 0.52), (0.43, 0.52)),
    "move": ((0.10, 0.50), (0.42, 0.50)),
    "attack": ((0.05, 0.43), (0.34, 0.47)),
    "hurt": ((0.10, 0.52), (0.40, 0.51)),
    "death": ((0.50, 0.52), (0.58, 0.52)),
}

# Each FPS direction owns a different grip profile.  These are authored target
# regions, not render-time offsets.  The builder resolves them against each
# actual frame contour and serializes the resulting sockets frame by frame.
FPS_DIRECTION_TARGETS: dict[
    str,
    dict[str, tuple[tuple[float, float], tuple[float, float]]],
] = {
    "left": ENEMY_TARGETS,
    "right": {
        animation: (
            (1.0 - primary[0], primary[1]),
            (1.0 - secondary[0], secondary[1]),
        )
        for animation, (primary, secondary) in ENEMY_TARGETS.items()
    },
    "front": {
        "idle": ((0.72, 0.50), (0.28, 0.50)),
        "move": ((0.69, 0.49), (0.31, 0.49)),
        "attack": ((0.78, 0.43), (0.22, 0.47)),
        "hurt": ((0.70, 0.51), (0.30, 0.51)),
        "death": ((0.58, 0.54), (0.42, 0.54)),
    },
    "back": {
        "idle": ((0.69, 0.51), (0.31, 0.51)),
        "move": ((0.67, 0.50), (0.33, 0.50)),
        "attack": ((0.75, 0.45), (0.25, 0.48)),
        "hurt": ((0.68, 0.52), (0.32, 0.52)),
        "death": ((0.57, 0.55), (0.43, 0.55)),
    },
}
FPS_DIRECTIONS = (
    "front",
    "front-left",
    "left",
    "back-left",
    "back",
    "back-right",
    "right",
    "front-right",
)
for _diagonal, (_axial, _side) in {
    "front-left": ("front", "left"),
    "back-left": ("back", "left"),
    "back-right": ("back", "right"),
    "front-right": ("front", "right"),
}.items():
    FPS_DIRECTION_TARGETS[_diagonal] = {
        animation: (
            (
                round(
                    (
                        FPS_DIRECTION_TARGETS[_axial][animation][0][0]
                        + FPS_DIRECTION_TARGETS[_side][animation][0][0]
                    )
                    / 2,
                    4,
                ),
                round(
                    (
                        FPS_DIRECTION_TARGETS[_axial][animation][0][1]
                        + FPS_DIRECTION_TARGETS[_side][animation][0][1]
                    )
                    / 2,
                    4,
                ),
            ),
            (
                round(
                    (
                        FPS_DIRECTION_TARGETS[_axial][animation][1][0]
                        + FPS_DIRECTION_TARGETS[_side][animation][1][0]
                    )
                    / 2,
                    4,
                ),
                round(
                    (
                        FPS_DIRECTION_TARGETS[_axial][animation][1][1]
                        + FPS_DIRECTION_TARGETS[_side][animation][1][1]
                    )
                    / 2,
                    4,
                ),
            ),
        )
        for animation in ANIMATIONS
    }
FRAME_Y_NUDGES: dict[str, tuple[float, ...]] = {
    "idle": (0.01, 0.00, -0.01, 0.00, 0.01, 0.00),
    "move": (0.04, 0.01, -0.02, 0.03, 0.00, 0.04),
    "attack": (0.04, 0.00, -0.07, 0.07, -0.02, 0.04),
    "hurt": (0.07, 0.02, 0.06, 0.00, -0.03, 0.05),
    "death": (0.00,) * 6,
}
BASE_SCALE = {
    "idle": 0.58,
    "move": 0.60,
    "attack": 0.66,
    "hurt": 0.54,
    "death": 0.0,
}

AKA_USHI_NECK_ANCHORS: dict[str, tuple[tuple[float, float], ...]] = {
    "idle": (
        (0.30, 0.39), (0.32, 0.39), (0.31, 0.44),
        (0.35, 0.33), (0.33, 0.41), (0.32, 0.42),
    ),
    "move": (
        (0.30, 0.45), (0.31, 0.43), (0.31, 0.44),
        (0.31, 0.43), (0.32, 0.44), (0.31, 0.45),
    ),
    "attack": (
        (0.30, 0.47), (0.33, 0.44), (0.34, 0.39),
        (0.32, 0.45), (0.33, 0.41), (0.41, 0.36),
    ),
    "hurt": (
        (0.31, 0.45), (0.39, 0.36), (0.34, 0.49),
        (0.39, 0.39), (0.41, 0.38), (0.35, 0.42),
    ),
    "death": (
        (0.31, 0.48), (0.32, 0.52), (0.34, 0.56),
        (0.35, 0.68), (0.36, 0.74), (0.36, 0.78),
    ),
}


def aka_ushi_attachment_rigs() -> dict[str, Any]:
    animations: dict[str, list[dict[str, Any]]] = {}
    for animation, anchors in AKA_USHI_NECK_ANCHORS.items():
        animations[animation] = [
            {
                "anchor": [rounded(x), rounded(y)],
                "angle": 0.0,
                "scale": 0.0 if animation == "death" else 1.1,
                "layer": "hidden" if animation == "death" else "front-body",
            }
            for x, y in anchors
        ]
    return {
        "neckRig": {
            "schema": 1,
            "coordinateSpace": "frame-normalized",
            "facing": "left",
            "renderOrder": ["body", "attachment"],
            "animations": animations,
        },
    }


def read_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        if not path.exists() or path.stat().st_size != 0:
            raise
        relative = path.relative_to(ROOT).as_posix()
        restored = subprocess.run(
            ["git", "show", f"HEAD:{relative}"],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        return json.loads(restored.stdout)


def rounded(value: float) -> float:
    return round(float(value), 4)


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def opaque_geometry(frame_path: Path) -> tuple[int, int, tuple[int, int, int, int], list[tuple[int, int]]]:
    with Image.open(frame_path) as source:
        image = source.convert("RGBA")
        width, height = image.size
        alpha = image.getchannel("A")
        bounds = alpha.getbbox()
        if bounds is None:
            raise ValueError(f"{frame_path.relative_to(ROOT)} has no opaque pixels")
        pixels = alpha.load()
        x0, y0, x1, y1 = bounds
        contour: list[tuple[int, int]] = []
        for y in range(y0, y1):
            for x in range(x0, x1):
                if pixels[x, y] < 48:
                    continue
                if (
                    x == 0
                    or y == 0
                    or x == width - 1
                    or y == height - 1
                    or pixels[x - 1, y] < 48
                    or pixels[x + 1, y] < 48
                    or pixels[x, y - 1] < 48
                    or pixels[x, y + 1] < 48
                ):
                    contour.append((x, y))
        if not contour:
            raise ValueError(f"{frame_path.relative_to(ROOT)} has no opaque contour")
        return width, height, bounds, contour


def target_in_bounds(
    bounds: tuple[int, int, int, int],
    target: tuple[float, float],
    y_nudge: float,
) -> tuple[float, float]:
    x0, y0, x1, y1 = bounds
    return (
        x0 + (x1 - x0) * target[0],
        y0 + (y1 - y0) * clamp(target[1] + y_nudge, 0.18, 0.75),
    )


def snap_contour(
    contour: list[tuple[int, int]],
    target: tuple[float, float],
    dimensions: tuple[int, int],
    avoid: tuple[float, float] | None = None,
) -> tuple[float, float]:
    width, height = dimensions
    target_x, target_y = target
    normalizer = max(1.0, min(width, height))

    def score(point: tuple[int, int]) -> float:
        px, py = point
        distance = math.hypot(px - target_x, py - target_y) / normalizer
        separation_penalty = 0.0
        if avoid is not None:
            separation = math.hypot(px - avoid[0], py - avoid[1]) / normalizer
            if separation < 0.08:
                separation_penalty = (0.08 - separation) * 4.0
        return distance + separation_penalty

    selected = min(contour, key=score)
    return float(selected[0]), float(selected[1])


def normalized_point(point: tuple[float, float], width: int, height: int) -> list[float]:
    # Half a pixel places the anchor inside the selected contour cell.
    return [
        rounded((point[0] + 0.5) / max(1, width)),
        rounded((point[1] + 0.5) / max(1, height)),
    ]


def rig_from_enemy_frame(
    frame_path: Path,
    animation: str,
    frame_index: int,
    category: str,
    direction: str = "left",
) -> dict[str, Any]:
    width, height, bounds, contour = opaque_geometry(frame_path)
    target_profile = FPS_DIRECTION_TARGETS.get(direction, ENEMY_TARGETS)
    primary_target, secondary_target = target_profile[animation]
    y_nudge = FRAME_Y_NUDGES[animation][frame_index]
    primary_pixel = snap_contour(
        contour,
        target_in_bounds(bounds, primary_target, y_nudge),
        (width, height),
    )
    secondary_pixel = snap_contour(
        contour,
        target_in_bounds(bounds, secondary_target, y_nudge * 0.45),
        (width, height),
        avoid=primary_pixel,
    )
    primary = normalized_point(primary_pixel, width, height)
    secondary = normalized_point(secondary_pixel, width, height)
    delta_x = primary[0] - secondary[0]
    delta_y = primary[1] - secondary[1]
    angle = math.atan2(delta_y, delta_x)
    hand_span = math.hypot(delta_x, delta_y)
    category_scale = {
        "miniboss": 1.03,
        "boss": 1.05,
        "giant": 1.10,
    }.get(category, 1.0)
    span_scale = clamp(0.88 + hand_span * 1.35, 0.88, 1.18)
    scale = BASE_SCALE[animation] * category_scale * span_scale
    hidden = animation == "death"
    return {
        "primaryHand": primary,
        "secondaryHand": secondary,
        "angle": rounded(angle if not hidden else 0.0),
        "scale": rounded(scale),
        "layer": "hidden" if hidden else "front-body",
    }


def legacy_mount_for_animation(sprite: dict[str, Any], animation: str) -> list[Any]:
    frame_entries = sprite.get("animations", {}).get(animation)
    if isinstance(frame_entries, list):
        frame_mounts = [
            frame.get("weaponMount")
            for frame in frame_entries
            if isinstance(frame, dict) and isinstance(frame.get("weaponMount"), list)
        ]
        if len(frame_mounts) == len(frame_entries) and frame_mounts:
            return frame_mounts
    weapon_mount = sprite.get("weaponMount") or {}
    animated = weapon_mount.get("animations")
    if isinstance(animated, dict):
        value = animated.get(animation)
        return value if isinstance(value, list) else []
    value = weapon_mount.get(animation)
    if isinstance(value, list) and value and isinstance(value[0], (int, float)):
        return [value] * 6
    return value if isinstance(value, list) else []


def rig_from_declared_mount(
    mount: list[Any],
    default_layer: str = "front-body",
) -> dict[str, Any]:
    x = float(mount[0]) if len(mount) > 0 else 0.5
    y = float(mount[1]) if len(mount) > 1 else 0.5
    angle = float(mount[2]) if len(mount) > 2 else 0.0
    scale = float(mount[3]) if len(mount) > 3 else 1.0
    alpha = float(mount[4]) if len(mount) > 4 else 1.0
    hand_span = 0.105
    secondary = [
        clamp(x - math.cos(angle) * hand_span, 0.0, 1.0),
        clamp(y - math.sin(angle) * hand_span, 0.0, 1.0),
    ]
    return {
        "primaryHand": [rounded(x), rounded(y)],
        "secondaryHand": [rounded(secondary[0]), rounded(secondary[1])],
        "angle": rounded(angle),
        "scale": rounded(scale if alpha > 0 else 0.0),
        "layer": default_layer if alpha > 0 else "hidden",
    }


def player_weapon_rig(sprite: dict[str, Any]) -> dict[str, Any]:
    default_layer = "front-body"
    animations: dict[str, list[dict[str, Any]]] = {}
    for animation in ANIMATIONS:
        mounts = legacy_mount_for_animation(sprite, animation)
        frames: list[dict[str, Any]] = []
        for index in range(6):
            mount = mounts[index] if index < len(mounts) else []
            frames.append(rig_from_declared_mount(mount, default_layer))
        animations[animation] = frames
    return {
        "schema": 1,
        "coordinateSpace": "frame-normalized",
        "facing": "right",
        "authorship": "declared-per-frame-mounts",
        "renderOrder": ["body", "weapon"],
        "animations": animations,
    }


def fps_enemy_rig_source(folder: Path, sprite: dict[str, Any]) -> dict[str, Any]:
    source = dict(sprite)
    source["animations"] = {
        animation: [
            {"file": f"frames/{animation}/{index:02d}.png"}
            for index in range(6)
        ]
        for animation in ANIMATIONS
    }
    return source


def enemy_weapon_rig(
    folder: Path,
    sprite: dict[str, Any],
    category: str,
    direction: str = "left",
) -> dict[str, Any]:
    animations: dict[str, list[dict[str, Any]]] = {}
    for animation in ANIMATIONS:
        declared_frames = sprite.get("animations", {}).get(animation, [])
        frames: list[dict[str, Any]] = []
        for index, frame in enumerate(declared_frames):
            if not isinstance(frame, dict) or not frame.get("file"):
                raise ValueError(
                    f"{folder.relative_to(ROOT)}/{animation}/{index}: frame file missing"
                )
            frames.append(
                rig_from_enemy_frame(
                    folder / frame["file"],
                    animation,
                    index,
                    category,
                    direction,
                )
            )
        if len(frames) != 6:
            raise ValueError(
                f"{folder.relative_to(ROOT)}/{animation}: expected 6 frames, got {len(frames)}"
            )
        animations[animation] = frames
    return {
        "schema": 1,
        "coordinateSpace": "frame-normalized",
        "facing": direction,
        "authorship": "authored-direction-profile+frame-contour-snap",
        "renderOrder": ["body", "weapon"],
        "animations": animations,
    }


def fps_directional_weapon_rigs(
    fps_sprite: dict[str, Any],
    category: str,
) -> dict[str, Any]:
    directions = fps_sprite.get("fpsDirections")
    if not isinstance(directions, dict):
        return {}
    result: dict[str, Any] = {}
    for direction in FPS_DIRECTIONS:
        bank = directions.get(direction)
        if not isinstance(bank, dict):
            continue
        animations = bank.get("frames")
        if not isinstance(animations, dict):
            continue
        rig_animations: dict[str, list[dict[str, Any]]] = {}
        for animation in ANIMATIONS:
            paths = animations.get(animation)
            if not isinstance(paths, list) or len(paths) != 6:
                raise ValueError(
                    f"fpsDirections.{direction}.{animation}: expected 6 frame paths"
                )
            rig_animations[animation] = [
                rig_from_enemy_frame(
                    ROOT / str(frame_path),
                    animation,
                    index,
                    category,
                    direction,
                )
                for index, frame_path in enumerate(paths)
            ]
        result[direction] = {
            "schema": 1,
            "coordinateSpace": "frame-normalized",
            "facing": direction,
            "authorship": "authored-direction-profile+frame-contour-snap",
            "renderOrder": ["body", "weapon"],
            "animations": rig_animations,
        }
    return result


def character_sprite_paths() -> list[tuple[str, Path]]:
    result: list[tuple[str, Path]] = []
    for category_folder in sorted(path for path in CHARACTER_ROOT.iterdir() if path.is_dir()):
        for character_folder in sorted(path for path in category_folder.iterdir() if path.is_dir()):
            sprite_path = character_folder / "sprite.json"
            if sprite_path.exists():
                result.append((category_folder.name, sprite_path))
    return result


def write_or_check(
    path: Path,
    source: dict[str, Any],
    rig: dict[str, Any],
    check: bool,
    attachment_rigs: dict[str, Any] | None = None,
) -> bool:
    if check:
        return (
            source.get("weaponRig") == rig
            and (
                attachment_rigs is None
                or source.get("attachmentRigs") == attachment_rigs
            )
        )
    source["weaponRig"] = rig
    if attachment_rigs is not None:
        source["attachmentRigs"] = attachment_rigs
    path.write_text(
        json.dumps(source, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--check",
        action="store_true",
        help="Verify that every committed rig matches a clean deterministic rebuild.",
    )
    parser.add_argument(
        "--categories",
        nargs="*",
        default=[],
        help="Optional exact category folders for a parallel-safe partial rebuild.",
    )
    parser.add_argument(
        "--ids",
        nargs="*",
        default=[],
        help="Optional exact character IDs.",
    )
    args = parser.parse_args()

    stale: list[str] = []
    enemy_count = 0
    enemy_frames = 0
    enemy_fps_count = 0
    enemy_fps_frames = 0
    player_frames = 0
    for category, sprite_path in character_sprite_paths():
        if args.categories and category not in set(args.categories):
            continue
        if args.ids and sprite_path.parent.name not in set(args.ids):
            continue
        sprite = read_json(sprite_path)
        if category == "player":
            rig = player_weapon_rig(sprite)
            player_frames += sum(len(frames) for frames in rig["animations"].values())
        else:
            rig = enemy_weapon_rig(sprite_path.parent, sprite, category)
            enemy_count += 1
            enemy_frames += sum(len(frames) for frames in rig["animations"].values())
        attachment_rigs = (
            aka_ushi_attachment_rigs()
            if sprite_path.parent.name == "giant-02-aka-ushi"
            else None
        )
        if not write_or_check(
            sprite_path,
            sprite,
            rig,
            args.check,
            attachment_rigs,
        ):
            stale.append(str(sprite_path.relative_to(ROOT)).replace("\\", "/"))

        if category != "player":
            fps_sprite_path = (
                FPS_CHARACTER_ROOT / category / sprite_path.parent.name / "sprite.json"
            )
            if fps_sprite_path.exists():
                fps_sprite = read_json(fps_sprite_path)
                fps_rig = enemy_weapon_rig(
                    fps_sprite_path.parent,
                    fps_enemy_rig_source(fps_sprite_path.parent, fps_sprite),
                    category,
                )
                directional_rigs = fps_directional_weapon_rigs(
                    fps_sprite,
                    category,
                )
                if directional_rigs:
                    fps_rig["directions"] = directional_rigs
                enemy_fps_count += 1
                enemy_fps_frames += sum(
                    len(frames) for frames in fps_rig["animations"].values()
                )
                if not write_or_check(
                    fps_sprite_path,
                    fps_sprite,
                    fps_rig,
                    args.check,
                ):
                    stale.append(
                        str(fps_sprite_path.relative_to(ROOT)).replace("\\", "/")
                    )

    include_player = (
        not args.categories
        and not args.ids
    ) or "player" in set(args.categories) or "akio" in set(args.ids)
    if include_player:
        fps_player = read_json(FPS_PLAYER_SPRITE)
        fps_rig = player_weapon_rig(fps_player)
        player_frames += sum(len(frames) for frames in fps_rig["animations"].values())
        if not write_or_check(FPS_PLAYER_SPRITE, fps_player, fps_rig, args.check):
            stale.append(str(FPS_PLAYER_SPRITE.relative_to(ROOT)).replace("\\", "/"))

    report = {
        "mode": "check" if args.check else "write",
        "enemies": enemy_count,
        "enemyRigFrames": enemy_frames,
        "fpsEnemies": enemy_fps_count,
        "fpsEnemyRigFrames": enemy_fps_frames,
        "playerRigFrames": player_frames,
        "stale": stale,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 1 if stale else 0


if __name__ == "__main__":
    raise SystemExit(main())
