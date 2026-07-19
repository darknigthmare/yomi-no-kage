#!/usr/bin/env python3
"""Normalize the OpenAI-authored endgame FPS atlases.

The source images deliberately use a visible gutter around a strict 4x2 grid.
The runtime atlas removes that gutter and stores eight equal 384px tiles so
wall and floor sampling never bleeds from one semantic material into another.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
PROPS = ROOT / "assets" / "generated" / "props"
TILE_SIZE = 384
GRID_COLUMNS = 4
GRID_ROWS = 2
SOURCE_INSET = 8

ATLASES = {
    "modern": (
        PROPS / "fps-modern-texture-atlas-source-openai.png",
        PROPS / "fps-modern-texture-atlas.png",
    ),
    "cyber": (
        PROPS / "fps-cyber-texture-atlas-source-openai.png",
        PROPS / "fps-cyber-texture-atlas.png",
    ),
}


def normalized_cell(source: Image.Image, column: int, row: int) -> Image.Image:
    """Extract a grid cell while discarding the generated separator gutter."""

    left = round(column * source.width / GRID_COLUMNS) + SOURCE_INSET
    right = round((column + 1) * source.width / GRID_COLUMNS) - SOURCE_INSET
    top = round(row * source.height / GRID_ROWS) + SOURCE_INSET
    bottom = round((row + 1) * source.height / GRID_ROWS) - SOURCE_INSET
    if right <= left or bottom <= top:
        raise ValueError(f"Invalid source cell {column},{row}: {(left, top, right, bottom)}")

    tile = source.crop((left, top, right, bottom)).convert("RGB")
    tile = tile.resize((TILE_SIZE, TILE_SIZE), Image.Resampling.LANCZOS)
    # A restrained sharpening pass restores hard material edges after the
    # normalization resize without introducing halos around emissive lines.
    tile = tile.filter(ImageFilter.UnsharpMask(radius=0.7, percent=65, threshold=3))
    return ImageEnhance.Contrast(tile).enhance(1.025)


def build(source_path: Path, destination_path: Path) -> None:
    source = Image.open(source_path)
    if source.width < 1200 or source.height < 700:
        raise ValueError(f"{source_path.name}: source too small ({source.size})")

    atlas = Image.new(
        "RGB",
        (GRID_COLUMNS * TILE_SIZE, GRID_ROWS * TILE_SIZE),
        (5, 7, 10),
    )
    for row in range(GRID_ROWS):
        for column in range(GRID_COLUMNS):
            atlas.paste(
                normalized_cell(source, column, row),
                (column * TILE_SIZE, row * TILE_SIZE),
            )
    atlas.save(destination_path, optimize=True)
    print(f"{destination_path.relative_to(ROOT)} {atlas.size[0]}x{atlas.size[1]}")


def main() -> None:
    for source_path, destination_path in ATLASES.values():
        build(source_path, destination_path)


if __name__ == "__main__":
    main()
