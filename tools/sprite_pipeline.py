"""Découpe et valide les sprites modulaires de Yomi no Kage."""

from __future__ import annotations

import argparse
from collections import deque
import json
import math
from pathlib import Path
from typing import Iterable

from PIL import Image


ANIMATIONS = ("idle", "move", "attack", "hurt", "death")
GROUND_BASELINE = 1.0


def boundaries(length: int, count: int) -> list[int]:
    """Retourne des limites entières couvrant exactement toute la dimension."""
    return [round(index * length / count) for index in range(count + 1)]


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    return image.getchannel("A").getbbox()


def validate_rgba(image: Image.Image, source: Path) -> None:
    if image.mode != "RGBA":
        raise ValueError(f"{source}: mode {image.mode}, RGBA requis")
    width, height = image.size
    alpha = image.getchannel("A")
    corners = (
        alpha.getpixel((0, 0)),
        alpha.getpixel((width - 1, 0)),
        alpha.getpixel((0, height - 1)),
        alpha.getpixel((width - 1, height - 1)),
    )
    if any(corners):
        raise ValueError(f"{source}: les quatre coins doivent être transparents")
    if alpha_bbox(image) is None:
        raise ValueError(f"{source}: aucun sujet opaque détecté")


def count_chroma_fringe(image: Image.Image) -> int:
    """Compte les pixels magenta résiduels encore visibles après détourage."""
    get_values = getattr(image, "get_flattened_data", image.getdata)
    return sum(
        1
        for red, green, blue, alpha in get_values()
        if alpha > 0 and red >= 205 and green <= 85 and blue >= 170
    )


def save_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True)


def active_segments(
    image: Image.Image,
    minimum_width: int,
    alpha_threshold: int = 24,
) -> list[tuple[int, int]]:
    """Détecte les silhouettes séparées horizontalement dans une bande."""
    alpha = image.getchannel("A")
    columns = []
    for x in range(image.width):
        active_pixels = sum(
            1 for y in range(image.height) if alpha.getpixel((x, y)) > alpha_threshold
        )
        columns.append(active_pixels >= 2)

    segments: list[tuple[int, int]] = []
    start: int | None = None
    empty_run = 0
    gap_tolerance = max(2, round(image.width / 500))
    for x, active in enumerate(columns):
        if active:
            if start is None:
                start = x
            empty_run = 0
        elif start is not None:
            empty_run += 1
            if empty_run > gap_tolerance:
                end = x - empty_run + 1
                if end - start >= minimum_width:
                    segments.append((start, end))
                start = None
                empty_run = 0
    if start is not None:
        end = image.width
        if end - start >= minimum_width:
            segments.append((start, end))
    return segments


def active_row_segments(
    image: Image.Image,
    minimum_height: int,
    alpha_threshold: int = 24,
) -> list[tuple[int, int]]:
    """Détecte les bandes d’animation séparées verticalement."""
    alpha = image.getchannel("A")
    rows = []
    for y in range(image.height):
        active_pixels = sum(
            1 for x in range(image.width) if alpha.getpixel((x, y)) > alpha_threshold
        )
        rows.append(active_pixels >= 3)

    segments: list[tuple[int, int]] = []
    start: int | None = None
    empty_run = 0
    gap_tolerance = max(2, round(image.height / 350))
    for y, active in enumerate(rows):
        if active:
            if start is None:
                start = y
            empty_run = 0
        elif start is not None:
            empty_run += 1
            if empty_run > gap_tolerance:
                end = y - empty_run + 1
                if end - start >= minimum_height:
                    segments.append((start, end))
                start = None
                empty_run = 0
    if start is not None:
        end = image.height
        if end - start >= minimum_height:
            segments.append((start, end))
    return segments


def infer_row_boundaries(
    image: Image.Image,
    rows: int,
    alpha_threshold: int = 24,
) -> list[int]:
    """Place les séparations dans les gouttières proches d’une grille régulière."""
    alpha = image.getchannel("A")
    row_ink = [
        sum(1 for x in range(image.width) if alpha.getpixel((x, y)) > alpha_threshold)
        for y in range(image.height)
    ]
    nominal_height = image.height / rows
    result = [0]
    smoothing = max(1, round(image.height / 500))
    for index in range(1, rows):
        expected = round(index * nominal_height)
        radius = round(nominal_height * 0.36)
        start = max(result[-1] + 1, expected - radius)
        end = min(image.height - 1, expected + radius)
        candidates = []
        for y in range(start, end + 1):
            score = sum(
                row_ink[sample]
                for sample in range(
                    max(0, y - smoothing),
                    min(image.height, y + smoothing + 1),
                )
            )
            candidates.append((score, abs(y - expected), y))
        result.append(min(candidates)[2] if candidates else expected)
    result.append(image.height)
    return result


def select_evenly(items: list[tuple[int, int]], count: int) -> list[tuple[int, int]]:
    if not items:
        return []
    if len(items) == count:
        return items
    if len(items) > count:
        return [items[round(i * (len(items) - 1) / (count - 1))] for i in range(count)]
    return [items[round(i * (len(items) - 1) / (count - 1))] for i in range(count)]


def infer_equal_columns(
    band: Image.Image,
    minimum: int = 6,
    maximum: int = 10,
    alpha_threshold: int = 24,
) -> tuple[int, float]:
    """Infère une grille régulière en cherchant les séparations les plus vides."""
    alpha = band.getchannel("A")
    best_count = minimum
    best_score = float("inf")
    window = max(1, round(band.width / 700))
    for count in range(minimum, maximum + 1):
        bounds = boundaries(band.width, count)
        ink = 0
        samples = 0
        for boundary in bounds[1:-1]:
            for x in range(max(0, boundary - window), min(band.width, boundary + window + 1)):
                ink += sum(
                    1
                    for y in range(band.height)
                    if alpha.getpixel((x, y)) > alpha_threshold
                )
                samples += band.height
        score = ink / max(1, samples)
        if (score, count) < (best_score, best_count):
            best_count = count
            best_score = score
    return best_count, best_score


def connected_pose_segments(
    band: Image.Image,
    alpha_threshold: int = 24,
) -> list[tuple[int, int]]:
    """Repère les corps par composantes connexes, même si leurs projections X se touchent."""
    scale = 2 if band.width >= 900 else 1
    width = max(1, band.width // scale)
    height = max(1, band.height // scale)
    alpha = band.getchannel("A").resize((width, height), Image.Resampling.NEAREST)
    pixels = bytearray(1 if value > alpha_threshold else 0 for value in alpha.tobytes())
    components: list[dict] = []

    for start in range(width * height):
        if not pixels[start]:
            continue
        pixels[start] = 0
        queue = deque([start])
        area = 0
        min_x = max_x = start % width
        min_y = max_y = start // width
        while queue:
            index = queue.popleft()
            x = index % width
            y = index // width
            area += 1
            min_x = min(min_x, x)
            max_x = max(max_x, x)
            min_y = min(min_y, y)
            max_y = max(max_y, y)
            for neighbor_y in range(max(0, y - 1), min(height, y + 2)):
                row_offset = neighbor_y * width
                for neighbor_x in range(max(0, x - 1), min(width, x + 2)):
                    neighbor = row_offset + neighbor_x
                    if pixels[neighbor]:
                        pixels[neighbor] = 0
                        queue.append(neighbor)
        if area >= 12:
            components.append(
                {
                    "area": area,
                    "center": (min_x + max_x) / 2,
                    "bbox": (min_x, min_y, max_x + 1, max_y + 1),
                }
            )

    if not components:
        return []
    largest_area = max(component["area"] for component in components)
    primary = [
        component
        for component in components
        if component["area"] >= max(20, largest_area * 0.18)
    ]
    if len(primary) > 10:
        primary = sorted(primary, key=lambda item: item["area"], reverse=True)[:10]
    primary.sort(key=lambda item: item["center"])
    if primary:
        widths = sorted(item["bbox"][2] - item["bbox"][0] for item in primary)
        areas = sorted(item["area"] for item in primary)
        median_width = widths[len(widths) // 2]
        median_area = areas[len(areas) // 2]
        expanded = []
        for component in primary:
            left, top, right, bottom = component["bbox"]
            component_width = right - left
            split_count = 1
            if (
                component_width > median_width * 1.55
                and component["area"] > median_area * 1.55
                and len(primary) < 10
            ):
                split_count = min(3, max(2, round(component_width / median_width)))
            for split_index in range(split_count):
                split_left = round(left + component_width * split_index / split_count)
                split_right = round(left + component_width * (split_index + 1) / split_count)
                expanded.append(
                    {
                        "area": component["area"] / split_count,
                        "center": (split_left + split_right) / 2,
                        "bbox": (split_left, top, split_right, bottom),
                    }
                )
        primary = sorted(expanded, key=lambda item: item["center"])
    if not 6 <= len(primary) <= 10:
        return []

    padding = max(4, round(band.width / 190))
    return [
        (
            max(0, component["bbox"][0] * scale - padding),
            min(band.width, component["bbox"][2] * scale + padding),
        )
        for component in primary
    ]


def clean_pose_fragments(
    image: Image.Image,
    alpha_threshold: int = 12,
) -> Image.Image:
    """Conserve le corps dominant et ses petits détails, supprime les voisins coupés."""
    width, height = image.size
    original_alpha = image.getchannel("A").tobytes()
    active = bytearray(1 if value > alpha_threshold else 0 for value in original_alpha)
    components = []
    for start in range(width * height):
        if not active[start]:
            continue
        active[start] = 0
        queue = deque([start])
        indices = []
        min_x = max_x = start % width
        min_y = max_y = start // width
        while queue:
            index = queue.popleft()
            indices.append(index)
            x = index % width
            y = index // width
            min_x = min(min_x, x)
            max_x = max(max_x, x)
            min_y = min(min_y, y)
            max_y = max(max_y, y)
            for neighbor_y in range(max(0, y - 1), min(height, y + 2)):
                offset = neighbor_y * width
                for neighbor_x in range(max(0, x - 1), min(width, x + 2)):
                    neighbor = offset + neighbor_x
                    if active[neighbor]:
                        active[neighbor] = 0
                        queue.append(neighbor)
        components.append(
            {
                "indices": indices,
                "area": len(indices),
                "bbox": (min_x, min_y, max_x + 1, max_y + 1),
            }
        )
    if not components:
        return image

    dominant = max(components, key=lambda item: item["area"])
    # Les sprites demandés n'ont aucun objet détachable fusionné : la plus
    # grande composante est donc le personnage. Les autres composantes sont
    # presque toujours des fragments du voisin provoqués par une grille IA
    # trop serrée.
    kept = dominant["indices"]

    cleaned_alpha = bytearray(len(original_alpha))
    for index in kept:
        cleaned_alpha[index] = original_alpha[index]
    cleaned = image.copy()
    cleaned.putalpha(Image.frombytes("L", image.size, bytes(cleaned_alpha)))
    return cleaned


def normalize_character_grid(
    master: Image.Image,
    columns: int,
    rows: int,
) -> tuple[Image.Image, list[dict]]:
    """Recompose une grille exacte à partir de bandes comportant 6 à 8 poses."""
    x_bounds = boundaries(master.width, columns)
    y_bounds = boundaries(master.height, rows)
    normalized = Image.new("RGBA", master.size, (0, 0, 0, 0))
    diagnostics = []
    source_y_bounds = infer_row_boundaries(master, rows)
    selected_rows = list(zip(source_y_bounds[:-1], source_y_bounds[1:]))

    for row in range(rows):
        y0, y1 = y_bounds[row], y_bounds[row + 1]
        if row < len(selected_rows):
            source_y0, source_y1 = selected_rows[row]
        else:
            source_y0, source_y1 = y0, y1
        band = master.crop((0, source_y0, master.width, source_y1))
        detected = connected_pose_segments(band)
        detection_mode = "connected-components"
        if detected:
            source_columns = len(detected)
            boundary_score = 0.0
        else:
            source_columns, boundary_score = infer_equal_columns(band)
            inferred_bounds = boundaries(master.width, source_columns)
            detected = list(zip(inferred_bounds[:-1], inferred_bounds[1:]))
            detection_mode = "equal-grid-fallback"
        selected = select_evenly(detected, columns)
        diagnostics.append(
            {
                "row": ANIMATIONS[row] if row < len(ANIMATIONS) else row,
                "sourceBand": [source_y0, source_y1],
                "detectedRows": len(selected_rows),
                "detected": len(detected),
                "detectionMode": detection_mode,
                "boundaryScore": round(boundary_score, 6),
                "selected": len(selected),
            }
        )
        if not selected:
            continue

        for column, (source_x0, source_x1) in enumerate(selected):
            pose = band.crop((source_x0, 0, source_x1, band.height))
            pose = clean_pose_fragments(pose)
            box = alpha_bbox(pose)
            if box is None:
                continue
            pose = pose.crop(box)
            cell_x0, cell_x1 = x_bounds[column], x_bounds[column + 1]
            cell_width = cell_x1 - cell_x0
            cell_height = y1 - y0
            scale = min(
                (cell_width * 0.88) / max(1, pose.width),
                (cell_height * 0.88) / max(1, pose.height),
            )
            target_width = max(1, math.floor(pose.width * scale))
            target_height = max(1, math.floor(pose.height * scale))
            if (target_width, target_height) != pose.size:
                pose = pose.resize((target_width, target_height), Image.Resampling.NEAREST)
            target_x = cell_x0 + (cell_width - target_width) // 2
            # Les personnages sont rendus avec le bas de leur cellule posé sur
            # le plancher du monde. Toute marge transparente sous les pieds se
            # transforme donc directement en flottement à l'écran. Aligner la
            # silhouette sur la baseline inférieure garde le pivot stable pour
            # toutes les poses, y compris les animations de chute.
            target_y = y0 + max(
                0,
                round(cell_height * GROUND_BASELINE) - target_height,
            )
            normalized.alpha_composite(pose, (target_x, target_y))

    return normalized, diagnostics


def split_character(source: Path, output: Path, columns: int = 6) -> dict:
    master = Image.open(source).convert("RGBA")
    validate_rgba(master, source)
    master, normalization = normalize_character_grid(
        master,
        columns=columns,
        rows=len(ANIMATIONS),
    )
    validate_rgba(master, source)
    x_bounds = boundaries(master.width, columns)
    y_bounds = boundaries(master.height, len(ANIMATIONS))
    frame_records: dict[str, list[dict]] = {}

    save_png(master, output / "master.png")

    for row, animation in enumerate(ANIMATIONS):
        y0, y1 = y_bounds[row], y_bounds[row + 1]
        sheet = master.crop((0, y0, master.width, y1))
        save_png(sheet, output / "sheets" / f"{animation}.png")
        frame_records[animation] = []

        for column in range(columns):
            x0, x1 = x_bounds[column], x_bounds[column + 1]
            frame = master.crop((x0, y0, x1, y1))
            frame_path = output / "frames" / animation / f"{column:02d}.png"
            save_png(frame, frame_path)
            frame_records[animation].append(
                {
                    "index": column,
                    "file": frame_path.relative_to(output).as_posix(),
                    "rect": [x0, y0, x1 - x0, y1 - y0],
                    "nonEmpty": alpha_bbox(frame) is not None,
                }
            )

    record = {
        "schema": 1,
        "master": "master.png",
        "grid": {"columns": columns, "rows": len(ANIMATIONS)},
        "groundAnchor": {
            "normalized": [0.5, GROUND_BASELINE],
            "baseline": "bottom-edge",
            "transparentPaddingBelowFeet": 0,
        },
        "normalization": normalization,
        "animations": frame_records,
        "weaponMount": {
            "normalized": True,
            "idle": [0.62, 0.55],
            "move": [0.62, 0.55],
            "attack": [0.66, 0.50],
            "hurt": [0.58, 0.56],
            "death": [0.60, 0.66],
        },
    }
    (output / "sprite.json").write_text(
        json.dumps(record, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return record


def trim_transparent(image: Image.Image, padding: int) -> Image.Image:
    box = alpha_bbox(image)
    if box is None:
        return image
    left = max(0, box[0] - padding)
    top = max(0, box[1] - padding)
    right = min(image.width, box[2] + padding)
    bottom = min(image.height, box[3] + padding)
    return image.crop((left, top, right, bottom))


def split_grid(
    source: Path,
    output: Path,
    columns: int,
    rows: int,
    names: Iterable[str],
    padding: int,
) -> dict:
    atlas = Image.open(source).convert("RGBA")
    validate_rgba(atlas, source)
    names_list = list(names)
    expected = columns * rows
    if len(names_list) != expected:
        raise ValueError(f"{len(names_list)} noms fournis, {expected} requis")

    x_bounds = boundaries(atlas.width, columns)
    y_bounds = boundaries(atlas.height, rows)
    records = []
    for index, name in enumerate(names_list):
        row, column = divmod(index, columns)
        cell = atlas.crop(
            (
                x_bounds[column],
                y_bounds[row],
                x_bounds[column + 1],
                y_bounds[row + 1],
            )
        )
        sprite = trim_transparent(cell, padding)
        path = output / f"{name}.png"
        save_png(sprite, path)
        records.append(
            {
                "id": name,
                "file": path.name,
                "sourceCell": [column, row],
                "size": list(sprite.size),
                "nonEmpty": alpha_bbox(sprite) is not None,
            }
        )

    manifest = {
        "schema": 1,
        "source": source.as_posix(),
        "grid": {"columns": columns, "rows": rows},
        "sprites": records,
    }
    (output / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return manifest


def validate_tree(root: Path) -> dict:
    pngs = sorted(root.rglob("*.png"))
    jsons = sorted(root.rglob("*.json"))
    errors = []
    for path in pngs:
        try:
            image = Image.open(path)
            if "source" not in path.parts and image.mode == "RGBA":
                validate_rgba(image, path)
                is_final_character = (
                    "characters" in path.parts
                    and (
                        path.name == "master.png"
                        or "sheets" in path.parts
                        or "frames" in path.parts
                    )
                )
                if is_final_character:
                    fringe = count_chroma_fringe(image)
                    if fringe:
                        errors.append(
                            f"{path}: {fringe} pixel(s) de liseré magenta visible"
                        )
        except Exception as error:  # noqa: BLE001 - rapport de validation global
            errors.append(str(error))
    for path in jsons:
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except Exception as error:  # noqa: BLE001
            errors.append(f"{path}: {error}")
    return {"png": len(pngs), "json": len(jsons), "errors": errors}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)

    character = subparsers.add_parser("character")
    character.add_argument("--input", type=Path, required=True)
    character.add_argument("--out", type=Path, required=True)
    character.add_argument("--columns", type=int, default=6)

    grid = subparsers.add_parser("grid")
    grid.add_argument("--input", type=Path, required=True)
    grid.add_argument("--out", type=Path, required=True)
    grid.add_argument("--columns", type=int, required=True)
    grid.add_argument("--rows", type=int, required=True)
    grid.add_argument("--names", type=Path, required=True)
    grid.add_argument("--padding", type=int, default=4)

    validate = subparsers.add_parser("validate")
    validate.add_argument("--root", type=Path, required=True)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.command == "character":
        result = split_character(args.input, args.out, args.columns)
    elif args.command == "grid":
        names = json.loads(args.names.read_text(encoding="utf-8"))
        result = split_grid(
            args.input,
            args.out,
            args.columns,
            args.rows,
            names,
            args.padding,
        )
    else:
        result = validate_tree(args.root)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 1 if result.get("errors") else 0


if __name__ == "__main__":
    raise SystemExit(main())
