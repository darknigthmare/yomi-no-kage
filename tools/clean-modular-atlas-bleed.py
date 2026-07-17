#!/usr/bin/env python3
"""Remove cell-neighbour bleed from final modular PNG sprites.

The generated source atlases are intentionally left untouched.  A final sprite
is considered contaminated when a disconnected alpha component other than the
largest object reaches one of the four canvas edges.  The canvas size and the
largest component remain byte-for-pixel unchanged.

Run without ``--apply`` for a read-only report.  ``--apply`` rewrites only the
reported final PNG files.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from math import sqrt
from pathlib import Path
from typing import Iterable

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MODULAR = ROOT / "assets" / "modular"
WEAPONS_MANIFEST = MODULAR / "manifests" / "weapons.json"
CLIPPED_WEAPONS = {
    "yumi-daikyu",
    "tanegashima-teppo",
    "bo",
    "odachi",
    "kikuchi-yari",
    "nodachi-geant-yomi",
}
ORIGINAL_CLIPPED_ANCHORS = {
    "yumi-daikyu": [0.52, 0.50],
    "tanegashima-teppo": [0.27, 0.67],
    "bo": [0.32, 0.64],
    "odachi": [0.19, 0.82],
    "kikuchi-yari": [0.23, 0.80],
    "nodachi-geant-yomi": [0.20, 0.80],
}
INTENTIONAL_EMPTY_PIVOTS = {
    # A pair of detachable cuffs uses the midpoint of the joining chain as its
    # boss-rig pivot rather than a point painted on one cuff.
    "chaines-menottes-nuno",
}
CURATED_WEAPON_ANCHORS = {
    # Firearms: hand on the curved grip / wrist of the stock, not the lock or
    # the butt end that happened to define the old cell crop.
    "bajozutsu": [0.20, 0.70],
    "tanegashima-cavalerie": [0.32, 0.62],
    # Staff: center of the wrapped grip.
    "jo": [0.34, 0.62],
    # Sword: center of the wrapped hilt rather than the pommel.
    "tachi": [0.16, 0.84],
    # Giant equipment uses its logical rig attachment.
    "belier-bambou-take-mori": [0.50, 0.50],
    "encensoir-spores-kinoko": [0.77, 0.88],
    "nodachi-geant-yomi": [0.84, 0.14],
}


@dataclass
class Component:
    pixels: list[int]
    area: int
    bbox: tuple[int, int, int, int]
    touches_edge: bool


def iter_final_sprites() -> Iterable[tuple[str, Path]]:
    for pack in ("polearms", "ranged", "elite", "giant"):
        for path in sorted((MODULAR / "weapons" / pack).glob("*.png")):
            yield "weapon", path

    environments = MODULAR / "environments"
    for sprite_type in ("props", "platforms"):
        for path in sorted(environments.glob(f"*/{sprite_type}/*.png")):
            yield sprite_type[:-1], path


def alpha_components(alpha: Image.Image) -> list[Component]:
    width, height = alpha.size
    get_values = getattr(alpha, "get_flattened_data", alpha.getdata)
    occupied = bytearray(1 if value else 0 for value in get_values())
    components: list[Component] = []

    for start, value in enumerate(occupied):
        if not value:
            continue

        stack = [start]
        occupied[start] = 0
        pixels: list[int] = []
        min_x = width
        min_y = height
        max_x = -1
        max_y = -1

        while stack:
            index = stack.pop()
            y, x = divmod(index, width)
            pixels.append(index)
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)

            if x and occupied[index - 1]:
                occupied[index - 1] = 0
                stack.append(index - 1)
            if x + 1 < width and occupied[index + 1]:
                occupied[index + 1] = 0
                stack.append(index + 1)
            if y and occupied[index - width]:
                occupied[index - width] = 0
                stack.append(index - width)
            if y + 1 < height and occupied[index + width]:
                occupied[index + width] = 0
                stack.append(index + width)

        bbox = (min_x, min_y, max_x + 1, max_y + 1)
        components.append(
            Component(
                pixels=pixels,
                area=len(pixels),
                bbox=bbox,
                touches_edge=(
                    min_x == 0
                    or min_y == 0
                    or max_x + 1 == width
                    or max_y + 1 == height
                ),
            )
        )

    components.sort(key=lambda component: component.area, reverse=True)
    return components


def inspect(path: Path) -> tuple[Image.Image, list[Component]]:
    with Image.open(path) as source:
        rgba = source.convert("RGBA")
    components = alpha_components(rgba.getchannel("A"))
    if not components:
        return rgba, []
    return rgba, [
        component
        for component in components[1:]
        if component.touches_edge
    ]


def clear_components(image: Image.Image, components: list[Component]) -> None:
    pixels = image.load()
    width, _ = image.size
    for component in components:
        for index in component.pixels:
            y, x = divmod(index, width)
            pixels[x, y] = (0, 0, 0, 0)


def boundaries(length: int, count: int) -> list[int]:
    return [round(index * length / count) for index in range(count + 1)]


def component_centroid(component: Component, width: int) -> tuple[float, float]:
    sum_x = 0
    sum_y = 0
    for index in component.pixels:
        y, x = divmod(index, width)
        sum_x += x
        sum_y += y
    return sum_x / component.area, sum_y / component.area


def compose_components(
    source: Image.Image,
    components: list[Component],
) -> tuple[Image.Image, tuple[int, int, int, int]]:
    left = min(component.bbox[0] for component in components)
    top = min(component.bbox[1] for component in components)
    right = max(component.bbox[2] for component in components)
    bottom = max(component.bbox[3] for component in components)
    output = Image.new("RGBA", (right - left, bottom - top), (0, 0, 0, 0))
    source_pixels = source.load()
    output_pixels = output.load()
    source_width, _ = source.size

    for component in components:
        for index in component.pixels:
            y, x = divmod(index, source_width)
            output_pixels[x - left, y - top] = source_pixels[x, y]

    return output, (left, top, right, bottom)


def padded_components(
    source: Image.Image,
    components: list[Component],
    padding: int = 4,
) -> tuple[Image.Image, tuple[int, int, int, int]]:
    complete, full_bbox = compose_components(source, components)
    output = Image.new(
        "RGBA",
        (complete.width + padding * 2, complete.height + padding * 2),
        (0, 0, 0, 0),
    )
    output.alpha_composite(complete, (padding, padding))
    return output, full_bbox


def assign_components_to_grid(
    atlas: Image.Image,
    columns: int,
    rows: int,
) -> dict[tuple[int, int], list[Component]]:
    atlas_width, atlas_height = atlas.size
    assigned: dict[tuple[int, int], list[Component]] = {}
    for component in alpha_components(atlas.getchannel("A")):
        center_x, center_y = component_centroid(component, atlas_width)
        column = min(columns - 1, int(center_x * columns / atlas_width))
        row = min(rows - 1, int(center_y * rows / atlas_height))
        assigned.setdefault((column, row), []).append(component)
    return assigned


def original_cell_origin(
    atlas: Image.Image,
    column: int,
    row: int,
    columns: int,
    rows: int,
    padding: int = 4,
) -> tuple[int, int]:
    x_bounds = boundaries(atlas.width, columns)
    y_bounds = boundaries(atlas.height, rows)
    cell = atlas.crop(
        (
            x_bounds[column],
            y_bounds[row],
            x_bounds[column + 1],
            y_bounds[row + 1],
        )
    )
    cell_bbox = cell.getchannel("A").getbbox()
    if cell_bbox is None:
        raise RuntimeError(f"Cellule alpha vide: {(column, row)}")
    crop_left = max(0, cell_bbox[0] - padding)
    crop_top = max(0, cell_bbox[1] - padding)
    return x_bounds[column] + crop_left, y_bounds[row] + crop_top


def rebuild_all_from_atlases(apply: bool) -> list[dict[str, object]]:
    """Rebuild all 48 weapons and 72 decor sprites from global components."""

    weapons_manifest = json.loads(WEAPONS_MANIFEST.read_text(encoding="utf-8"))
    weapon_entries = {
        entry["id"]: entry for entry in weapons_manifest.get("entries", [])
    }
    report: list[dict[str, object]] = []

    grid_jobs: list[tuple[str, Path]] = []
    for pack in ("polearms", "ranged", "elite", "giant"):
        grid_jobs.append(
            ("weapon", MODULAR / "weapons" / pack / "manifest.json")
        )
    for zone in ("kurokawa", "bamboo-shrine", "daimyo-castle"):
        for group in ("props", "platforms"):
            grid_jobs.append(
                (
                    group[:-1],
                    MODULAR
                    / "environments"
                    / zone
                    / group
                    / "manifest.json",
                )
            )

    for sprite_type, grid_manifest_path in grid_jobs:
        grid_manifest = json.loads(
            grid_manifest_path.read_text(encoding="utf-8")
        )
        source_path = ROOT / Path(grid_manifest["source"])
        atlas = Image.open(source_path).convert("RGBA")
        columns = int(grid_manifest["grid"]["columns"])
        rows = int(grid_manifest["grid"]["rows"])
        assigned = assign_components_to_grid(atlas, columns, rows)
        changed_manifest = False

        for sprite in grid_manifest.get("sprites", []):
            sprite_id = sprite["id"]
            column, row = sprite["sourceCell"]
            components = assigned.get((column, row), [])
            if not components:
                raise RuntimeError(
                    f"{grid_manifest_path}: aucune composante pour "
                    f"{sprite_id} cellule {(column, row)}"
                )

            output, full_bbox = padded_components(atlas, components)
            output_path = grid_manifest_path.parent / sprite["file"]
            old_size = list(sprite.get("size", []))
            new_size = [output.width, output.height]
            anchor_before = None
            anchor_after = None

            if sprite_type == "weapon" and sprite_id in weapon_entries:
                entry = weapon_entries[sprite_id]
                anchor_before = list(entry["anchor"])
                if old_size != new_size:
                    original_anchor = ORIGINAL_CLIPPED_ANCHORS.get(
                        sprite_id,
                        anchor_before,
                    )
                    old_width, old_height = old_size
                    origin_x, origin_y = original_cell_origin(
                        atlas,
                        column,
                        row,
                        columns,
                        rows,
                    )
                    grip_global_x = (
                        origin_x + original_anchor[0] * (old_width - 1)
                    )
                    grip_global_y = (
                        origin_y + original_anchor[1] * (old_height - 1)
                    )
                    remapped = [
                        (grip_global_x - full_bbox[0] + 4)
                        / (output.width - 1),
                        (grip_global_y - full_bbox[1] + 4)
                        / (output.height - 1),
                    ]
                    # If a foreign neighbour inflated the old cell so much
                    # that its historical anchor falls outside the rebuilt
                    # object (the short yumi is the known example), retain the
                    # semantic normalized grip instead of clamping it to an
                    # unusable canvas edge.
                    if all(0.0 <= value <= 1.0 for value in remapped):
                        anchor_after = [
                            round(remapped[0], 4),
                            round(remapped[1], 4),
                        ]
                    else:
                        anchor_after = original_anchor
                else:
                    anchor_after = anchor_before

                if apply:
                    entry["anchor"] = anchor_after

            if apply:
                output.save(output_path, format="PNG", optimize=False)
                sprite["size"] = new_size
                sprite["nonEmpty"] = True
                changed_manifest = changed_manifest or old_size != new_size

            report.append(
                {
                    "type": sprite_type,
                    "file": output_path.relative_to(ROOT).as_posix(),
                    "source": source_path.relative_to(ROOT).as_posix(),
                    "sourceCell": [column, row],
                    "components": len(components),
                    "sizeBefore": old_size,
                    "sizeAfter": new_size,
                    "anchorBefore": anchor_before,
                    "anchorAfter": anchor_after,
                }
            )

        if apply and changed_manifest:
            grid_manifest_path.write_text(
                json.dumps(grid_manifest, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )

    if apply:
        WEAPONS_MANIFEST.write_text(
            json.dumps(weapons_manifest, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    return report


def read_report_json(path: Path) -> dict:
    raw = path.read_bytes()
    for encoding in ("utf-8", "utf-16"):
        try:
            return json.loads(raw.decode(encoding))
        except (UnicodeDecodeError, json.JSONDecodeError):
            continue
    raise ValueError(f"Rapport JSON illisible: {path}")


def recalculate_anchors_from_report(
    report_path: Path,
    apply: bool,
) -> list[dict[str, object]]:
    """Repair anchors after a first rebuild recorded old and new canvas sizes."""

    history = read_report_json(report_path).get("rebuiltFromAtlases", [])
    changed = {
        Path(entry["file"]).stem: entry
        for entry in history
        if entry.get("type") == "weapon"
        and entry.get("sizeBefore") != entry.get("sizeAfter")
    }
    weapons_manifest = json.loads(WEAPONS_MANIFEST.read_text(encoding="utf-8"))
    weapon_entries = {
        entry["id"]: entry for entry in weapons_manifest.get("entries", [])
    }
    result: list[dict[str, object]] = []

    for pack in ("polearms", "ranged", "elite", "giant"):
        pack_manifest_path = MODULAR / "weapons" / pack / "manifest.json"
        pack_manifest = json.loads(
            pack_manifest_path.read_text(encoding="utf-8")
        )
        atlas_path = ROOT / Path(pack_manifest["source"])
        atlas = Image.open(atlas_path).convert("RGBA")
        columns = int(pack_manifest["grid"]["columns"])
        rows = int(pack_manifest["grid"]["rows"])
        assigned = assign_components_to_grid(atlas, columns, rows)

        for sprite in pack_manifest.get("sprites", []):
            weapon_id = sprite["id"]
            historical = changed.get(weapon_id)
            if historical is None or weapon_id not in weapon_entries:
                continue

            column, row = sprite["sourceCell"]
            components = assigned[(column, row)]
            full_bbox = (
                min(component.bbox[0] for component in components),
                min(component.bbox[1] for component in components),
                max(component.bbox[2] for component in components),
                max(component.bbox[3] for component in components),
            )
            old_width, old_height = historical["sizeBefore"]
            new_width, new_height = historical["sizeAfter"]
            old_anchor = ORIGINAL_CLIPPED_ANCHORS.get(
                weapon_id,
                historical["anchorBefore"],
            )
            origin_x, origin_y = original_cell_origin(
                atlas,
                column,
                row,
                columns,
                rows,
            )
            grip_global_x = origin_x + old_anchor[0] * (old_width - 1)
            grip_global_y = origin_y + old_anchor[1] * (old_height - 1)
            remapped = [
                (grip_global_x - full_bbox[0] + 4) / (new_width - 1),
                (grip_global_y - full_bbox[1] + 4) / (new_height - 1),
            ]
            new_anchor = (
                [round(remapped[0], 4), round(remapped[1], 4)]
                if all(0.0 <= value <= 1.0 for value in remapped)
                else list(old_anchor)
            )
            current = list(weapon_entries[weapon_id]["anchor"])
            if apply:
                weapon_entries[weapon_id]["anchor"] = new_anchor
            result.append(
                {
                    "id": weapon_id,
                    "anchorBeforeCurrent": current,
                    "historicalAnchor": old_anchor,
                    "anchorAfter": new_anchor,
                    "usedSemanticFallback": not all(
                        0.0 <= value <= 1.0 for value in remapped
                    ),
                }
            )

    if apply and result:
        WEAPONS_MANIFEST.write_text(
            json.dumps(weapons_manifest, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    return result


def snap_distant_weapon_anchors(
    apply: bool,
    minimum_distance: float = 10.0,
) -> list[dict[str, object]]:
    """Move invalid grip anchors to the nearest visible weapon pixel."""

    weapons_manifest = json.loads(WEAPONS_MANIFEST.read_text(encoding="utf-8"))
    report: list[dict[str, object]] = []

    for entry in weapons_manifest.get("entries", []):
        weapon_id = entry["id"]
        if weapon_id in INTENTIONAL_EMPTY_PIVOTS:
            continue

        path = ROOT / Path(entry["file"])
        with Image.open(path) as source:
            alpha = source.convert("RGBA").getchannel("A")
        width, height = alpha.size
        pixels = alpha.load()
        anchor = list(entry["anchor"])
        anchor_x = round(anchor[0] * (width - 1))
        anchor_y = round(anchor[1] * (height - 1))
        if pixels[anchor_x, anchor_y]:
            continue

        nearest_x = anchor_x
        nearest_y = anchor_y
        nearest_squared = width * width + height * height
        for y in range(height):
            for x in range(width):
                if not pixels[x, y]:
                    continue
                squared = (x - anchor_x) ** 2 + (y - anchor_y) ** 2
                if squared < nearest_squared:
                    nearest_squared = squared
                    nearest_x = x
                    nearest_y = y

        distance = sqrt(nearest_squared)
        if distance < minimum_distance:
            continue

        new_anchor = [
            round(nearest_x / (width - 1), 4),
            round(nearest_y / (height - 1), 4),
        ]
        if apply:
            entry["anchor"] = new_anchor
        report.append(
            {
                "id": weapon_id,
                "file": entry["file"],
                "anchorBefore": anchor,
                "anchorAfter": new_anchor,
                "distancePixels": round(distance, 2),
            }
        )

    if apply and report:
        WEAPONS_MANIFEST.write_text(
            json.dumps(weapons_manifest, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    return report


def apply_curated_weapon_anchors(apply: bool) -> list[dict[str, object]]:
    """Apply the seven corrections found during the 48-anchor visual review."""

    weapons_manifest = json.loads(WEAPONS_MANIFEST.read_text(encoding="utf-8"))
    report: list[dict[str, object]] = []
    for entry in weapons_manifest.get("entries", []):
        new_anchor = CURATED_WEAPON_ANCHORS.get(entry["id"])
        if new_anchor is None:
            continue
        old_anchor = list(entry["anchor"])
        if apply:
            entry["anchor"] = list(new_anchor)
        report.append(
            {
                "id": entry["id"],
                "file": entry["file"],
                "anchorBefore": old_anchor,
                "anchorAfter": list(new_anchor),
            }
        )

    if apply and report:
        WEAPONS_MANIFEST.write_text(
            json.dumps(weapons_manifest, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    return report


def repair_clipped_weapons(apply: bool) -> list[dict[str, object]]:
    weapons_manifest = json.loads(WEAPONS_MANIFEST.read_text(encoding="utf-8"))
    entries = {
        entry["id"]: entry
        for entry in weapons_manifest.get("entries", [])
        if entry.get("id") in CLIPPED_WEAPONS
    }
    report: list[dict[str, object]] = []

    for pack in ("polearms", "ranged", "elite", "giant"):
        pack_manifest_path = MODULAR / "weapons" / pack / "manifest.json"
        pack_manifest = json.loads(pack_manifest_path.read_text(encoding="utf-8"))
        sprites = pack_manifest.get("sprites", [])
        targets = [sprite for sprite in sprites if sprite.get("id") in entries]
        if not targets:
            continue

        columns = int(pack_manifest["grid"]["columns"])
        rows = int(pack_manifest["grid"]["rows"])
        atlas_path = MODULAR / "weapons" / "atlases" / f"{pack}.png"
        atlas = Image.open(atlas_path).convert("RGBA")
        atlas_width, atlas_height = atlas.size
        x_bounds = boundaries(atlas_width, columns)
        y_bounds = boundaries(atlas_height, rows)
        global_components = alpha_components(atlas.getchannel("A"))
        assigned: dict[tuple[int, int], list[Component]] = {}

        for component in global_components:
            center_x, center_y = component_centroid(component, atlas_width)
            column = min(columns - 1, int(center_x * columns / atlas_width))
            row = min(rows - 1, int(center_y * rows / atlas_height))
            assigned.setdefault((column, row), []).append(component)

        for sprite in targets:
            weapon_id = sprite["id"]
            column, row = sprite["sourceCell"]
            components = assigned.get((column, row), [])
            if not components:
                raise RuntimeError(
                    f"Aucune composante globale pour {weapon_id} cellule {(column, row)}"
                )

            complete, full_bbox = compose_components(atlas, components)
            cell = atlas.crop(
                (
                    x_bounds[column],
                    y_bounds[row],
                    x_bounds[column + 1],
                    y_bounds[row + 1],
                )
            )
            cell_bbox = cell.getchannel("A").getbbox()
            if cell_bbox is None:
                raise RuntimeError(f"Cellule alpha vide pour {weapon_id}")

            crop_left = max(0, cell_bbox[0] - 4)
            crop_top = max(0, cell_bbox[1] - 4)
            old_origin_x = x_bounds[column] + crop_left
            old_origin_y = y_bounds[row] + crop_top

            output_path = MODULAR / "weapons" / pack / f"{weapon_id}.png"
            with Image.open(output_path) as current_source:
                current = current_source.convert("RGBA")
            output_width, output_height = current.size
            source_width, source_height = complete.size
            scale = min(
                (output_width - 8) / source_width,
                (output_height - 8) / source_height,
                1.0,
            )
            resized_width = max(1, round(source_width * scale))
            resized_height = max(1, round(source_height * scale))
            complete = complete.resize(
                (resized_width, resized_height),
                Image.Resampling.NEAREST,
            )
            paste_x = (output_width - resized_width) // 2
            paste_y = (output_height - resized_height) // 2
            repaired = Image.new(
                "RGBA",
                (output_width, output_height),
                (0, 0, 0, 0),
            )
            repaired.alpha_composite(complete, (paste_x, paste_y))

            entry = entries[weapon_id]
            old_anchor = list(entry["anchor"])
            old_anchor_global_x = (
                old_origin_x + old_anchor[0] * (output_width - 1)
            )
            old_anchor_global_y = (
                old_origin_y + old_anchor[1] * (output_height - 1)
            )
            new_anchor_x = paste_x + (
                old_anchor_global_x - full_bbox[0]
            ) * scale
            new_anchor_y = paste_y + (
                old_anchor_global_y - full_bbox[1]
            ) * scale
            new_anchor = [
                round(max(0.0, min(1.0, new_anchor_x / (output_width - 1))), 4),
                round(max(0.0, min(1.0, new_anchor_y / (output_height - 1))), 4),
            ]

            if apply:
                repaired.save(output_path, format="PNG", optimize=False)
                entry["anchor"] = new_anchor

            report.append(
                {
                    "type": "weapon-repair",
                    "file": output_path.relative_to(ROOT).as_posix(),
                    "size": [output_width, output_height],
                    "sourceAtlas": atlas_path.relative_to(ROOT).as_posix(),
                    "sourceCell": [column, row],
                    "fullObjectBbox": list(full_bbox),
                    "fitScale": round(scale, 4),
                    "anchorBefore": old_anchor,
                    "anchorAfter": new_anchor,
                }
            )

    if apply and report:
        WEAPONS_MANIFEST.write_text(
            json.dumps(weapons_manifest, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    return report


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Rewrite contaminated final PNGs. Without this flag, only report.",
    )
    parser.add_argument(
        "--repair-clipped",
        action="store_true",
        help=(
            "Recover the six clipped long weapons from their complete atlas "
            "components while preserving final canvas dimensions."
        ),
    )
    parser.add_argument(
        "--rebuild-from-atlases",
        action="store_true",
        help=(
            "Rebuild all 48 weapon and 72 decor sprites from complete global "
            "atlas components assigned by centroid to their intended cell."
        ),
    )
    parser.add_argument(
        "--recalculate-anchors-report",
        type=Path,
        help=(
            "Use a previous rebuild JSON report to remap anchors from the "
            "pre-rebuild canvas into the rebuilt global component crop."
        ),
    )
    parser.add_argument(
        "--snap-distant-anchors",
        action="store_true",
        help=(
            "Move non-pivot weapon anchors at least ten pixels away from the "
            "sprite to their nearest visible grip pixel."
        ),
    )
    parser.add_argument(
        "--apply-curated-anchors",
        action="store_true",
        help=(
            "Apply the seven grip/fixation corrections found by visually "
            "reviewing the 48 final weapon anchors."
        ),
    )
    args = parser.parse_args()

    report: list[dict[str, object]] = []
    for sprite_type, path in iter_final_sprites():
        image, contaminants = inspect(path)
        if not contaminants:
            continue

        if args.apply:
            clear_components(image, contaminants)
            image.save(path, format="PNG", optimize=False)

        report.append(
            {
                "type": sprite_type,
                "file": path.relative_to(ROOT).as_posix(),
                "size": list(image.size),
                "removedComponents": [
                    {
                        "area": component.area,
                        "bbox": list(component.bbox),
                    }
                    for component in contaminants
                ],
            }
        )

    repair_report = (
        repair_clipped_weapons(args.apply)
        if args.repair_clipped
        else []
    )
    rebuild_report = (
        rebuild_all_from_atlases(args.apply)
        if args.rebuild_from_atlases
        else []
    )
    anchor_report = (
        recalculate_anchors_from_report(
            args.recalculate_anchors_report,
            args.apply,
        )
        if args.recalculate_anchors_report
        else []
    )
    snap_report = (
        snap_distant_weapon_anchors(args.apply)
        if args.snap_distant_anchors
        else []
    )
    curated_report = (
        apply_curated_weapon_anchors(args.apply)
        if args.apply_curated_anchors
        else []
    )
    print(
        json.dumps(
            {
                "mode": "apply" if args.apply else "dry-run",
                "files": len(report),
                "report": report,
                "repairedClippedWeapons": repair_report,
                "rebuiltFromAtlases": rebuild_report,
                "recalculatedAnchors": anchor_report,
                "snappedDistantAnchors": snap_report,
                "curatedAnchors": curated_report,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
