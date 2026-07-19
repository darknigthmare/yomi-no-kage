#!/usr/bin/env python3
"""Build the ImageGen modular environment expansion packs.

The OpenAI ImageGen outputs are preserved byte-for-byte under each pack's
``source`` folders.  This tool derives the runtime layers,
individual padded sprites and local manifests without any network call.

The first run can read the original Codex generated-images directory.  Later
runs remain reproducible from the raw copies already stored in the repository.
"""

from __future__ import annotations

import argparse
from collections import Counter
from dataclasses import dataclass
import hashlib
import json
import os
from pathlib import Path
import shutil
from statistics import median
from typing import Iterable

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ENVIRONMENT_ROOT = ROOT / "assets" / "modular" / "environments"
DEFAULT_SOURCE_ROOT = (
    Path.home()
    / ".codex"
    / "generated_images"
    / "019f6dba-8e50-7ab1-8ad5-8d44ff7b37bb"
)
TARGET_SIZE = (1664, 936)
GRID = (4, 3)
PADDING = 8
PROP_BOTTOM_PADDING = 4


@dataclass(frozen=True)
class PackSpec:
    zone_id: str
    name: str
    lore: str
    gameplay: str
    source_files: dict[str, str]
    props: tuple[str, ...]
    platforms: tuple[str, ...]


@dataclass(frozen=True)
class AlphaComponent:
    area: int
    bbox: tuple[int, int, int, int]
    centroid: tuple[float, float]


PACKS = (
    PackSpec(
        zone_id="contemporary-japan",
        name="Tokyo contemporain en quarantaine",
        lore=(
            "La faille du Yomi projette Akio dans un Tokyo contemporain où "
            "la même contamination a survécu sous une quarantaine moderne."
        ),
        gameplay=(
            "Rues, station et équipements urbains forment des routes "
            "horizontales lisibles, avec accès en profondeur et plateformes "
            "architecturales cohérentes."
        ),
        source_files={
            "sky": "call_xxAaffUHFWnml8njrFB7MmV3.png",
            "far": "call_WwCIbOG29P1Zd1brtg0GZySm.png",
            "mid": "call_h4JdxKnB7A1640H1wxEIg34m.png",
            "near": "call_5G73qP21lWiFFZbuhS276Mb0.png",
            "props": "call_VaX6fGlSsYqFvq5ODEYIjLEL.png",
            "platforms": "call_0dl9uyVRqcTSC29wqDvWUk5i.png",
        },
        props=(
            "metro-entrance",
            "koban",
            "vending-machine",
            "utility-pole",
            "quarantine-barrier",
            "city-bicycle",
            "emergency-car",
            "neighborhood-shrine",
            "construction-scaffold",
            "emergency-generator",
            "rainwater-pump",
            "yomi-warp-arch",
        ),
        platforms=(
            "asphalt-left",
            "asphalt-center",
            "asphalt-right",
            "asphalt-cracked",
            "concrete-curb-long",
            "concrete-curb-short",
            "footbridge-platform",
            "station-canopy",
            "scaffold-platform",
            "concrete-step",
            "rubble-ramp",
            "drainage-hazard",
        ),
    ),
    PackSpec(
        zone_id="cyberpunk-japan",
        name="Neo-Tokyo sous la pluie de néons",
        lore=(
            "Une seconde rupture temporelle mène Akio dans Neo-Tokyo, où le "
            "Yomi s'est greffé aux réseaux et aux infrastructures de la cité."
        ),
        gameplay=(
            "Passerelles techniques, ruines du maglev et sanctuaires "
            "cybernétiques composent un acte final horizontal à embranchements."
        ),
        source_files={
            "sky": "call_Yv0E73ZqUml325wZM3n4Hf7W.png",
            "far": "call_oci3TYKJlqNB118gfJsNP49U.png",
            "mid": "call_XAaCVmBtkfy9m62QB93QrL2K.png",
            "near": "call_0CHu9dxjfhsGUWwLWnQ3C0kM.png",
            "props": "call_1pqIxJkKzW5r1nUldNxiGIov.png",
            "platforms": "call_atz8xnt2ahe51bASAJ0ZIUOy.png",
        },
        props=(
            "temporal-torii",
            "shrine-tech-altar",
            "ventilation-tower",
            "energy-barrier-post",
            "maglev-maintenance-car",
            "drone-charging-dock",
            "sealed-cargo-crate",
            "vending-terminal",
            "coolant-pipe",
            "cyber-shrine-lantern",
            "transit-access-gate",
            "damaged-power-relay",
        ),
        platforms=(
            "tech-street-left",
            "tech-street-center",
            "tech-street-right",
            "tech-street-cracked",
            "service-platform-long",
            "service-platform-short",
            "transit-platform",
            "shrine-tech-roof",
            "coolant-catwalk",
            "illuminated-step",
            "debris-ramp",
            "energy-trench",
        ),
    ),
    PackSpec(
        zone_id="kai-forest",
        name="Forêt ancienne de Kai",
        lore=(
            "Les cèdres sacrés de Kai étouffent une ancienne route de charbonniers, "
            "désormais contaminée par des racines venues du Yomi."
        ),
        gameplay=(
            "Un niveau forestier horizontal à chemins superposés, troncs franchissables, "
            "racines en pente, ruisseaux et haltes de quarantaine abandonnées."
        ),
        source_files={
            "sky": "call_iCqJO1KncY9OtvxmAi69y8dw.png",
            "far": "call_mvDI83caicnr6cTrJZ3QeL5i.png",
            "mid": "call_hNnhp5hCXS5SwA9NBkMvbrOG.png",
            "near": "call_dMQXaclSMNWEyR4JDVGRVzyu.png",
            "props": "call_e1AFFgHmTNUPxC8vrD5Q6r1W.png",
            "platforms": "call_S83jYMw54Va6cZcl7Lrj9R23.png",
        },
        props=(
            "ancient-cedar-trunk",
            "hollow-fallen-log",
            "charcoal-burner-shelter",
            "moss-stone-lantern",
            "woodcutter-cart",
            "stacked-logs",
            "rope-ward-gate",
            "forest-spring-basin",
            "collapsed-quarantine-tent",
            "infected-root-cluster",
            "campfire-ring",
            "yomi-cave-arch",
        ),
        platforms=(
            "forest-earth-center",
            "forest-earth-left",
            "forest-earth-right",
            "root-cracked",
            "long-fallen-log",
            "short-fallen-log",
            "thick-root-platform",
            "moss-stone-platform",
            "moss-stone-steps",
            "root-earth-slope",
            "stream-stone-ledge",
            "fungus-pit",
        ),
    ),
    PackSpec(
        zone_id="tsuru-fields",
        name="Rizières de Tsuru",
        lore=(
            "Les rizières de Tsuru, autrefois grenier du domaine, ont été noyées "
            "pour ralentir les infectés avant que la peste n'empoisonne les canaux."
        ),
        gameplay=(
            "Un niveau rural ouvert alternant digues, passerelles, toits de grange, "
            "canaux et raccourcis en profondeur autour des cultures condamnées."
        ),
        source_files={
            "sky": "call_CRB2airzQK6ywW15jinqoSwc.png",
            "far": "call_a7CErrAgCBDJelxe4NYgpaVm.png",
            "mid": "call_6CRs1f8GpUBecGfMmITStos5.png",
            "near": "call_bYofiNmCD3sfAcbSYJngqcDX.png",
            "props": "call_mtar6fwAf1YNATDRYuKbHV3O.png",
            "platforms": "call_C2WnTRB1mSA9cpcEc6Zea41y.png",
        },
        props=(
            "field-hut",
            "irrigation-water-wheel",
            "farm-cart",
            "bound-rice-sheaf",
            "irrigation-sluice",
            "field-footbridge",
            "scarecrow",
            "wooden-granary",
            "straw-bales",
            "field-marker",
            "burning-crop-pile",
            "yomi-warp-torii",
        ),
        platforms=(
            "paddy-dike-center",
            "paddy-dike-left",
            "paddy-dike-right",
            "muddy-cracked",
            "long-plank",
            "short-plank",
            "straw-bale-platform",
            "field-hut-roof",
            "irrigation-stone-steps",
            "muddy-dike-slope",
            "drainage-stone-ledge",
            "flooded-plague-ditch",
        ),
    ),
)


PACK_PROMPTS = {
    "kai-forest": {
        "sky": (
            "Opaque moonlit night sky above the ancient Kai forest, with indigo "
            "storm clouds and restrained Yomi haze; no terrain or characters."
        ),
        "far": (
            "Distant wooded mountain silhouettes and mist bands for Kai forest, "
            "isolated on a flat magenta chroma background."
        ),
        "mid": (
            "Coherent middle-distance band of giant ancient cedars, a charcoal "
            "burner shelter and ward ropes, isolated on magenta chroma."
        ),
        "near": (
            "Near forest framing of roots, ferns, broken branches and fog with an "
            "open gameplay center, isolated on magenta chroma."
        ),
        "props": (
            "Twelve separate front-orthographic Kai forest props in a strict "
            "4 by 3 magenta-chroma atlas."
        ),
        "platforms": (
            "Twelve separate side-orthographic forest earth, log, root, stone and "
            "hazard platforms in a strict 4 by 3 magenta-chroma atlas."
        ),
    },
    "tsuru-fields": {
        "sky": (
            "Opaque storm sky over the flooded Tsuru rice fields, with cold dawn "
            "light and distant plague smoke; no terrain or characters."
        ),
        "far": (
            "Distant rural hills, levees and tree silhouettes behind Tsuru fields, "
            "isolated on a flat magenta chroma background."
        ),
        "mid": (
            "Coherent middle-distance rice-field band with watermill, hut, bridges "
            "and flooded paddies, isolated on magenta chroma."
        ),
        "near": (
            "Near rice-field framing of reeds, water channels, broken fencing and "
            "muddy banks with an open center, isolated on magenta chroma."
        ),
        "props": (
            "Twelve separate front-orthographic Tsuru field props in a strict "
            "4 by 3 magenta-chroma atlas."
        ),
        "platforms": (
            "Twelve separate side-orthographic paddy dikes, planks, roofs, stone "
            "ledges and hazards in a strict 4 by 3 magenta-chroma atlas."
        ),
    },
}


def pixel_values(image: Image.Image) -> Iterable[tuple[int, ...]]:
    getter = getattr(image, "get_flattened_data", image.getdata)
    return getter()


def save_png(image: Image.Image, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, format="PNG", optimize=True)


def boundaries(length: int, count: int) -> list[int]:
    return [round(index * length / count) for index in range(count + 1)]


def infer_empty_gutter_boundaries(
    atlas: Image.Image,
    axis: str,
    count: int,
) -> list[int]:
    """Place grid cuts in the empty gutter nearest each nominal boundary."""

    alpha = atlas.getchannel("A")
    if axis == "x":
        length = atlas.width
        orthogonal = atlas.height
        ink = [
            sum(1 for y in range(orthogonal) if alpha.getpixel((position, y)) >= 20)
            for position in range(length)
        ]
    else:
        length = atlas.height
        orthogonal = atlas.width
        ink = [
            sum(1 for x in range(orthogonal) if alpha.getpixel((x, position)) >= 20)
            for position in range(length)
        ]

    nominal = length / count
    result = [0]
    sample_radius = max(1, round(length / 700))
    for index in range(1, count):
        expected = round(index * nominal)
        search_radius = round(nominal * 0.22)
        start = max(result[-1] + 8, expected - search_radius)
        end = min(length - 8, expected + search_radius)
        candidates = []
        for position in range(start, end + 1):
            score = sum(
                ink[sample]
                for sample in range(
                    max(0, position - sample_radius),
                    min(length, position + sample_radius + 1),
                )
            )
            candidates.append((score, abs(position - expected), position))
        if not candidates:
            raise ValueError(f"Impossible d'inférer la gouttière {axis}/{index}")
        result.append(min(candidates)[2])
    result.append(length)
    return result


def source_destination(pack_root: Path, kind: str) -> Path:
    group = "layers" if kind in {"sky", "far", "mid", "near"} else kind
    filename = (
        f"{kind}-imagegen-raw.png"
        if group == "layers"
        else "atlas-imagegen-raw.png"
    )
    return pack_root / group / "source" / filename


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def ensure_raw_source(pack: PackSpec, kind: str, source_root: Path) -> Path:
    pack_root = ENVIRONMENT_ROOT / pack.zone_id
    destination = source_destination(pack_root, kind)
    external = source_root / pack.source_files[kind]
    if external.exists():
        destination.parent.mkdir(parents=True, exist_ok=True)
        external_hash = file_sha256(external)
        if destination.exists() and file_sha256(destination) == external_hash:
            try:
                if os.path.samefile(destination, external):
                    return destination
            except OSError:
                pass
        if destination.exists():
            destination.unlink()
        try:
            os.link(external, destination)
        except OSError:
            shutil.copy2(external, destination)
        if file_sha256(destination) != external_hash:
            raise RuntimeError(f"Copie brute altérée: {destination}")
    if not destination.exists():
        raise FileNotFoundError(
            f"Source absente pour {pack.zone_id}/{kind}: {external} "
            f"et {destination}"
        )
    return destination


def sampled_chroma_key(source: Image.Image) -> tuple[int, int, int]:
    rgb = source.convert("RGB")
    width, height = rgb.size
    stride_x = max(1, width // 128)
    stride_y = max(1, height // 96)
    border = []
    border_depth_x = max(4, width // 40)
    border_depth_y = max(4, height // 40)
    for y in range(0, height, stride_y):
        for x in range(0, width, stride_x):
            if (
                x >= border_depth_x
                and x < width - border_depth_x
                and y >= border_depth_y
                and y < height - border_depth_y
            ):
                continue
            pixel = rgb.getpixel((x, y))
            if max(pixel) > 150 and max(pixel) - min(pixel) > 80:
                border.append(pixel)
    if len(border) < 16:
        raise ValueError("Impossible d'échantillonner le chroma sur la bordure")
    quantized = Counter(
        tuple(channel // 8 for channel in pixel)
        for pixel in border
    )
    dominant = quantized.most_common(1)[0][0]
    cluster = [
        pixel for pixel in border
        if tuple(channel // 8 for channel in pixel) == dominant
    ]
    return (
        round(median(pixel[0] for pixel in cluster)),
        round(median(pixel[1] for pixel in cluster)),
        round(median(pixel[2] for pixel in cluster)),
    )


def remove_chroma(source: Image.Image) -> tuple[Image.Image, dict[str, object]]:
    rgba = source.convert("RGBA")
    key_red, key_green, key_blue = sampled_chroma_key(source)
    if key_green > max(key_red, key_blue):
        key_kind = "green"
    elif min(key_red, key_blue) > key_green:
        key_kind = "magenta"
    else:
        key_kind = "generic"
    output = []
    transparent = 0
    partial = 0
    despilled = 0

    for red, green, blue, source_alpha in pixel_values(rgba):
        distance = (
            (red - key_red) ** 2
            + (green - key_green) ** 2
            + (blue - key_blue) ** 2
        ) ** 0.5
        if key_kind == "green":
            chroma_excess = green - max(red, blue)
            strongly_chroma = green > 178 and chroma_excess > 142
        elif key_kind == "magenta":
            chroma_excess = min(red, blue) - green
            strongly_chroma = red > 178 and blue > 178 and chroma_excess > 142
        else:
            chroma_excess = 0
            strongly_chroma = False
        if distance <= 34 or strongly_chroma:
            alpha = 0
        elif distance >= 112 or chroma_excess <= 42:
            alpha = source_alpha
        else:
            matte = max(0.0, min(1.0, (distance - 34) / 78))
            dominance_matte = max(0.0, min(1.0, (142 - chroma_excess) / 100))
            alpha = round(source_alpha * max(matte, dominance_matte))

        if alpha == 0:
            transparent += 1
            output.append((0, 0, 0, 0))
            continue
        if alpha < 255:
            partial += 1
        if key_kind == "green" and alpha < 255 and green > max(red, blue) + 10:
            green = max(red, blue) + 10
            despilled += 1
        elif key_kind == "magenta" and alpha < 255:
            spill = max(0, min(red, blue) - green - 10)
            if spill:
                red -= spill
                blue -= spill
                despilled += 1
        output.append((red, green, blue, alpha))

    result = Image.new("RGBA", rgba.size)
    result.putdata(output)
    return result, {
        "keyRed": key_red,
        "keyGreen": key_green,
        "keyBlue": key_blue,
        "keyHex": f"#{key_red:02x}{key_green:02x}{key_blue:02x}",
        "keyKind": key_kind,
        "transparentPixels": transparent,
        "partialAlphaPixels": partial,
        "despilledPixels": despilled,
    }


def build_sky(source_path: Path, destination: Path) -> dict[str, object]:
    with Image.open(source_path) as source:
        sky = source.convert("RGB").resize(TARGET_SIZE, Image.Resampling.NEAREST)
    save_png(sky, destination)
    return {"mode": sky.mode, "size": list(sky.size), "opaque": True}


def build_transparent_layer(
    source_path: Path,
    destination: Path,
) -> dict[str, object]:
    with Image.open(source_path) as source:
        cleaned, chroma = remove_chroma(source)
    scale = min(TARGET_SIZE[0] / cleaned.width, TARGET_SIZE[1] / cleaned.height)
    scaled_size = (
        max(1, round(cleaned.width * scale)),
        max(1, round(cleaned.height * scale)),
    )
    scaled = cleaned.resize(scaled_size, Image.Resampling.NEAREST)
    canvas = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))
    offset = ((TARGET_SIZE[0] - scaled.width) // 2, TARGET_SIZE[1] - scaled.height)
    canvas.alpha_composite(scaled, offset)
    save_png(canvas, destination)
    alpha = canvas.getchannel("A")
    return {
        "mode": canvas.mode,
        "size": list(canvas.size),
        "sourceScale": round(scale, 6),
        "placement": list(offset),
        "alphaBounds": list(alpha.getbbox() or ()),
        **chroma,
    }


def alpha_components(
    image: Image.Image,
    alpha_threshold: int = 20,
) -> list[AlphaComponent]:
    width, height = image.size
    alpha = image.getchannel("A")
    occupied = bytearray(
        1 if value >= alpha_threshold else 0
        for value in pixel_values(alpha)
    )
    components = []
    for start, active in enumerate(occupied):
        if not active:
            continue
        stack = [start]
        occupied[start] = 0
        area = 0
        min_x = width
        min_y = height
        max_x = -1
        max_y = -1
        sum_x = 0
        sum_y = 0
        while stack:
            index = stack.pop()
            y, x = divmod(index, width)
            area += 1
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)
            sum_x += x
            sum_y += y
            if x > 0 and occupied[index - 1]:
                occupied[index - 1] = 0
                stack.append(index - 1)
            if x + 1 < width and occupied[index + 1]:
                occupied[index + 1] = 0
                stack.append(index + 1)
            if y > 0 and occupied[index - width]:
                occupied[index - width] = 0
                stack.append(index - width)
            if y + 1 < height and occupied[index + width]:
                occupied[index + width] = 0
                stack.append(index + width)
        if area < 3:
            continue
        components.append(
            AlphaComponent(
                area=area,
                bbox=(min_x, min_y, max_x + 1, max_y + 1),
                centroid=(sum_x / area, sum_y / area),
            )
        )
    return components


def assign_components_to_grid(
    atlas: Image.Image,
) -> dict[tuple[int, int], list[AlphaComponent]]:
    assigned: dict[tuple[int, int], list[AlphaComponent]] = {}
    for component in alpha_components(atlas):
        center_x, center_y = component.centroid
        column = min(GRID[0] - 1, int(center_x * GRID[0] / atlas.width))
        row = min(GRID[1] - 1, int(center_y * GRID[1] / atlas.height))
        assigned.setdefault((column, row), []).append(component)
    return assigned


def crop_sprite(
    atlas: Image.Image,
    components: list[AlphaComponent],
    sprite_id: str,
    bottom_padding: int = PADDING,
) -> tuple[Image.Image, dict[str, object]]:
    if not components:
        raise ValueError(f"Cellule vide pour {sprite_id}")
    bounds = (
        min(component.bbox[0] for component in components),
        min(component.bbox[1] for component in components),
        max(component.bbox[2] for component in components),
        max(component.bbox[3] for component in components),
    )
    subject = atlas.crop(bounds)
    canvas = Image.new(
        "RGBA",
        (subject.width + PADDING * 2, subject.height + PADDING + bottom_padding),
        (0, 0, 0, 0),
    )
    canvas.alpha_composite(subject, (PADDING, PADDING))
    return canvas, {
        "size": [canvas.width, canvas.height],
        "alphaBounds": [PADDING, PADDING, PADDING + subject.width, PADDING + subject.height],
        "sourceBounds": list(bounds),
        "transparentPadding": PADDING,
        "bottomTransparentPadding": bottom_padding,
        "nonEmpty": True,
    }


def build_atlas_group(
    pack: PackSpec,
    kind: str,
    source_path: Path,
) -> dict[str, object]:
    pack_root = ENVIRONMENT_ROOT / pack.zone_id
    group_root = pack_root / kind
    with Image.open(source_path) as source:
        alpha_atlas, chroma = remove_chroma(source)

    names = pack.props if kind == "props" else pack.platforms
    x_bounds = infer_empty_gutter_boundaries(alpha_atlas, "x", GRID[0])
    y_bounds = infer_empty_gutter_boundaries(alpha_atlas, "y", GRID[1])
    assigned_components = assign_components_to_grid(alpha_atlas)
    sprites = []
    for index, sprite_id in enumerate(names):
        column = index % GRID[0]
        row = index // GRID[0]
        sprite, metrics = crop_sprite(
            alpha_atlas,
            assigned_components.get((column, row), []),
            sprite_id,
            PROP_BOTTOM_PADDING if kind == "props" else PADDING,
        )
        destination = group_root / f"{sprite_id}.png"
        save_png(sprite, destination)
        sprite_record = {
            "id": sprite_id,
            "file": destination.name,
            "sourceCell": [column, row],
            **metrics,
            "alphaMode": "straight-transparent",
            "groundAnchor": [0.5, 1.0],
        }
        if kind == "props":
            sprite_record.update(
                {
                    "projection": "front-orthographic",
                    "depthUsage": "gameplay-plane",
                    "contactMode": "opaque-bottom",
                }
            )
        else:
            sprite_record.update(
                {
                    "projection": "side-orthographic",
                    "collision": "authored-top-edge",
                    "contactMode": "playable-top",
                }
            )
        sprites.append(sprite_record)

    manifest = {
        "schema": 2,
        "zoneId": pack.zone_id,
        "assetType": kind[:-1],
        "count": len(sprites),
        "source": str(source_path.relative_to(ROOT)).replace("\\", "/"),
        "alphaSourceDerivedAtBuild": True,
        "grid": {"columns": GRID[0], "rows": GRID[1]},
        "gridBoundaries": {"x": x_bounds, "y": y_bounds},
        "renderPolicy": {
            "projection": "front-orthographic" if kind == "props" else "side-orthographic",
            "transparentPadding": PADDING,
            "bottomTransparentPadding": (
                PROP_BOTTOM_PADDING if kind == "props" else PADDING
            ),
            "weaponsOrCharactersBakedIn": False,
        },
        "chroma": chroma,
        "sprites": sprites,
    }
    manifest_path = group_root / "manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return manifest


def build_pack(pack: PackSpec, source_root: Path) -> dict[str, object]:
    pack_root = ENVIRONMENT_ROOT / pack.zone_id
    sources = {
        kind: ensure_raw_source(pack, kind, source_root)
        for kind in pack.source_files
    }

    layer_records = {}
    for layer_id in ("sky", "far", "mid", "near"):
        destination = pack_root / "layers" / f"{layer_id}.png"
        if layer_id == "sky":
            metrics = build_sky(sources[layer_id], destination)
        else:
            metrics = build_transparent_layer(sources[layer_id], destination)
        layer_records[layer_id] = {
            "id": layer_id,
            "file": str(destination.relative_to(ROOT)).replace("\\", "/"),
            "source": str(sources[layer_id].relative_to(ROOT)).replace("\\", "/"),
            **metrics,
        }

    props_manifest = build_atlas_group(pack, "props", sources["props"])
    platforms_manifest = build_atlas_group(pack, "platforms", sources["platforms"])
    pack_manifest = {
        "schema": 1,
        "id": pack.zone_id,
        "name": pack.name,
        "lore": pack.lore,
        "gameplay": pack.gameplay,
        "generationTool": "OpenAI ImageGen built-in",
        "prompts": PACK_PROMPTS.get(pack.zone_id, {}),
        "renderStandard": {
            "resolution": list(TARGET_SIZE),
            "layerOrderBackToFront": ["sky", "far", "mid", "near"],
            "skyOpaque": True,
            "transparentLayers": True,
            "atlasGrid": {"columns": GRID[0], "rows": GRID[1]},
        },
        "layers": layer_records,
        "propsManifest": str(
            (pack_root / "props" / "manifest.json").relative_to(ROOT)
        ).replace("\\", "/"),
        "platformsManifest": str(
            (pack_root / "platforms" / "manifest.json").relative_to(ROOT)
        ).replace("\\", "/"),
        "totals": {
            "layers": len(layer_records),
            "props": props_manifest["count"],
            "platforms": platforms_manifest["count"],
        },
    }
    (pack_root / "manifest.json").write_text(
        json.dumps(pack_manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return pack_manifest


def project_path(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def global_environment_record(pack: PackSpec) -> dict[str, object]:
    pack_root = ENVIRONMENT_ROOT / pack.zone_id
    prompts = PACK_PROMPTS[pack.zone_id]
    layers = {}
    for layer_id in ("sky", "far", "mid", "near"):
        layers[layer_id] = {
            "file": project_path(pack_root / "layers" / f"{layer_id}.png"),
            "source": project_path(source_destination(pack_root, layer_id)),
            "prompt": prompts[layer_id],
        }
    return {
        "id": pack.zone_id,
        "name": pack.name,
        "lore": pack.lore,
        "gameplay": pack.gameplay,
        "packManifest": project_path(pack_root / "manifest.json"),
        "layers": layers,
        "props": {
            "sourceAtlas": project_path(source_destination(pack_root, "props")),
            "manifest": project_path(pack_root / "props" / "manifest.json"),
            "prompt": prompts["props"],
            "items": [
                project_path(pack_root / "props" / f"{sprite_id}.png")
                for sprite_id in pack.props
            ],
        },
        "platforms": {
            "sourceAtlas": project_path(source_destination(pack_root, "platforms")),
            "manifest": project_path(pack_root / "platforms" / "manifest.json"),
            "prompt": prompts["platforms"],
            "items": [
                project_path(pack_root / "platforms" / f"{sprite_id}.png")
                for sprite_id in pack.platforms
            ],
        },
    }


def sync_global_environment_manifest(packs: Iterable[PackSpec]) -> None:
    manifest_path = ROOT / "assets" / "modular" / "manifests" / "environments.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    zones = manifest["zones"]
    indices = {zone["id"]: index for index, zone in enumerate(zones)}
    for pack in packs:
        if pack.zone_id not in PACK_PROMPTS:
            continue
        record = global_environment_record(pack)
        if pack.zone_id in indices:
            zones[indices[pack.zone_id]] = record
        else:
            indices[pack.zone_id] = len(zones)
            zones.append(record)

    manifest["count"] = len(zones)
    manifest["totals"] = {
        "layers": sum(len(zone.get("layers", {})) for zone in zones),
        "props": sum(len(zone.get("props", {}).get("items", [])) for zone in zones),
        "platforms": sum(
            len(zone.get("platforms", {}).get("items", []))
            for zone in zones
        ),
    }
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def validate_pack(pack: PackSpec) -> dict[str, object]:
    pack_root = ENVIRONMENT_ROOT / pack.zone_id
    errors = []
    layer_modes = {}
    for layer_id in ("sky", "far", "mid", "near"):
        path = pack_root / "layers" / f"{layer_id}.png"
        if not path.exists():
            errors.append(f"{path}: absent")
            continue
        with Image.open(path) as image:
            layer_modes[layer_id] = image.mode
            if image.size != TARGET_SIZE:
                errors.append(f"{path}: taille {image.size}, attendu {TARGET_SIZE}")
            if layer_id == "sky" and image.mode != "RGB":
                errors.append(f"{path}: ciel non opaque ({image.mode})")
            if layer_id != "sky":
                if image.mode != "RGBA":
                    errors.append(f"{path}: couche non RGBA ({image.mode})")
                elif image.getchannel("A").getbbox() is None:
                    errors.append(f"{path}: couche transparente vide")

    for kind, names in (("props", pack.props), ("platforms", pack.platforms)):
        manifest_path = pack_root / kind / "manifest.json"
        if not manifest_path.exists():
            errors.append(f"{manifest_path}: absent")
            continue
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        if manifest.get("count") != 12:
            errors.append(f"{manifest_path}: 12 sprites attendus")
        if [sprite.get("id") for sprite in manifest.get("sprites", [])] != list(names):
            errors.append(f"{manifest_path}: ordre ou identifiants incohérents")
        for sprite_id in names:
            sprite_path = pack_root / kind / f"{sprite_id}.png"
            if not sprite_path.exists():
                errors.append(f"{sprite_path}: absent")
                continue
            with Image.open(sprite_path) as image:
                if image.mode != "RGBA":
                    errors.append(f"{sprite_path}: mode {image.mode}")
                    continue
                alpha = image.getchannel("A")
                corners = [
                    alpha.getpixel((0, 0)),
                    alpha.getpixel((image.width - 1, 0)),
                    alpha.getpixel((0, image.height - 1)),
                    alpha.getpixel((image.width - 1, image.height - 1)),
                ]
                if any(corners):
                    errors.append(f"{sprite_path}: coin non transparent")
                bounds = alpha.getbbox()
                if bounds is None:
                    errors.append(f"{sprite_path}: sprite vide")
                else:
                    expected_bottom = (
                        PROP_BOTTOM_PADDING if kind == "props" else PADDING
                    )
                    if min(bounds[0], bounds[1], image.width - bounds[2]) < PADDING:
                        errors.append(
                            f"{sprite_path}: padding latéral/supérieur inférieur à {PADDING}"
                        )
                    if image.height - bounds[3] < expected_bottom:
                        errors.append(
                            f"{sprite_path}: padding bas inférieur à {expected_bottom}"
                        )

    if errors:
        raise RuntimeError("\n".join(errors))
    return {
        "zoneId": pack.zone_id,
        "layers": 4,
        "props": len(pack.props),
        "platforms": len(pack.platforms),
        "layerModes": layer_modes,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, default=DEFAULT_SOURCE_ROOT)
    parser.add_argument(
        "--zone",
        action="append",
        choices=[pack.zone_id for pack in PACKS],
        help="Limiter la génération à un pack; répétable.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Valider les sorties existantes sans les régénérer.",
    )
    args = parser.parse_args()
    selected = [
        pack for pack in PACKS
        if not args.zone or pack.zone_id in set(args.zone)
    ]
    reports = []
    for pack in selected:
        if not args.check:
            build_pack(pack, args.source_root.resolve())
        reports.append(validate_pack(pack))
    if not args.check:
        sync_global_environment_manifest(selected)
    print(json.dumps({"packs": reports}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
