import hashlib
import json
from pathlib import Path

from PIL import Image


ANIMATIONS = ["idle", "move", "attack", "hurt", "death"]
BODY_ROOT = Path("assets/modular/fps/player/akio/body")
SIDE_BODY_ROOT = Path("assets/modular/characters/player/akio")
WEAPONS_ROOT = Path("assets/modular/fps/player/akio/weapons")
WEAPON_IDS = [
    "01-kurokage",
    "02-shogun-no-in",
    "03-hinezumi",
    "04-shirogane",
    "05-yomibane",
    "06-kegare-kiri",
    "07-takekaze",
    "08-raijin-no-tsume",
    "09-akatsuki",
    "10-mujo",
]


def visible_magenta_count(image):
    pixels = image.get_flattened_data() if hasattr(image, "get_flattened_data") else image.getdata()
    return sum(
        1
        for r, g, b, a in pixels
        if a > 0 and r >= 180 and b >= 150 and g <= 90 and r >= g + 80 and b >= g + 60
    )


def vertical_alpha_bands(image, alpha_threshold=0):
    alpha = image.getchannel("A")
    occupied = [
        any(alpha.getpixel((x, y)) > alpha_threshold for x in range(image.width))
        for y in range(image.height)
    ]
    bands = 0
    inside = False
    for row in occupied:
        if row and not inside:
            bands += 1
            inside = True
        elif not row:
            inside = False
    return bands


def main():
    report = {
        "animations": {},
        "sidePlayerGrounding": {},
        "weapons": {},
        "errors": [],
    }
    for animation in ANIMATIONS:
        sheet_path = BODY_ROOT / "sheets" / f"{animation}.png"
        if not sheet_path.exists():
            report["errors"].append(f"planche absente: {sheet_path}")
            continue
        sheet = Image.open(sheet_path).convert("RGBA")
        if sheet.size != (1440, 160):
            report["errors"].append(f"{sheet_path}: {sheet.size}, 1440x160 attendu")

        hashes = []
        alpha_values = set()
        magenta = 0
        for frame in range(6):
            frame_path = BODY_ROOT / "frames" / animation / f"{frame:02d}.png"
            if not frame_path.exists():
                report["errors"].append(f"frame absente: {frame_path}")
                continue
            image = Image.open(frame_path).convert("RGBA")
            if image.size != (240, 160):
                report["errors"].append(f"{frame_path}: {image.size}, 240x160 attendu")
            hashes.append(hashlib.sha256(image.tobytes()).hexdigest())
            alpha_values.update(image.getchannel("A").get_flattened_data())
            magenta += visible_magenta_count(image)

        unique = len(set(hashes))
        if unique != 6:
            report["errors"].append(f"{animation}: {unique}/6 frames uniques")
        if not alpha_values.issubset({0, 255}):
            report["errors"].append(f"{animation}: alpha intermédiaire détecté")
        if magenta:
            report["errors"].append(f"{animation}: {magenta} pixels magenta visibles")
        report["animations"][animation] = {
            "sheet": list(sheet.size),
            "frames": len(hashes),
            "unique": unique,
            "alpha": sorted(alpha_values),
            "visibleMagenta": magenta,
        }

    for animation in ANIMATIONS:
        bottom_gaps = []
        for frame in range(6):
            frame_path = SIDE_BODY_ROOT / "frames" / animation / f"{frame:02d}.png"
            if not frame_path.exists():
                report["errors"].append(f"frame 2D absente: {frame_path}")
                continue
            image = Image.open(frame_path).convert("RGBA")
            alpha_bbox = image.getchannel("A").getbbox()
            if alpha_bbox is None:
                report["errors"].append(f"{frame_path}: silhouette 2D vide")
                continue
            bottom_gaps.append(image.height - alpha_bbox[3])
        if any(bottom_gaps):
            report["errors"].append(
                f"{animation}: marge transparente sous Akio {bottom_gaps}"
            )
        report["sidePlayerGrounding"][animation] = {
            "frames": len(bottom_gaps),
            "bottomTransparentPixels": bottom_gaps,
            "grounded": len(bottom_gaps) == 6 and not any(bottom_gaps),
        }

    for weapon_id in WEAPON_IDS:
        weapon_path = WEAPONS_ROOT / weapon_id / "weapon.png"
        metadata_path = WEAPONS_ROOT / weapon_id / "sprite.json"
        if not weapon_path.exists():
            report["errors"].append(f"sprite d'arme absent: {weapon_path}")
            continue
        image = Image.open(weapon_path).convert("RGBA")
        bands = vertical_alpha_bands(image)
        if image.width > 640 or image.height > 160:
            report["errors"].append(f"{weapon_path}: format supérieur à 640x160")
        if bands != 1:
            report["errors"].append(f"{weapon_path}: {bands} bandes alpha, fourreau possible")
        alpha_values = set(image.getchannel("A").get_flattened_data())
        if not alpha_values.issubset({0, 255}):
            report["errors"].append(f"{weapon_path}: alpha intermédiaire détecté")
        magenta = visible_magenta_count(image)
        if magenta:
            report["errors"].append(f"{weapon_path}: {magenta} pixels magenta visibles")
        source_bands = None
        if metadata_path.exists():
            metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
            source_path = Path(metadata["source"])
            source_crop = metadata["sourceCrop"]
            source = Image.open(source_path).convert("RGBA").crop(tuple(source_crop))
            source_bands = vertical_alpha_bands(source, alpha_threshold=31)
        report["weapons"][weapon_id] = {
            "size": list(image.size),
            "verticalAlphaBands": bands,
            "sourceVerticalAlphaBands": source_bands,
            "detachedBandsRemoved": max(0, (source_bands or 0) - bands),
            "alpha": sorted(alpha_values),
            "visibleMagenta": magenta,
        }

    obsolete = list(WEAPONS_ROOT.glob("*/sheets"))
    if obsolete:
        report["errors"].append(f"{len(obsolete)} dossiers composites obsolètes")
    report["obsoleteCompositeFolders"] = len(obsolete)

    print(json.dumps(report, ensure_ascii=False, indent=2))
    if report["errors"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
