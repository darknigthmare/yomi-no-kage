import argparse
import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw


ANIMATIONS = ["idle", "move", "attack", "hurt", "death"]
FRAME_W = 96
FRAME_H = 128
PLAYER_FRAME_W = 960
PLAYER_FRAME_H = 640
TRANSPARENT = (0, 0, 0, 0)
PLAYER_BODY_BASE = Path("assets/modular/fps/player/akio/body")
PLAYER_WEAPON_BASE = Path("assets/modular/fps/player/akio/weapons")
PLAYER_VIEWMODEL_PROMPT = (
    "OpenAI ImageGen built-in revision 2: five separate 3x2 first-person "
    "Akio source sheets, no weapon, black lacquered kote with red lacing, "
    "weapon-ready invisible grip and one global normalization scale."
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
    # Une seule source de vérité reconstruit désormais les cinq planches HD.
    # Le vieux fallback qui dupliquait les derniers doigts de l'animation de
    # mort a volontairement été supprimé.
    source_root = Path("assets/modular/fps/player/akio/sources-v2")
    if all((source_root / f"{animation}.png").exists() for animation in ANIMATIONS):
        from build_hero_sheets_v2 import build_fps_sheets

        fps_animations, fps_frames, _ = build_fps_sheets()
        return fps_animations, fps_frames, PLAYER_BODY_BASE / "sprite.json"

    # Les sources de génération ne font pas partie du paquet runtime. Une passe
    # consacrée aux armes réutilise donc les planches HD validées au lieu de
    # reconstruire silencieusement Akio depuis un ancien master.
    sprite_path = PLAYER_BODY_BASE / "sprite.json"
    if not sprite_path.exists():
        raise FileNotFoundError(f"Missing Akio FPS metadata: {sprite_path}")
    sprite = json.loads(sprite_path.read_text(encoding="utf-8"))
    fps_animations = {
        animation: web_path(PLAYER_BODY_BASE / "sheets" / f"{animation}.png")
        for animation in ANIMATIONS
    }
    fps_frames = {
        animation: [
            web_path(PLAYER_BODY_BASE / frame["file"])
            for frame in sprite["animations"][animation]
        ]
        for animation in ANIMATIONS
    }
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
        sprite_metadata = json.loads(Path(sprite_path).read_text(encoding="utf-8"))
        player["fpsAnimations"] = fps_animations
        player["fpsFrames"] = fps_frames
        player["fpsSprite"] = web_path(sprite_path)
        player["fpsGeneration"] = PLAYER_VIEWMODEL_PROMPT
        player["fpsRenderOrder"] = ["weapon", "body"]
        player["fpsWeaponsBakedIntoBody"] = False
        player["fpsWeaponMounts"] = {
            animation: [
                frame["weaponMount"]
                for frame in sprite_metadata["animations"][animation]
            ]
            for animation in ANIMATIONS
        }
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
