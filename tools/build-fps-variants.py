import argparse
import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw


ANIMATIONS = ["idle", "move", "attack", "hurt", "death"]
FRAME_W = 96
FRAME_H = 128
PLAYER_FRAME_W = 240
PLAYER_FRAME_H = 160
TRANSPARENT = (0, 0, 0, 0)
PLAYER_MASTER = Path("assets/modular/fps/player/akio/master-alpha.png")
PLAYER_BODY_BASE = Path("assets/modular/fps/player/akio/body")
PLAYER_WEAPON_BASE = Path("assets/modular/fps/player/akio/weapons")
PLAYER_VIEWMODEL_PROMPT = (
    "OpenAI ImageGen built-in: strict 6x5 first-person Akio arms atlas, "
    "rows idle/move/attack/hurt/death, no weapon, flat magenta key, "
    "black lacquered kote with red lacing, weapon-ready invisible grip."
)
PLAYER_WEAPON_CROPS = {
    "01-kurokage": [52, 197, 1713, 450],
    "02-shogun-no-in": [55, 144, 2061, 444],
    "03-hinezumi": [80, 112, 2013, 519],
    "04-shirogane": [36, 171, 1757, 509],
    "05-yomibane": [60, 149, 1810, 507],
    "06-kegare-kiri": [35, 214, 1702, 433],
    "07-takekaze": [50, 186, 1731, 516],
    "08-raijin-no-tsume": [65, 127, 1965, 497],
    "09-akatsuki": [17, 295, 1502, 402],
    "10-mujo": [54, 127, 2062, 469],
}

# Normalized viewmodel cell coordinates: x, y, rotation (radians), scale, alpha.
# The weapon is drawn first and the OpenAI arms layer is drawn above it, so the
# grip remains visually inside Akio's hands while every katana stays swappable.
PLAYER_WEAPON_MOUNTS = {
    "idle": [
        [0.52, 0.51, -1.78, 0.94, 1.00],
        [0.51, 0.52, -1.76, 0.95, 1.00],
        [0.51, 0.52, -1.79, 0.95, 1.00],
        [0.50, 0.50, -1.81, 0.94, 1.00],
        [0.50, 0.52, -1.77, 0.95, 1.00],
        [0.51, 0.52, -1.80, 0.94, 1.00],
    ],
    "move": [
        [0.44, 0.57, -1.83, 0.93, 1.00],
        [0.37, 0.58, -1.76, 0.94, 1.00],
        [0.35, 0.59, -1.71, 0.95, 1.00],
        [0.35, 0.57, -1.76, 0.94, 1.00],
        [0.38, 0.59, -1.82, 0.93, 1.00],
        [0.37, 0.61, -1.78, 0.94, 1.00],
    ],
    "attack": [
        [0.46, 0.64, -1.96, 0.92, 1.00],
        [0.50, 0.61, -1.70, 0.96, 1.00],
        [0.52, 0.64, -1.38, 1.00, 1.00],
        [0.56, 0.39, -0.95, 1.04, 1.00],
        [0.59, 0.65, -0.43, 1.08, 1.00],
        [0.56, 0.75, 0.08, 1.00, 1.00],
    ],
    "hurt": [
        [0.36, 0.59, -2.04, 0.94, 1.00],
        [0.34, 0.58, -2.25, 0.92, 0.90],
        [0.28, 0.57, -2.48, 0.88, 0.72],
        [0.37, 0.59, -2.62, 0.84, 0.50],
        [0.40, 0.57, -2.08, 0.90, 0.72],
        [0.38, 0.58, -1.80, 0.94, 1.00],
    ],
    "death": [
        [0.42, 0.54, -1.78, 0.92, 1.00],
        [0.48, 0.60, -1.18, 0.90, 0.86],
        [0.55, 0.78, -0.58, 0.86, 0.66],
        [0.62, 0.95, -0.10, 0.82, 0.42],
        [0.68, 1.04, 0.28, 0.76, 0.18],
        [0.72, 1.18, 0.46, 0.72, 0.00],
    ],
}


def read_registry():
    path = Path("assets/modular/registry.json")
    return path, json.loads(path.read_text(encoding="utf-8"))


def write_registry(path, registry):
    path.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sample_palette(sheet_path):
    image = Image.open(sheet_path).convert("RGBA")
    colors = image.getcolors(maxcolors=image.width * image.height) or []
    filtered = []
    for count, (r, g, b, a) in colors:
        if a < 24:
            continue
        if r > 220 and g < 55 and b > 190:
            continue
        if r + g + b < 30:
            continue
        filtered.append((count, (r, g, b, 255)))
    filtered.sort(reverse=True)
    palette = [color for _, color in filtered[:8]]
    while len(palette) < 8:
        palette.append((80, 62, 58, 255))
    return palette


def darken(color, factor):
    r, g, b, a = color
    return (int(r * factor), int(g * factor), int(b * factor), a)


def remove_chroma_and_clear_transparent_rgb(image):
    """Return a true-alpha source with no visible chroma-key pixels.

    The OpenAI 2D masters are already carefully keyed, but clearing RGB below
    alpha zero prevents a browser sampler from exposing magenta fringes while
    keeping every opaque pixel of the detailed source intact.
    """
    image = image.convert("RGBA")
    pixels = image.get_flattened_data() if hasattr(image, "get_flattened_data") else image.getdata()
    image.putdata([
        TRANSPARENT
        if a == 0 or (r >= 248 and g <= 12 and b >= 248)
        else (r, g, b, a)
        for r, g, b, a in pixels
    ])
    return image


def normalize_fps_enemy_frame(source_path):
    """Fit a detailed 2D OpenAI pose into a grounded Doom-style billboard."""
    source = remove_chroma_and_clear_transparent_rgb(Image.open(source_path))
    bbox = source.getchannel("A").getbbox()
    output = Image.new("RGBA", (FRAME_W, FRAME_H), TRANSPARENT)
    if not bbox:
        return output

    pose = source.crop(bbox)
    scale = min((FRAME_W - 4) / pose.width, FRAME_H / pose.height)
    width = max(1, round(pose.width * scale))
    height = max(1, round(pose.height * scale))
    pose = pose.resize((width, height), Image.Resampling.NEAREST)
    resized_bbox = pose.getchannel("A").getbbox()
    if resized_bbox:
        pose = pose.crop(resized_bbox)
        width, height = pose.size
    x = (FRAME_W - width) // 2
    y = FRAME_H - height
    output.alpha_composite(pose, (x, y))
    return remove_chroma_and_clear_transparent_rgb(output)


def draw_front_character(draw, frame, animation, palette, category):
    cloth = palette[0]
    trim = palette[1]
    skin = palette[2]
    shadow = darken(cloth, 0.55)
    infection = palette[3]
    bossish = category in {"miniboss", "boss", "giant"}
    giant = category == "giant"
    bob = [0, -1, 0, 1, 0, -1][frame]
    attack = animation == "attack"
    hurt = animation == "hurt"
    death = animation == "death"
    move = animation == "move"
    cx = FRAME_W // 2
    if death:
        y = 84 + frame
        draw.rectangle((cx - 30, y, cx + 32, y + 18), fill=shadow)
        draw.rectangle((cx - 22, y - 14, cx + 16, y + 4), fill=cloth)
        draw.rectangle((cx + 12, y - 17, cx + 28, y - 3), fill=skin)
        return
    head_y = 22 + bob + (2 if hurt else 0)
    torso_y = 44 + bob
    width = 24 + (10 if bossish else 0) + (8 if giant else 0)
    height = 42 + (10 if bossish else 0)
    eye = (188, 242, 94, 255) if hurt or frame % 2 else infection
    draw.rectangle((cx - width // 2 - 5, torso_y + 8, cx + width // 2 + 5, torso_y + height), fill=shadow)
    draw.rectangle((cx - width // 2, torso_y, cx + width // 2, torso_y + height), fill=cloth)
    draw.rectangle((cx - width // 2, torso_y + 11, cx + width // 2, torso_y + 15), fill=trim)
    draw.rectangle((cx - 12, head_y, cx + 12, head_y + 18), fill=skin)
    draw.rectangle((cx - 16, head_y - 5, cx + 16, head_y + 5), fill=shadow)
    if bossish:
        draw.rectangle((cx - 22, head_y - 8, cx - 13, head_y - 3), fill=trim)
        draw.rectangle((cx + 13, head_y - 8, cx + 22, head_y - 3), fill=trim)
    draw.rectangle((cx - 7, head_y + 7, cx - 4, head_y + 9), fill=eye)
    draw.rectangle((cx + 4, head_y + 7, cx + 7, head_y + 9), fill=eye)
    arm_swing = [0, 3, 0, -3, 0, 2][frame] if move else 0
    if attack:
        arm_swing = frame * 3 - 7
    draw.rectangle((cx - width // 2 - 16, torso_y + 8 + arm_swing, cx - width // 2 - 5, torso_y + 42 + arm_swing), fill=cloth)
    draw.rectangle((cx + width // 2 + 5, torso_y + 8 - arm_swing, cx + width // 2 + 16, torso_y + 42 - arm_swing), fill=cloth)
    leg = 8 if move and frame % 2 else 0
    draw.rectangle((cx - 18 - leg, torso_y + height, cx - 5 - leg, 112), fill=shadow)
    draw.rectangle((cx + 5 + leg, torso_y + height, cx + 18 + leg, 112), fill=shadow)
    draw.rectangle((cx - 30, 113, cx - 4, 118), fill=darken(shadow, 0.7))
    draw.rectangle((cx + 4, 113, cx + 30, 118), fill=darken(shadow, 0.7))


def make_character_sheets(registry):
    made = 0
    for entry in registry["characters"]:
        if entry["category"] == "player":
            continue
        source_frames = entry.get("frames", {})
        if not all(len(source_frames.get(animation, [])) == 6 for animation in ANIMATIONS):
            continue
        base = Path("assets/modular/fps/characters") / entry["category"] / entry["id"]
        sheets_dir = base / "sheets"
        frames_dir = base / "frames"
        sheets_dir.mkdir(parents=True, exist_ok=True)
        fps_animations = {}
        fps_frames = {}
        for animation in ANIMATIONS:
            sheet = Image.new("RGBA", (FRAME_W * 6, FRAME_H), TRANSPARENT)
            fps_frames[animation] = []
            for frame in range(6):
                source_path = Path(source_frames[animation][frame])
                if not source_path.exists():
                    raise FileNotFoundError(
                        f"Missing detailed OpenAI source frame: {source_path}"
                    )
                cell = normalize_fps_enemy_frame(source_path)
                sheet.alpha_composite(cell, (frame * FRAME_W, 0))
                frame_dir = frames_dir / animation
                frame_dir.mkdir(parents=True, exist_ok=True)
                frame_path = frame_dir / f"{frame:02d}.png"
                cell.save(frame_path)
                fps_frames[animation].append(str(frame_path).replace("\\", "/"))
            sheet_path = sheets_dir / f"{animation}.png"
            sheet.save(sheet_path)
            fps_animations[animation] = str(sheet_path).replace("\\", "/")
        entry["fpsAnimations"] = fps_animations
        entry["fpsFrames"] = fps_frames
        entry["fpsSprite"] = str(base / "sprite.json").replace("\\", "/")
        (base / "sprite.json").write_text(json.dumps({
            "schema": 2,
            "view": "fps",
            "columns": 6,
            "rows": 1,
            "frameWidth": FRAME_W,
            "frameHeight": FRAME_H,
            "sourceCharacter": f"{entry['category']}/{entry['id']}",
            "sourceView": "OpenAI detailed 2D master, normalized as Doom billboard",
            "groundAnchor": [0.5, 1.0],
            "alphaMode": "straight-transparent",
            "chromaKey": None,
        }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        made += 1
    return made


def crop_weapon(path, crop):
    image = Image.open(path).convert("RGBA")
    return image.crop(tuple(crop))


def isolate_held_weapon(image, alpha_threshold=32, minimum_gap=8):
    """Discard a detached scabbard or presentation fragment below the blade.

    The ten lore sources place the held katana in the first horizontal alpha
    band. Some source crops also contain a second, clearly separated band for
    the scabbard. Only the first band belongs in the interchangeable FPS slot.
    """
    image = image.convert("RGBA")
    alpha = image.getchannel("A")
    alpha_pixels = alpha.load()
    occupied_rows = [
        any(alpha_pixels[x, y] >= alpha_threshold for x in range(image.width))
        for y in range(image.height)
    ]
    try:
        first_row = occupied_rows.index(True)
    except ValueError:
        return image

    cutoff = image.height
    empty_start = None
    for y in range(first_row, image.height):
        if occupied_rows[y]:
            empty_start = None
            continue
        if empty_start is None:
            empty_start = y
        if y - empty_start + 1 >= minimum_gap:
            cutoff = empty_start
            break

    isolated = image.crop((0, 0, image.width, cutoff))
    alpha_bbox = isolated.getchannel("A").getbbox()
    return isolated.crop(alpha_bbox) if alpha_bbox else isolated


def harden_pixel_alpha(image, threshold=96):
    image = image.convert("RGBA")
    pixels = image.get_flattened_data() if hasattr(image, "get_flattened_data") else image.getdata()
    image.putdata([
        (r, g, b, 255) if a >= threshold else TRANSPARENT
        for r, g, b, a in pixels
    ])
    return image


def remove_cross_row_fragments(image, alpha_threshold=32):
    """Keep only viewmodel components that belong to the current grid row.

    Image generation leaves a few pixels from the previous pose across some
    invisible row boundaries. Real arms enter through the lower edge; clipped
    fragments stay near the top, so connected-component filtering is stable.
    """
    image = image.convert("RGBA")
    width, height = image.size
    alpha = image.getchannel("A")
    alpha_pixels = alpha.load()
    visited = bytearray(width * height)
    kept = bytearray(width * height)

    for start_y in range(height):
        for start_x in range(width):
            start_index = start_y * width + start_x
            if visited[start_index] or alpha_pixels[start_x, start_y] < alpha_threshold:
                continue
            queue = deque([(start_x, start_y)])
            visited[start_index] = 1
            component = []
            max_y = start_y
            while queue:
                x, y = queue.popleft()
                component.append((x, y))
                max_y = max(max_y, y)
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if nx < 0 or nx >= width or ny < 0 or ny >= height:
                        continue
                    index = ny * width + nx
                    if visited[index] or alpha_pixels[nx, ny] < alpha_threshold:
                        continue
                    visited[index] = 1
                    queue.append((nx, ny))

            belongs_to_pose = (
                max_y >= height - 4
                or (max_y >= int(height * 0.78) and len(component) >= 12)
            )
            if belongs_to_pose:
                for x, y in component:
                    kept[y * width + x] = 1

    source_pixels = image.get_flattened_data() if hasattr(image, "get_flattened_data") else image.getdata()
    cleaned = Image.new("RGBA", image.size, TRANSPARENT)
    cleaned.putdata([
        pixel if kept[index] else TRANSPARENT
        for index, pixel in enumerate(source_pixels)
    ])
    return cleaned


def web_path(path):
    return str(path).replace("\\", "/")


def split_player_body():
    if not PLAYER_MASTER.exists():
        raise FileNotFoundError(f"Missing OpenAI FPS player master: {PLAYER_MASTER}")

    master = Image.open(PLAYER_MASTER).convert("RGBA")
    sheets_dir = PLAYER_BODY_BASE / "sheets"
    frames_dir = PLAYER_BODY_BASE / "frames"
    sheets_dir.mkdir(parents=True, exist_ok=True)
    frames_dir.mkdir(parents=True, exist_ok=True)
    fps_animations = {}
    fps_frames = {}

    for row, animation in enumerate(ANIMATIONS):
        sheet = Image.new("RGBA", (PLAYER_FRAME_W * 6, PLAYER_FRAME_H), TRANSPARENT)
        fps_frames[animation] = []
        previous_cell = None
        top = round(row * master.height / len(ANIMATIONS))
        bottom = round((row + 1) * master.height / len(ANIMATIONS))
        for frame in range(6):
            left = round(frame * master.width / 6)
            right = round((frame + 1) * master.width / 6)
            cell = master.crop((left, top, right, bottom))
            cell = remove_cross_row_fragments(cell)
            cell = cell.resize((PLAYER_FRAME_W, PLAYER_FRAME_H), Image.Resampling.NEAREST)
            cell = harden_pixel_alpha(cell)
            # ImageGen fait naturellement sortir les mains du cadre sur les
            # deux derniers temps de mort. On conserve une traîne progressive
            # de la pose précédente afin que les six exports restent distincts
            # et que la chute se lise image par image avant la disparition.
            if (
                animation == "death"
                and cell.getchannel("A").getbbox() is None
                and previous_cell is not None
            ):
                dropped = Image.new("RGBA", cell.size, TRANSPARENT)
                dropped.alpha_composite(previous_cell, (0, 5))
                cell = dropped
            frame_dir = frames_dir / animation
            frame_dir.mkdir(parents=True, exist_ok=True)
            frame_path = frame_dir / f"{frame:02d}.png"
            cell.save(frame_path, optimize=True)
            fps_frames[animation].append(web_path(frame_path))
            sheet.alpha_composite(cell, (frame * PLAYER_FRAME_W, 0))
            previous_cell = cell.copy()
        sheet_path = sheets_dir / f"{animation}.png"
        sheet.save(sheet_path, optimize=True)
        fps_animations[animation] = web_path(sheet_path)

    sprite_path = PLAYER_BODY_BASE / "sprite.json"
    sprite_path.write_text(json.dumps({
        "schema": 1,
        "view": "first-person-player",
        "sourceMaster": web_path(PLAYER_MASTER),
        "generationTool": "OpenAI ImageGen built-in",
        "prompt": PLAYER_VIEWMODEL_PROMPT,
        "grid": {"columns": 6, "rows": 5},
        "frameWidth": PLAYER_FRAME_W,
        "frameHeight": PLAYER_FRAME_H,
        "animations": {
            animation: [
                {
                    "index": frame,
                    "file": f"frames/{animation}/{frame:02d}.png",
                    "weaponMount": PLAYER_WEAPON_MOUNTS[animation][frame],
                }
                for frame in range(6)
            ]
            for animation in ANIMATIONS
        },
        "renderOrder": ["weapon", "body"],
        "weaponsBakedIntoBody": False,
        "alphaMode": "binary",
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return fps_animations, fps_frames, sprite_path


def make_player_view_model(registry):
    weapons = registry.get("weapons", [])
    for weapon in weapons:
        weapon.pop("fpsAnimations", None)
        weapon.pop("fpsGeneration", None)
    weapons_by_id = {weapon.get("id"): weapon for weapon in weapons}
    lore_weapons = [
        weapons_by_id[weapon_id]
        for weapon_id in PLAYER_WEAPON_CROPS
        if weapon_id in weapons_by_id
        and str(weapons_by_id[weapon_id].get("file", "")).startswith("assets/generated/weapons/")
    ]
    if not lore_weapons:
        return 0, 0

    fps_animations, fps_frames, sprite_path = split_player_body()
    made = 0
    for weapon in lore_weapons:
        weapon_id = weapon["id"]
        crop = PLAYER_WEAPON_CROPS[weapon_id]
        source = crop_weapon(weapon["file"], crop)
        source = isolate_held_weapon(source)
        source.thumbnail((640, 160), Image.Resampling.NEAREST)
        source = harden_pixel_alpha(source, threshold=48)
        # Les exports restent détourés même lorsqu'une poignée touche le bord
        # du crop source : les quatre pixels de coin sont toujours transparents.
        for corner in (
            (0, 0),
            (source.width - 1, 0),
            (0, source.height - 1),
            (source.width - 1, source.height - 1),
        ):
            source.putpixel(corner, TRANSPARENT)
        base = PLAYER_WEAPON_BASE / weapon_id
        base.mkdir(parents=True, exist_ok=True)
        weapon_path = base / "weapon.png"
        source.save(weapon_path, optimize=True)
        weapon_sprite = base / "sprite.json"
        weapon_sprite.write_text(json.dumps({
            "schema": 1,
            "view": "first-person-weapon",
            "weaponId": weapon_id,
            "file": "weapon.png",
            "source": weapon["file"],
            "sourceCrop": crop,
            "gripAnchor": [0.26, 0.52],
            "detachedAccessoriesRemoved": True,
            "renderOrder": "behind-body",
            "weaponsBakedIntoBody": False,
            "alphaMode": "binary",
        }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        weapon.pop("fpsAnimations", None)
        weapon["fpsSprite"] = web_path(weapon_path)
        weapon["fpsSpriteMeta"] = web_path(weapon_sprite)
        weapon["fpsGripAnchor"] = [0.26, 0.52]
        made += 1

    player = next((entry for entry in registry.get("characters", []) if entry.get("category") == "player"), None)
    if player:
        player["fpsAnimations"] = fps_animations
        player["fpsFrames"] = fps_frames
        player["fpsSprite"] = web_path(sprite_path)
        player["fpsGeneration"] = PLAYER_VIEWMODEL_PROMPT
        player["fpsRenderOrder"] = ["weapon", "body"]
        player["fpsWeaponsBakedIntoBody"] = False
        player["fpsWeaponMounts"] = PLAYER_WEAPON_MOUNTS
        player["fpsWeaponSprites"] = {
            weapon["id"]: weapon["fpsSprite"]
            for weapon in lore_weapons
        }
        player.pop("fpsWeaponAnimations", None)
    return 1, made


def parse_args():
    parser = argparse.ArgumentParser(description="Build modular FPS sprite variants.")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument(
        "--enemies-only",
        action="store_true",
        help="Rebuild the 96 enemy billboards without touching Akio or weapon sprites.",
    )
    mode.add_argument(
        "--player-only",
        action="store_true",
        help="Rebuild Akio and the ten independent weapons without rewriting enemies.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    path, registry = read_registry()
    character_count = (
        registry.get("fps", {}).get("characters", 96)
        if args.player_only
        else make_character_sheets(registry)
    )
    if args.enemies_only:
        player_view_count = registry.get("fps", {}).get("playerViewModels", 1)
        player_weapon_count = registry.get("fps", {}).get("playerWeaponSprites", 10)
    else:
        player_view_count, player_weapon_count = make_player_view_model(registry)
    registry.setdefault("fps", {})
    registry["fps"].update({
        "characters": character_count,
        "playerViewModels": player_view_count,
        "playerWeaponSprites": player_weapon_count,
        "animations": ANIMATIONS,
        "framesPerAnimation": 6,
        "playerFrameSize": [PLAYER_FRAME_W, PLAYER_FRAME_H],
        "enemySource": "Detailed OpenAI 2D masters normalized as grounded Doom billboards",
        "source": "OpenAI ImageGen player arms master with independent weapon sprites",
    })
    registry["fps"].pop("playerWeaponSets", None)
    write_registry(path, registry)
    print(json.dumps(registry["fps"], indent=2))


if __name__ == "__main__":
    main()
