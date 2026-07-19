#!/usr/bin/env python3
"""Construit les neuf banques 2D des ennemis modernes et cyberpunk.

Les ``source-master.png`` sont les sorties ImageGen originales. Le détourage
part des bords du canevas afin de préserver les accents néon internes, puis
chaque pose est recomposée sans déformation dans une cellule 229 x 229.
Ce pipeline produit uniquement la banque latérale 2D : aucune direction FPS
supplémentaire n'est synthétisée.
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass
import json
import math
from pathlib import Path

from PIL import Image

from sprite_pipeline import (
    clean_pose_fragments,
    connected_pose_segments,
    infer_row_boundaries,
    select_evenly,
)


ROOT = Path(__file__).resolve().parents[1]
CHARACTERS = ROOT / "assets" / "modular" / "characters"
ANIMATIONS = ("idle", "move", "attack", "hurt", "death")
COLUMNS = 6
ROWS = 5
CELL = 229
MASTER_SIZE = (COLUMNS * CELL, ROWS * CELL)
MANUAL_SOURCE_SEGMENTS: dict[tuple[str, str], tuple[tuple[int, int], ...]] = {
    # ImageGen a livré cinq poses de chute très lisibles pour le Kannushi.
    # La dernière est tenue deux frames, comme une pose finale classique,
    # plutôt que de découper seulement la traîne dans une sixième cellule.
    ("new-cyber-yomi-hacker", "death"): (
        (48, 270),
        (274, 520),
        (510, 768),
        (744, 1030),
        (1004, 1360),
        (1004, 1360),
    ),
}


@dataclass(frozen=True)
class CharacterBuild:
    category: str
    character_id: str
    chroma: str

    @property
    def folder(self) -> Path:
        return CHARACTERS / self.category / self.character_id


BUILDS = (
    CharacterBuild("regular", "new-modern-commuter", "magenta"),
    CharacterBuild("special", "new-modern-riot-host", "magenta"),
    CharacterBuild("special", "new-modern-response-officer", "magenta"),
    CharacterBuild("boss", "new-modern-metro-colossus", "green-strict"),
    CharacterBuild("regular", "new-cyber-neon-shinobi", "green"),
    CharacterBuild("special", "new-cyber-drone-corpse", "green"),
    CharacterBuild("special", "new-cyber-oni-frame", "green"),
    CharacterBuild("miniboss", "new-cyber-yomi-hacker", "green-strict"),
    CharacterBuild("boss", "new-cyber-shogun-zero", "green-strict"),
)


def boundaries(length: int, count: int) -> list[int]:
    return [round(index * length / count) for index in range(count + 1)]


def chroma_candidate(pixel: tuple[int, int, int, int], chroma: str) -> bool:
    red, green, blue, alpha = pixel
    if alpha == 0:
        return True
    if chroma == "magenta":
        return (
            red >= 150
            and blue >= 145
            and green <= 145
            and min(red, blue) - green >= 42
            and abs(red - blue) <= 100
        )
    return (
        green >= 135
        and green - red >= 52
        and green - blue >= 42
    )


def border_chroma_to_alpha(source: Image.Image, chroma: str) -> Image.Image:
    """Supprime seulement le chroma relié au bord du master.

    Un tube vert ou un marquage magenta entouré par l'encrage du personnage
    n'est donc pas confondu avec le fond, même s'il partage sa teinte.
    """

    image = source.convert("RGBA")
    width, height = image.size
    pixels = image.load()
    visited = bytearray(width * height)
    transparent = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def visit(x: int, y: int) -> None:
        index = y * width + x
        if visited[index]:
            return
        visited[index] = 1
        if chroma_candidate(pixels[x, y], chroma):
            transparent[index] = 1
            queue.append((x, y))

    for x in range(width):
        visit(x, 0)
        visit(x, height - 1)
    for y in range(height):
        visit(0, y)
        visit(width - 1, y)

    while queue:
        x, y = queue.popleft()
        if x > 0:
            visit(x - 1, y)
        if x + 1 < width:
            visit(x + 1, y)
        if y > 0:
            visit(x, y - 1)
        if y + 1 < height:
            visit(x, y + 1)

    raw = bytearray(image.tobytes())
    for index, is_transparent in enumerate(transparent):
        offset = index * 4
        if is_transparent:
            raw[offset:offset + 4] = b"\x00\x00\x00\x00"
        else:
            raw[offset + 3] = 255
    return Image.frombytes("RGBA", image.size, bytes(raw))


def remove_green_edge_spill(image: Image.Image) -> Image.Image:
    """Retire le dernier pixel vert de chroma au contact de la transparence."""

    result = image.copy()
    pixels = result.load()
    alpha = result.getchannel("A")
    alpha_pixels = alpha.load()
    width, height = result.size
    remove: list[tuple[int, int]] = []
    for y in range(1, height - 1):
        for x in range(1, width - 1):
            if alpha_pixels[x, y] == 0:
                continue
            if not (
                alpha_pixels[x - 1, y] == 0
                or alpha_pixels[x + 1, y] == 0
                or alpha_pixels[x, y - 1] == 0
                or alpha_pixels[x, y + 1] == 0
            ):
                continue
            red, green, blue, _ = pixels[x, y]
            if green >= 68 and green - red >= 24 and green - blue >= 18:
                remove.append((x, y))
    for x, y in remove:
        pixels[x, y] = (0, 0, 0, 0)
    return result


def remove_all_green_chroma(image: Image.Image) -> Image.Image:
    """Supprime aussi le chroma enfermé dans les silhouettes creuses.

    Les trois boss de fin de jeu ont été explicitement générés sans vert dans
    leur palette. Le fond reste parfois visible au travers d'un câble ou d'une
    armure ajourée sans être relié au bord : ce mode strict retire ces îlots
    afin qu'aucun rectangle vert ne survive dans la banque de jeu.
    """

    result = image.copy()
    pixels = result.load()
    for y in range(result.height):
        for x in range(result.width):
            red, green, blue, alpha = pixels[x, y]
            if (
                alpha
                and green >= 80
                and green - red >= 35
                and green - blue >= 18
            ):
                pixels[x, y] = (0, 0, 0, 0)
    return result


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    return image.getchannel("A").getbbox()


def quantize_rgba(image: Image.Image, colors: int = 128) -> Image.Image:
    """Réduit le bruit colorimétrique ImageGen sans lisser les pixels."""

    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    rgb = rgba.convert("RGB").quantize(
        colors=colors,
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    ).convert("RGB")
    result = rgb.convert("RGBA")
    result.putalpha(alpha)
    return result


def save_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True)


def normalize_pose(cell: Image.Image) -> Image.Image:
    box = alpha_bbox(cell)
    if box is None:
        raise ValueError("cellule ImageGen vide après détourage")
    pose = cell.crop(box)
    scale = min(
        (CELL * 0.88) / max(1, pose.width),
        (CELL * 0.88) / max(1, pose.height),
    )
    width = max(1, math.floor(pose.width * scale))
    height = max(1, math.floor(pose.height * scale))
    pose = pose.resize((width, height), Image.Resampling.NEAREST)
    alpha = pose.getchannel("A").point(lambda value: 255 if value else 0)
    pose.putalpha(alpha)
    resized_box = alpha_bbox(pose)
    if resized_box is None:
        raise ValueError("pose vide après redimensionnement")
    pose = pose.crop(resized_box)
    width, height = pose.size

    normalized = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    x = (CELL - width) // 2
    y = CELL - height
    normalized.alpha_composite(pose, (x, y))
    return normalized


def assert_binary_grounded(image: Image.Image, label: str) -> None:
    alpha = image.getchannel("A")
    values = set(alpha.get_flattened_data())
    if not values.issubset({0, 255}):
        raise ValueError(f"{label}: alpha non binaire")
    box = alpha.getbbox()
    if box is None:
        raise ValueError(f"{label}: frame vide")
    if box[3] != CELL:
        raise ValueError(f"{label}: silhouette flottante, bas alpha={box[3]}")


def build_character(spec: CharacterBuild) -> dict[str, object]:
    folder = spec.folder
    source_path = folder / "source-master.png"
    if not source_path.exists():
        raise FileNotFoundError(source_path)
    sprite_path = folder / "sprite.json"
    previous_sprite: dict[str, object] = {}
    if sprite_path.exists():
        previous_sprite = json.loads(sprite_path.read_text(encoding="utf-8"))
    source = Image.open(source_path).convert("RGBA")
    alpha_master = border_chroma_to_alpha(source, spec.chroma)
    if spec.chroma.startswith("green"):
        alpha_master = remove_green_edge_spill(alpha_master)
    if spec.chroma == "green-strict":
        alpha_master = remove_all_green_chroma(alpha_master)
    alpha_master = quantize_rgba(alpha_master)
    save_png(alpha_master, folder / "master-alpha.png")

    source_y = infer_row_boundaries(alpha_master, ROWS)
    master = Image.new("RGBA", MASTER_SIZE, (0, 0, 0, 0))
    frame_records: dict[str, list[dict[str, object]]] = {}
    normalization = []

    for row, animation in enumerate(ANIMATIONS):
        source_band = alpha_master.crop(
            (0, source_y[row], alpha_master.width, source_y[row + 1])
        )
        manual_segments = MANUAL_SOURCE_SEGMENTS.get(
            (spec.character_id, animation),
        )
        if manual_segments:
            detected_segments = list(manual_segments)
            selected_segments = list(manual_segments)
            detection_mode = "authored-hold-frame"
        else:
            detected_segments = connected_pose_segments(source_band)
            detection_mode = "connected-components"
            if len(detected_segments) < COLUMNS:
                fallback_x = boundaries(alpha_master.width, COLUMNS)
                detected_segments = list(zip(fallback_x[:-1], fallback_x[1:]))
                detection_mode = "declared-grid-fallback"
            selected_segments = select_evenly(detected_segments, COLUMNS)
        normalization.append(
            {
                "row": animation,
                "sourceBand": [source_y[row], source_y[row + 1]],
                "detectedRows": ROWS,
                "detected": len(detected_segments),
                "detectionMode": detection_mode,
                "boundaryScore": 0.0,
                "selected": len(selected_segments),
            }
        )
        frame_records[animation] = []
        for column, (source_x0, source_x1) in enumerate(selected_segments):
            source_cell = source_band.crop(
                (source_x0, 0, source_x1, source_band.height)
            )
            source_cell = clean_pose_fragments(source_cell)
            frame = normalize_pose(source_cell)
            assert_binary_grounded(frame, f"{spec.character_id}/{animation}/{column}")
            x = column * CELL
            y = row * CELL
            master.alpha_composite(frame, (x, y))
            frame_path = folder / "frames" / animation / f"{column:02d}.png"
            save_png(frame, frame_path)
            frame_records[animation].append(
                {
                    "index": column,
                    "file": frame_path.relative_to(folder).as_posix(),
                    "rect": [x, y, CELL, CELL],
                    "nonEmpty": True,
                }
            )

        sheet = master.crop((0, row * CELL, MASTER_SIZE[0], (row + 1) * CELL))
        save_png(sheet, folder / "sheets" / f"{animation}.png")

    save_png(master, folder / "master.png")
    sprite = {
        "schema": 2,
        "master": "master.png",
        "frameWidth": CELL,
        "frameHeight": CELL,
        "grid": {"columns": COLUMNS, "rows": ROWS},
        "source": {
            "file": "source-master.png",
            "alphaMaster": "master-alpha.png",
            "generationTool": "OpenAI ImageGen built-in",
            "sourceChroma": "#ff00ff" if spec.chroma == "magenta" else "#00ff00",
        },
        "animationContract": {
            "rows": list(ANIMATIONS),
            "framesPerAnimation": COLUMNS,
            "frameOrder": "left-to-right",
            "facing": "left",
            "view": "2d-lateral-only",
            "fpsEightWay": False,
            "weaponsBakedIntoBody": False,
        },
        "groundAnchor": {
            "normalized": [0.5, 1.0],
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
        "weaponsBakedIntoBody": False,
        "viewCoverage": {
            "mode": "2d-lateral-only",
            "directions": ["left"],
            "fpsEightWay": False,
        },
    }
    # Les pipelines de rigs et de directions enrichissent ce contrat après la
    # construction 2D. Une reconstruction artistique ne doit jamais effacer
    # ces métadonnées vérifiées.
    for preserved_key in ("weaponRig", "fpsDirections", "fpsWeaponRig"):
        if preserved_key in previous_sprite:
            sprite[preserved_key] = previous_sprite[preserved_key]
    sprite_path.write_text(
        json.dumps(sprite, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return {
        "id": spec.character_id,
        "category": spec.category,
        "sourceSize": list(source.size),
        "masterSize": list(master.size),
        "animations": len(frame_records),
        "frames": sum(len(frames) for frames in frame_records.values()),
        "alphaMode": "binary",
        "viewCoverage": "2d-lateral-only",
    }


def main() -> int:
    report = [build_character(spec) for spec in BUILDS]
    print(json.dumps({"characters": report, "errors": []}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
