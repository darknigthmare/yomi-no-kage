import json
from pathlib import Path

from PIL import Image, ImageDraw


ANIMATIONS = ["idle", "move", "attack", "hurt", "death"]
FRAME_W = 96
FRAME_H = 128
PLAYER_FRAME_W = 192
PLAYER_FRAME_H = 128
MAGENTA = (255, 0, 255, 0)


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
        side_idle = Path(entry["animations"]["idle"])
        if not side_idle.exists():
            continue
        palette = sample_palette(side_idle)
        base = Path("assets/modular/fps/characters") / entry["category"] / entry["id"]
        sheets_dir = base / "sheets"
        frames_dir = base / "frames"
        sheets_dir.mkdir(parents=True, exist_ok=True)
        fps_animations = {}
        fps_frames = {}
        for animation in ANIMATIONS:
            sheet = Image.new("RGBA", (FRAME_W * 6, FRAME_H), MAGENTA)
            fps_frames[animation] = []
            for frame in range(6):
                cell = Image.new("RGBA", (FRAME_W, FRAME_H), MAGENTA)
                draw = ImageDraw.Draw(cell)
                draw_front_character(draw, frame, animation, palette, entry["category"])
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
            "view": "fps",
            "columns": 6,
            "rows": 1,
            "frameWidth": FRAME_W,
            "frameHeight": FRAME_H,
            "sourceCharacter": f"{entry['category']}/{entry['id']}",
        }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        made += 1
    return made


def crop_weapon(path, crop):
    image = Image.open(path).convert("RGBA")
    return image.crop(tuple(crop))


def make_player_weapon_sheets(registry):
    weapons = registry.get("weapons", [])
    lore_weapons = [
        w for w in weapons
        if str(w.get("id", ""))[:2].isdigit() and str(w.get("file", "")).startswith("assets/generated/weapons/")
    ][:10]
    if not lore_weapons:
        return 0
    meta = [
        [52, 197, 1713, 450], [55, 144, 2061, 444], [80, 112, 2013, 519], [36, 171, 1757, 509],
        [60, 149, 1810, 507], [35, 214, 1702, 433], [50, 186, 1731, 516], [65, 127, 1965, 497],
        [17, 295, 1502, 402], [54, 127, 2062, 469],
    ]
    made = 0
    for index, weapon in enumerate(lore_weapons):
        weapon_id = weapon["id"]
        source = crop_weapon(weapon["file"], meta[index])
        source.thumbnail((170, 42), Image.Resampling.NEAREST)
        base = Path("assets/modular/fps/player/akio/weapons") / weapon_id
        sheets_dir = base / "sheets"
        sheets_dir.mkdir(parents=True, exist_ok=True)
        weapon["fpsAnimations"] = {}
        for animation in ANIMATIONS:
            sheet = Image.new("RGBA", (PLAYER_FRAME_W * 6, PLAYER_FRAME_H), MAGENTA)
            for frame in range(6):
                cell = Image.new("RGBA", (PLAYER_FRAME_W, PLAYER_FRAME_H), MAGENTA)
                draw = ImageDraw.Draw(cell)
                progress = frame / 5
                swing = progress if animation == "attack" else 0
                hurt = animation == "hurt"
                x = 58 - int(swing * 34)
                y = 72 - int(swing * 22) + (2 if animation == "move" and frame % 2 else 0)
                draw.rectangle((34, 88, 116, 114), fill=(38, 21, 27, 255))
                draw.rectangle((91, 78, 122, 99), fill=(184, 132, 94, 255) if not hurt else (235, 191, 156, 255))
                blade = source.rotate(-24 - swing * 38, resample=Image.Resampling.NEAREST, expand=True)
                cell.alpha_composite(blade, (x, y - blade.height // 2))
                sheet.alpha_composite(cell, (frame * PLAYER_FRAME_W, 0))
            sheet_path = sheets_dir / f"{animation}.png"
            sheet.save(sheet_path)
            weapon["fpsAnimations"][animation] = str(sheet_path).replace("\\", "/")
        made += 1
    return made


def main():
    path, registry = read_registry()
    character_count = make_character_sheets(registry)
    player_weapon_count = make_player_weapon_sheets(registry)
    registry.setdefault("fps", {})
    registry["fps"].update({
        "characters": character_count,
        "playerWeaponSets": player_weapon_count,
        "animations": ANIMATIONS,
        "framesPerAnimation": 6,
        "source": "derived from existing OpenAI modular masters",
    })
    write_registry(path, registry)
    print(json.dumps(registry["fps"], indent=2))


if __name__ == "__main__":
    main()
