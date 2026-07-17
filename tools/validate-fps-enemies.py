import hashlib
import json
from pathlib import Path

from PIL import Image


ANIMATIONS = ["idle", "move", "attack", "hurt", "death"]
FRAME_SIZE = (96, 128)
SHEET_SIZE = (FRAME_SIZE[0] * 6, FRAME_SIZE[1])
ROOT = Path("assets/modular/fps/characters")
EXPECTED_CHARACTERS = 96


def pixels(image):
    if hasattr(image, "get_flattened_data"):
        return list(image.get_flattened_data())
    return list(image.getdata())


def main():
    errors = []
    category_counts = {}
    frame_count = 0
    sheet_count = 0
    visible_color_counts = []
    transparent_pixels = 0
    opaque_pixels = 0
    opaque_magenta_pixels = 0
    transparent_nonzero_rgb = 0
    grounded_frames = 0
    distinct_animation_sets = 0
    sheet_cells_matching_frames = 0

    characters = []
    for category in sorted(path for path in ROOT.iterdir() if path.is_dir()):
        entries = sorted(path for path in category.iterdir() if path.is_dir())
        category_counts[category.name] = len(entries)
        characters.extend((category.name, entry) for entry in entries)

    if len(characters) != EXPECTED_CHARACTERS:
        errors.append(f"{len(characters)} personnages FPS, {EXPECTED_CHARACTERS} attendus")

    for category, character in characters:
        metadata_path = character / "sprite.json"
        if not metadata_path.exists():
            errors.append(f"{category}/{character.name}: sprite.json absent")
            continue
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        if metadata.get("frameWidth") != FRAME_SIZE[0] or metadata.get("frameHeight") != FRAME_SIZE[1]:
            errors.append(f"{category}/{character.name}: dimensions metadata invalides")
        if metadata.get("groundAnchor") != [0.5, 1.0]:
            errors.append(f"{category}/{character.name}: baseline metadata invalide")
        if metadata.get("alphaMode") != "straight-transparent":
            errors.append(f"{category}/{character.name}: alphaMode invalide")

        for animation in ANIMATIONS:
            sheet_path = character / "sheets" / f"{animation}.png"
            if not sheet_path.exists():
                errors.append(f"{category}/{character.name}/{animation}: planche absente")
                continue
            sheet = Image.open(sheet_path).convert("RGBA")
            sheet_count += 1
            if sheet.size != SHEET_SIZE:
                errors.append(
                    f"{category}/{character.name}/{animation}: planche {sheet.size}, {SHEET_SIZE} attendue"
                )

            hashes = []
            for index in range(6):
                frame_path = character / "frames" / animation / f"{index:02d}.png"
                if not frame_path.exists():
                    errors.append(
                        f"{category}/{character.name}/{animation}/{index:02d}: frame absente"
                    )
                    continue
                frame = Image.open(frame_path).convert("RGBA")
                frame_count += 1
                if frame.size != FRAME_SIZE:
                    errors.append(
                        f"{category}/{character.name}/{animation}/{index:02d}: {frame.size}"
                    )
                    continue

                frame_pixels = pixels(frame)
                visible = {(r, g, b, a) for r, g, b, a in frame_pixels if a > 0}
                visible_color_counts.append(len(visible))
                transparent_pixels += sum(1 for _, _, _, a in frame_pixels if a == 0)
                opaque_pixels += sum(1 for _, _, _, a in frame_pixels if a > 0)
                opaque_magenta_pixels += sum(
                    1
                    for r, g, b, a in frame_pixels
                    if a > 0 and r >= 248 and g <= 12 and b >= 248
                )
                transparent_nonzero_rgb += sum(
                    1
                    for r, g, b, a in frame_pixels
                    if a == 0 and (r != 0 or g != 0 or b != 0)
                )
                if not visible:
                    errors.append(
                        f"{category}/{character.name}/{animation}/{index:02d}: frame vide"
                    )
                elif len(visible) < 64:
                    errors.append(
                        f"{category}/{character.name}/{animation}/{index:02d}: "
                        f"sprite trop simplifié ({len(visible)} couleurs)"
                    )

                bbox = frame.getchannel("A").getbbox()
                if bbox and bbox[3] == FRAME_SIZE[1]:
                    grounded_frames += 1
                else:
                    errors.append(
                        f"{category}/{character.name}/{animation}/{index:02d}: "
                        f"baseline {bbox[3] if bbox else 'vide'}"
                    )

                hashes.append(hashlib.sha256(frame.tobytes()).hexdigest())
                cell = sheet.crop(
                    (
                        index * FRAME_SIZE[0],
                        0,
                        (index + 1) * FRAME_SIZE[0],
                        FRAME_SIZE[1],
                    )
                )
                if cell.tobytes() == frame.tobytes():
                    sheet_cells_matching_frames += 1
                else:
                    errors.append(
                        f"{category}/{character.name}/{animation}/{index:02d}: "
                        "planche/frame divergent"
                    )

            if len(hashes) == 6 and len(set(hashes)) == 6:
                distinct_animation_sets += 1
            elif len(hashes) == 6:
                errors.append(
                    f"{category}/{character.name}/{animation}: frames dupliquées"
                )

    if opaque_magenta_pixels:
        errors.append(f"{opaque_magenta_pixels} pixels magenta visibles")
    if transparent_nonzero_rgb:
        errors.append(f"{transparent_nonzero_rgb} pixels transparents avec RGB résiduel")
    if transparent_pixels == 0 or opaque_pixels == 0:
        errors.append("les frames ne mélangent pas alpha transparent et pixels visibles")

    report = {
        "characters": len(characters),
        "categoryCounts": category_counts,
        "animationSheets": sheet_count,
        "framePngs": frame_count,
        "frameSize": list(FRAME_SIZE),
        "groundedFrames": grounded_frames,
        "distinctAnimationSets": distinct_animation_sets,
        "sheetCellsMatchingFrames": sheet_cells_matching_frames,
        "visibleColors": {
            "minimum": min(visible_color_counts, default=0),
            "maximum": max(visible_color_counts, default=0),
        },
        "opaqueMagentaPixels": opaque_magenta_pixels,
        "transparentPixelsWithResidualRgb": transparent_nonzero_rgb,
        "errors": errors,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
