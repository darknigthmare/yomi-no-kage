"""Construit les props de premier plan en projection latérale orthographique.

Les sources ImageGen restent dans ``props/source``. Le script détoure, réduit
en nearest-neighbour, limite la palette et force un alpha binaire afin que les
sprites gardent des bords francs dans le moteur Canvas.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PROPS = ROOT / "assets/modular/environments/kurokawa/props"


@dataclass(frozen=True)
class PropBuild:
    source: str
    output: str
    size: tuple[int, int]
    colors: int
    padding: int = 4


BUILDS = (
    PropBuild(
        source="source/tour-guet-face-alpha.png",
        output="tour-guet-kurokawa.png",
        size=(196, 320),
        colors=64,
    ),
    PropBuild(
        source="source/foyer-face-alpha.png",
        output="foyer-incendie.png",
        size=(274, 192),
        colors=48,
    ),
)


def hard_alpha(image: Image.Image, threshold: int = 72) -> Image.Image:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A").point(lambda value: 255 if value >= threshold else 0)
    rgba.putalpha(alpha)
    return rgba


def quantize_rgba(image: Image.Image, colors: int) -> Image.Image:
    rgba = hard_alpha(image)
    alpha = rgba.getchannel("A")
    rgb = rgba.convert("RGB").quantize(
        colors=colors,
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    ).convert("RGB")
    result = rgb.convert("RGBA")
    result.putalpha(alpha)
    return result


def pixel_values(image: Image.Image):
    getter = getattr(image, "get_flattened_data", None)
    return getter() if getter else image.getdata()


def build_prop(spec: PropBuild) -> dict[str, object]:
    source_path = PROPS / spec.source
    output_path = PROPS / spec.output
    image = hard_alpha(Image.open(source_path))
    bbox = image.getchannel("A").getbbox()
    if not bbox:
        raise ValueError(f"Source vide : {source_path}")

    subject = image.crop(bbox)
    inner_size = (
        spec.size[0] - spec.padding * 2,
        spec.size[1] - spec.padding * 2,
    )
    subject = subject.resize(inner_size, Image.Resampling.NEAREST)
    subject = quantize_rgba(subject, spec.colors)

    canvas = Image.new("RGBA", spec.size, (0, 0, 0, 0))
    # La dernière ligne opaque reste exactement sur la baseline interne.
    canvas.alpha_composite(subject, (spec.padding, spec.padding))
    canvas.save(output_path, optimize=True)

    alpha = canvas.getchannel("A")
    final_bbox = alpha.getbbox()
    partial_alpha = sum(1 for value in pixel_values(alpha) if value not in (0, 255))
    if final_bbox is None:
        raise ValueError(f"Sortie vide : {output_path}")
    baseline_y = final_bbox[3] - 1
    expected_baseline_y = spec.size[1] - spec.padding - 1
    if baseline_y != expected_baseline_y:
        raise ValueError(
            f"Baseline invalide pour {output_path}: {baseline_y}, "
            f"{expected_baseline_y} attendu"
        )
    contact_x = [
        x for x in range(spec.size[0])
        if alpha.getpixel((x, baseline_y)) == 255
    ]
    if not contact_x:
        raise ValueError(f"Aucun contact opaque sur la baseline : {output_path}")
    if partial_alpha:
        raise ValueError(f"Alpha intermédiaire détecté : {output_path}")
    return {
        "output": output_path.relative_to(ROOT).as_posix(),
        "size": spec.size,
        "bbox": final_bbox,
        "baselineY": baseline_y,
        "contactPixels": len(contact_x),
        "partialAlpha": partial_alpha,
    }


def main() -> None:
    for spec in BUILDS:
        print(build_prop(spec))


if __name__ == "__main__":
    main()
