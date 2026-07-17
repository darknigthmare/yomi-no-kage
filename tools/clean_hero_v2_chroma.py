"""Nettoie le chroma résiduel des exports FPS d'Akio et recolle les planches."""

from pathlib import Path

from PIL import Image


ANIMATIONS = ("idle", "move", "attack", "hurt", "death")
FRAME_SIZE = (960, 640)
BODY_ROOT = Path("assets/modular/fps/player/akio/body")
TRANSPARENT = (0, 0, 0, 0)


def is_visible_magenta(pixel: tuple[int, int, int, int]) -> bool:
    red, green, blue, alpha = pixel
    return (
        alpha > 0
        and red >= 180
        and blue >= 150
        and green <= 90
        and red >= green + 80
        and blue >= green + 60
    )


def clean_frame(path: Path) -> tuple[Image.Image, int]:
    image = Image.open(path).convert("RGBA")
    if image.size != FRAME_SIZE:
        raise ValueError(f"{path}: {image.size}, {FRAME_SIZE} attendu")
    getter = getattr(image, "get_flattened_data", image.getdata)
    pixels = list(getter())
    removed = sum(is_visible_magenta(pixel) for pixel in pixels)
    if removed:
        image.putdata([
            TRANSPARENT if is_visible_magenta(pixel) else pixel
            for pixel in pixels
        ])
        image.save(path, format="PNG", optimize=True)
    return image, removed


def main() -> None:
    total = 0
    for animation in ANIMATIONS:
        sheet = Image.new("RGBA", (FRAME_SIZE[0] * 6, FRAME_SIZE[1]), TRANSPARENT)
        for index in range(6):
            frame_path = BODY_ROOT / "frames" / animation / f"{index:02d}.png"
            frame, removed = clean_frame(frame_path)
            total += removed
            sheet.alpha_composite(frame, (index * FRAME_SIZE[0], 0))
        sheet.save(BODY_ROOT / "sheets" / f"{animation}.png", format="PNG", optimize=True)
    print(f"{total} pixel(s) de chroma supprimé(s); 5 planches FPS reconstruites.")


if __name__ == "__main__":
    main()
