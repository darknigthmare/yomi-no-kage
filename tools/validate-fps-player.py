"""Validation visuelle et structurelle des planches HD d'Akio."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image


ANIMATIONS = ["idle", "move", "attack", "hurt", "death"]
BODY_ROOT = Path("assets/modular/fps/player/akio/body")
SIDE_BODY_ROOT = Path("assets/modular/characters/player/akio")
WEAPONS_ROOT = Path("assets/modular/fps/player/akio/weapons")
FPS_FRAME_SIZE = (960, 640)
FPS_SHEET_SIZE = (FPS_FRAME_SIZE[0] * 6, FPS_FRAME_SIZE[1])
SIDE_FRAME_SIZE = (192, 160)
SIDE_SHEET_SIZE = (SIDE_FRAME_SIZE[0] * 6, SIDE_FRAME_SIZE[1])
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


def pixel_data(image):
    getter = getattr(image, "get_flattened_data", image.getdata)
    return getter()


def visible_magenta_count(image):
    return sum(
        1
        for red, green, blue, alpha in pixel_data(image)
        if (
            alpha > 0
            and red >= 180
            and blue >= 150
            and green <= 90
            and red >= green + 80
            and blue >= green + 60
        )
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


def normalized_silhouette_hash(image):
    """Détecte une pose simplement recopiée puis déplacée."""
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        return None
    silhouette = image.crop(bbox).getchannel("A")
    silhouette = silhouette.resize((128, 128), Image.Resampling.NEAREST)
    return hashlib.sha256(silhouette.tobytes()).hexdigest()


def transparent_corners(image):
    alpha = image.getchannel("A")
    return all(
        alpha.getpixel(point) == 0
        for point in (
            (0, 0),
            (image.width - 1, 0),
            (0, image.height - 1),
            (image.width - 1, image.height - 1),
        )
    )


def validate_fps(report):
    for animation in ANIMATIONS:
        sheet_path = BODY_ROOT / "sheets" / f"{animation}.png"
        if not sheet_path.exists():
            report["errors"].append(f"planche FPS absente: {sheet_path}")
            continue
        sheet = Image.open(sheet_path).convert("RGBA")
        if sheet.size != FPS_SHEET_SIZE:
            report["errors"].append(
                f"{sheet_path}: {sheet.size}, {FPS_SHEET_SIZE} attendu"
            )

        hashes = []
        silhouette_hashes = []
        occupancy = []
        magenta = 0
        for frame_index in range(6):
            frame_path = BODY_ROOT / "frames" / animation / f"{frame_index:02d}.png"
            if not frame_path.exists():
                report["errors"].append(f"frame FPS absente: {frame_path}")
                continue
            image = Image.open(frame_path).convert("RGBA")
            if image.size != FPS_FRAME_SIZE:
                report["errors"].append(
                    f"{frame_path}: {image.size}, {FPS_FRAME_SIZE} attendu"
                )
            hashes.append(hashlib.sha256(image.tobytes()).hexdigest())
            silhouette_hashes.append(normalized_silhouette_hash(image))
            alpha = image.getchannel("A")
            visible = sum(value > 0 for value in pixel_data(alpha))
            occupancy.append(visible / max(1, image.width * image.height))
            magenta += visible_magenta_count(image)
            if not transparent_corners(image):
                report["errors"].append(f"{frame_path}: coins non transparents")
            if sheet.size == FPS_SHEET_SIZE:
                sheet_frame = sheet.crop(
                    (
                        frame_index * FPS_FRAME_SIZE[0],
                        0,
                        (frame_index + 1) * FPS_FRAME_SIZE[0],
                        FPS_FRAME_SIZE[1],
                    )
                )
                if sheet_frame.tobytes() != image.tobytes():
                    report["errors"].append(
                        f"{animation}/{frame_index}: planche et frame FPS divergent"
                    )

        unique = len(set(hashes))
        silhouette_unique = len(set(silhouette_hashes))
        if unique != 6:
            report["errors"].append(f"{animation}: {unique}/6 frames FPS uniques")
        if silhouette_unique != 6:
            report["errors"].append(
                f"{animation}: {silhouette_unique}/6 silhouettes FPS uniques"
            )
        if occupancy and min(occupancy) < 0.15:
            report["errors"].append(
                f"{animation}: frame FPS presque vide {min(occupancy):.3f}"
            )
        if magenta:
            report["errors"].append(
                f"{animation}: {magenta} pixels magenta FPS visibles"
            )
        report["fpsAnimations"][animation] = {
            "sheet": list(sheet.size),
            "frames": len(hashes),
            "unique": unique,
            "uniqueNormalizedSilhouettes": silhouette_unique,
            "minimumOccupancy": round(min(occupancy), 4) if occupancy else 0,
            "visibleMagenta": magenta,
        }


def validate_side(report):
    for animation in ANIMATIONS:
        sheet_path = SIDE_BODY_ROOT / "sheets" / f"{animation}.png"
        if not sheet_path.exists():
            report["errors"].append(f"planche 2D absente: {sheet_path}")
            continue
        sheet = Image.open(sheet_path).convert("RGBA")
        if sheet.size != SIDE_SHEET_SIZE:
            report["errors"].append(
                f"{sheet_path}: {sheet.size}, {SIDE_SHEET_SIZE} attendu"
            )

        bottom_gaps = []
        hashes = []
        silhouette_hashes = []
        maximum_colors = 0
        magenta = 0
        for frame_index in range(6):
            frame_path = (
                SIDE_BODY_ROOT / "frames" / animation / f"{frame_index:02d}.png"
            )
            if not frame_path.exists():
                report["errors"].append(f"frame 2D absente: {frame_path}")
                continue
            image = Image.open(frame_path).convert("RGBA")
            if image.size != SIDE_FRAME_SIZE:
                report["errors"].append(
                    f"{frame_path}: {image.size}, {SIDE_FRAME_SIZE} attendu"
                )
            bbox = image.getchannel("A").getbbox()
            if bbox is None:
                report["errors"].append(f"{frame_path}: silhouette 2D vide")
                continue
            bottom_gaps.append(image.height - bbox[3])
            hashes.append(hashlib.sha256(image.tobytes()).hexdigest())
            silhouette_hashes.append(normalized_silhouette_hash(image))
            alpha_values = set(pixel_data(image.getchannel("A")))
            if not alpha_values.issubset({0, 255}):
                report["errors"].append(f"{frame_path}: alpha 2D non binaire")
            colors = image.getcolors(maxcolors=image.width * image.height) or []
            maximum_colors = max(maximum_colors, len(colors))
            magenta += visible_magenta_count(image)
            if not transparent_corners(image):
                report["errors"].append(f"{frame_path}: coins non transparents")
            if sheet.size == SIDE_SHEET_SIZE:
                sheet_frame = sheet.crop(
                    (
                        frame_index * SIDE_FRAME_SIZE[0],
                        0,
                        (frame_index + 1) * SIDE_FRAME_SIZE[0],
                        SIDE_FRAME_SIZE[1],
                    )
                )
                if sheet_frame.tobytes() != image.tobytes():
                    report["errors"].append(
                        f"{animation}/{frame_index}: planche et frame 2D divergent"
                    )

        unique = len(set(hashes))
        silhouette_unique = len(set(silhouette_hashes))
        if any(bottom_gaps):
            report["errors"].append(
                f"{animation}: marge transparente sous Akio {bottom_gaps}"
            )
        if unique != 6 or silhouette_unique != 6:
            report["errors"].append(
                f"{animation}: frames 2D dupliquées ou simplement translatées"
            )
        # 96 couleurs communes + la transparence au maximum.
        if maximum_colors > 97:
            report["errors"].append(
                f"{animation}: palette 2D trop large ({maximum_colors} couleurs)"
            )
        if magenta:
            report["errors"].append(
                f"{animation}: {magenta} pixels magenta 2D visibles"
            )
        report["sideAnimations"][animation] = {
            "sheet": list(sheet.size),
            "frames": len(bottom_gaps),
            "unique": unique,
            "uniqueNormalizedSilhouettes": silhouette_unique,
            "bottomTransparentPixels": bottom_gaps,
            "grounded": len(bottom_gaps) == 6 and not any(bottom_gaps),
            "maximumColors": maximum_colors,
            "visibleMagenta": magenta,
        }


def validate_weapons(report):
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
            report["errors"].append(
                f"{weapon_path}: {bands} bandes alpha, fourreau possible"
            )
        alpha_values = set(pixel_data(image.getchannel("A")))
        if not alpha_values.issubset({0, 255}):
            report["errors"].append(f"{weapon_path}: alpha intermédiaire détecté")
        magenta = visible_magenta_count(image)
        if magenta:
            report["errors"].append(
                f"{weapon_path}: {magenta} pixels magenta visibles"
            )
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


def main():
    report = {
        "fpsAnimations": {},
        "sideAnimations": {},
        "weapons": {},
        "errors": [],
    }
    validate_fps(report)
    validate_side(report)
    validate_weapons(report)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if report["errors"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
