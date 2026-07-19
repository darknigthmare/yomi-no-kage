#!/usr/bin/env python3
"""Build the orthographic Aka-Ushi yoke from an alpha ImageGen source."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise ValueError("The source contains no opaque pixels.")
    return bbox


def build(source: Path, output: Path, width: int = 416, height: int = 256) -> None:
    image = Image.open(source).convert("RGBA")
    image = image.crop(alpha_bbox(image))
    available = (width - 8, height - 8)
    image.thumbnail(available, Image.Resampling.NEAREST)

    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    x = (width - image.width) // 2
    # Keep both blades on one stable baseline while preserving a small top pad.
    y = height - image.height - 4
    canvas.alpha_composite(image, (x, y))
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output, optimize=True)

    final_bbox = alpha_bbox(canvas)
    print(
        {
            "output": output.as_posix(),
            "size": canvas.size,
            "alphaBBox": final_bbox,
            "projection": "orthographic-side",
            "attachPoint": "neckRig",
        }
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--width", type=int, default=416)
    parser.add_argument("--height", type=int, default=256)
    args = parser.parse_args()
    build(args.input, args.output, args.width, args.height)


if __name__ == "__main__":
    main()
