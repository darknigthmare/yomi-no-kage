#!/usr/bin/env python3
"""Build independent arsenal components and 2D depth portals from AI atlases.

The two source atlases are already transparent.  Generated sprites are cropped
to their principal connected alpha component, padded, and written as standalone
RGBA PNGs.  Flexible-weapon recipes deliberately reference one link sprite
repeated by the runtime; this pipeline never exports a pre-composed chain.
"""

from __future__ import annotations

import json
from collections import deque
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
TRANSPARENT = (0, 0, 0, 0)
ALPHA_THRESHOLD = 8
PADDING = 8

WEAPON_ATLAS = ROOT / "assets/modular/weapons/components/shinobi-components-atlas.png"
WEAPON_SOURCE = (
    ROOT
    / "assets/modular/weapons/components/sources/shinobi-components-imagegen-raw.png"
)
WEAPON_OUTPUT = ROOT / "assets/modular/weapons/components/shinobi"
WEAPON_MANIFEST = ROOT / "assets/modular/weapons/components/manifest.json"

PORTAL_ATLAS = (
    ROOT / "assets/modular/environments/depth-portals/depth-portals-atlas.png"
)
PORTAL_SOURCE = (
    ROOT
    / "assets/modular/environments/depth-portals/sources/depth-portals-imagegen-raw.png"
)
PORTAL_OUTPUT = ROOT / "assets/modular/environments/depth-portals/sprites"
PORTAL_MANIFEST = ROOT / "assets/modular/environments/depth-portals/manifest.json"

WEAPON_PROMPT = (
    "Create one original transparent 16-bit pixel-art atlas of modular shinobi "
    "weapon parts for a plague-horror action game set in fictional Kan'ei-era "
    "Japan, 1638. Strict 4 columns by 3 rows, one isolated component per cell, "
    "consistent steel, iron, dark wood and wrapped-grip palette, orthographic "
    "side view, crisp square pixels, no character, hand, scenery, shadow, text, "
    "logo or watermark. Reading order: ringed kunai, square hira-shuriken, "
    "bo-shuriken, cross hira-shuriken; nunchaku handle A, nunchaku handle B, "
    "small chain link, heavy chain link; kyoketsu-shoge hooked blade, terminal "
    "ring, kusarigama sickle, fundo weight. Every chain is represented by one "
    "single isolated link intended to be repeated, never by a complete chain."
)

PORTAL_PROMPT = (
    "Create one original transparent 16-bit pixel-art atlas of depth-transition "
    "portals for a side-view plague-horror game set in fictional Kan'ei-era "
    "Japan, 1638. Strict 4 columns by 2 rows, one complete frontal or slight "
    "three-quarter architectural entrance per cell, grounded on a shared "
    "baseline, crisp square pixels, coherent timber, tile, plaster and iron "
    "perspective, no people, enemies, labels, UI, text, logo or watermark. "
    "Reading order: narrow side alley, minka sliding entrance, machiya shop "
    "entrance with noren, kura storehouse gate; palisade breach, raised stair "
    "entrance, cellar trapdoor, inner-courtyard double gate. Openings must read "
    "as traversable paths into another street, room, floor, cellar or courtyard."
)


@dataclass(frozen=True)
class CellDefinition:
    asset_id: str
    name: str
    role: str
    anchor: tuple[float, float]
    description: str
    tags: tuple[str, ...] = ()


WEAPON_CELLS = (
    CellDefinition(
        "kunai-ring",
        "Kunai à anneau",
        "held-projectile",
        (0.78, 0.18),
        "Outil court utilisable en estoc ou comme projectile récupérable.",
        ("kunai", "throwing", "chain-end"),
    ),
    CellDefinition(
        "hira-shuriken-square",
        "Hira-shuriken carré",
        "projectile",
        (0.5, 0.5),
        "Étoile plate à quatre pointes, centrée pour une rotation stable.",
        ("shuriken", "throwing"),
    ),
    CellDefinition(
        "bo-shuriken",
        "Bō-shuriken",
        "projectile",
        (0.5, 0.5),
        "Pointe droite de jet, indépendante de la main et de son effet d'impact.",
        ("shuriken", "throwing"),
    ),
    CellDefinition(
        "hira-shuriken-cross",
        "Hira-shuriken cruciforme",
        "projectile",
        (0.5, 0.5),
        "Variante cruciforme à quatre pointes, sprite de projectile autonome.",
        ("shuriken", "throwing"),
    ),
    CellDefinition(
        "nunchaku-handle-a",
        "Poignée de nunchaku A",
        "flexible-end",
        (0.5, 0.08),
        "Première poignée d'un nunchaku rare de provenance ryūkyūane.",
        ("nunchaku", "ryukyu", "flexible"),
    ),
    CellDefinition(
        "nunchaku-handle-b",
        "Poignée de nunchaku B",
        "flexible-end",
        (0.5, 0.08),
        "Seconde poignée, distincte pour conserver une rotation indépendante.",
        ("nunchaku", "ryukyu", "flexible"),
    ),
    CellDefinition(
        "chain-link-small",
        "Maillon léger",
        "repeat-link",
        (0.5, 0.5),
        "Unique maillon léger répété le long d'une courbe dynamique.",
        ("chain", "repeatable", "flexible"),
    ),
    CellDefinition(
        "chain-link-heavy",
        "Maillon lourd",
        "repeat-link",
        (0.5, 0.5),
        "Unique maillon massif répété pour les armes lourdes et les boss.",
        ("chain", "repeatable", "boss"),
    ),
    CellDefinition(
        "kyoketsu-shoge-blade",
        "Lame de kyoketsu-shoge",
        "flexible-end",
        (0.78, 0.2),
        "Lame crochue détachée de son lien et de son anneau terminal.",
        ("kyoketsu-shoge", "hook", "flexible"),
    ),
    CellDefinition(
        "kyoketsu-terminal-ring",
        "Anneau terminal",
        "flexible-end",
        (0.5, 0.5),
        "Anneau terminal indépendant pour le kyoketsu-shoge.",
        ("kyoketsu-shoge", "ring", "flexible"),
    ),
    CellDefinition(
        "kusarigama-kama",
        "Kama de kusarigama",
        "held",
        (0.24, 0.84),
        "Faucille complète, séparée du maillon répétable et du poids.",
        ("kusarigama", "sickle", "flexible"),
    ),
    CellDefinition(
        "fundo-weight",
        "Poids fundo",
        "flexible-end",
        (0.5, 0.12),
        "Poids terminal réutilisable pour kusarigama et chaînes lestées.",
        ("fundo", "weight", "flexible"),
    ),
)


PORTAL_CELLS = (
    CellDefinition(
        "ruelle-laterale",
        "Ruelle latérale",
        "depth-portal",
        (0.5, 1.0),
        "Passage étroit vers une rue parallèle du même quartier.",
        ("street", "lateral-route", "outdoor"),
    ),
    CellDefinition(
        "porte-minka",
        "Entrée de minka",
        "depth-portal",
        (0.5, 1.0),
        "Porte coulissante menant à une habitation et ses pièces intérieures.",
        ("house", "interior", "room"),
    ),
    CellDefinition(
        "entree-machiya-noren",
        "Entrée de machiya",
        "depth-portal",
        (0.5, 1.0),
        "Échoppe urbaine reliant la rue à un commerce ou un atelier.",
        ("shop", "interior", "noren"),
    ),
    CellDefinition(
        "porte-kura",
        "Porte de kura",
        "depth-portal",
        (0.5, 1.0),
        "Double porte de magasin à riz menant à un entrepôt profond.",
        ("storehouse", "interior", "heavy-door"),
    ),
    CellDefinition(
        "breche-palissade",
        "Brèche de palissade",
        "depth-portal",
        (0.5, 1.0),
        "Ouverture vers une cour arrière, une venelle ou la périphérie.",
        ("breach", "outdoor", "alternate-route"),
    ),
    CellDefinition(
        "escalier-etage",
        "Entrée surélevée",
        "depth-portal",
        (0.5, 1.0),
        "Escalier architectural vers un étage cohérent ou une tour.",
        ("stairs", "upper-floor", "interior"),
    ),
    CellDefinition(
        "trappe-cave",
        "Trappe de cave",
        "depth-portal",
        (0.5, 1.0),
        "Accès descendant vers une cave, un tunnel ou un égout.",
        ("trapdoor", "basement", "underground"),
    ),
    CellDefinition(
        "porte-cour-interieure",
        "Porte de cour intérieure",
        "depth-portal",
        (0.5, 1.0),
        "Passage traversant vers une cour ou une autre rue du quartier.",
        ("courtyard", "street", "through-route"),
    ),
)


def web_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def boundaries(length: int, count: int) -> list[int]:
    return [round(index * length / count) for index in range(count + 1)]


def principal_component_mask(alpha: Image.Image) -> Image.Image:
    """Return a binary mask containing only the largest 4-connected component."""
    width, height = alpha.size
    pixels = alpha.load()
    visited = bytearray(width * height)
    components: list[list[int]] = []

    for start_y in range(height):
        for start_x in range(width):
            start_index = start_y * width + start_x
            if visited[start_index] or pixels[start_x, start_y] <= ALPHA_THRESHOLD:
                continue

            visited[start_index] = 1
            queue: deque[tuple[int, int]] = deque([(start_x, start_y)])
            component: list[int] = []
            while queue:
                x, y = queue.popleft()
                component.append(y * width + x)
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if nx < 0 or nx >= width or ny < 0 or ny >= height:
                        continue
                    index = ny * width + nx
                    if visited[index] or pixels[nx, ny] <= ALPHA_THRESHOLD:
                        continue
                    visited[index] = 1
                    queue.append((nx, ny))
            components.append(component)

    if not components:
        raise ValueError("cellule vide après analyse alpha")

    principal = max(components, key=len)
    mask = Image.new("L", alpha.size, 0)
    mask_pixels = mask.load()
    for index in principal:
        y, x = divmod(index, width)
        mask_pixels[x, y] = 255
    return mask


def isolate_and_pad(cell: Image.Image) -> tuple[Image.Image, tuple[int, int, int, int]]:
    cell = cell.convert("RGBA")
    mask = principal_component_mask(cell.getchannel("A"))
    source_pixels = cell.load()
    mask_pixels = mask.load()

    for y in range(cell.height):
        for x in range(cell.width):
            if not mask_pixels[x, y]:
                source_pixels[x, y] = TRANSPARENT

    bbox = cell.getchannel("A").getbbox()
    if not bbox:
        raise ValueError("cellule sans contenu alpha")

    cropped = cell.crop(bbox)
    clean_pixels = cropped.load()
    for y in range(cropped.height):
        for x in range(cropped.width):
            if clean_pixels[x, y][3] == 0:
                clean_pixels[x, y] = TRANSPARENT

    output = Image.new(
        "RGBA",
        (cropped.width + PADDING * 2, cropped.height + PADDING * 2),
        TRANSPARENT,
    )
    output.alpha_composite(cropped, (PADDING, PADDING))
    return output, bbox


def validate_output(path: Path) -> dict[str, Any]:
    with Image.open(path) as source:
        image = source.convert("RGBA")
    if source.mode != "RGBA":
        raise ValueError(f"{web_path(path)}: mode {source.mode}, RGBA attendu")
    bbox = image.getchannel("A").getbbox()
    if not bbox:
        raise ValueError(f"{web_path(path)}: sprite transparent vide")
    if image.width <= PADDING * 2 or image.height <= PADDING * 2:
        raise ValueError(f"{web_path(path)}: dimensions trop petites {image.size}")
    expected_bbox = (
        PADDING,
        PADDING,
        image.width - PADDING,
        image.height - PADDING,
    )
    if bbox != expected_bbox:
        raise ValueError(
            f"{web_path(path)}: marge alpha {bbox}, {expected_bbox} attendue"
        )
    corners = (
        image.getpixel((0, 0))[3],
        image.getpixel((image.width - 1, 0))[3],
        image.getpixel((0, image.height - 1))[3],
        image.getpixel((image.width - 1, image.height - 1))[3],
    )
    if any(corners):
        raise ValueError(f"{web_path(path)}: coin non transparent")
    return {
        "file": web_path(path),
        "size": [image.width, image.height],
        "alphaBounds": list(bbox),
        "mode": "RGBA",
        "nonEmpty": True,
        "transparentPadding": PADDING,
    }


def split_atlas(
    atlas_path: Path,
    output_dir: Path,
    columns: int,
    rows: int,
    definitions: tuple[CellDefinition, ...],
) -> list[dict[str, Any]]:
    if not atlas_path.exists():
        raise FileNotFoundError(atlas_path)
    if len(definitions) != columns * rows:
        raise ValueError(
            f"{atlas_path.name}: {len(definitions)} définitions pour "
            f"{columns * rows} cellules"
        )

    with Image.open(atlas_path) as source:
        if source.mode != "RGBA":
            raise ValueError(f"{atlas_path}: atlas RGBA attendu, reçu {source.mode}")
        atlas = source.copy()

    output_dir.mkdir(parents=True, exist_ok=True)
    x_bounds = boundaries(atlas.width, columns)
    y_bounds = boundaries(atlas.height, rows)
    records = []

    for index, definition in enumerate(definitions):
        row, column = divmod(index, columns)
        source_rect = (
            x_bounds[column],
            y_bounds[row],
            x_bounds[column + 1],
            y_bounds[row + 1],
        )
        cell = atlas.crop(source_rect)
        output, local_bbox = isolate_and_pad(cell)
        output_path = output_dir / f"{definition.asset_id}.png"
        output.save(output_path, optimize=True)
        validation = validate_output(output_path)
        records.append(
            {
                "id": definition.asset_id,
                "name": definition.name,
                "role": definition.role,
                "file": validation["file"],
                "sourceCell": [column, row],
                "sourceRect": list(source_rect),
                "sourceAlphaBounds": list(local_bbox),
                "size": validation["size"],
                "alphaBounds": validation["alphaBounds"],
                "anchor": list(definition.anchor),
                "description": definition.description,
                "tags": list(definition.tags),
                "alphaMode": "straight-transparent",
                "transparentPadding": PADDING,
            }
        )
    return records


def recipe_component(
    component_id: str,
    socket: str,
    *,
    instance_id: str | None = None,
) -> dict[str, Any]:
    component = {"componentId": component_id, "socket": socket}
    if instance_id:
        component["instanceId"] = instance_id
    return component


def chain_recipe(
    link_component: str,
    origin_socket: str,
    target_socket: str,
    *,
    minimum: int,
    maximum: int,
    segment_length: int,
) -> dict[str, Any]:
    return {
        "renderMode": "repeat-single-link",
        "linkComponentId": link_component,
        "wholeChainTexture": False,
        "originSocket": origin_socket,
        "targetSocket": target_socket,
        "minLinks": minimum,
        "maxLinks": maximum,
        "segmentLengthPx": segment_length,
        "rotateEachLink": True,
    }


def build_weapon_manifest(components: list[dict[str, Any]]) -> dict[str, Any]:
    provenance = {
        "provider": "OpenAI",
        "tool": "OpenAI ImageGen built-in",
        "sourceAsset": web_path(WEAPON_SOURCE),
        "processedAtlas": web_path(WEAPON_ATLAS),
        "sourceLayout": {"columns": 4, "rows": 3},
        "generationDate": "2026-07-18",
        "promptRecord": "reconstructed-from-generation-brief",
        "prompt": WEAPON_PROMPT,
    }
    recipes = [
        {
            "id": "kunai",
            "name": "Kunai",
            "family": "throwing",
            "historicity": "period-tool-adapted-for-combat",
            "components": [recipe_component("kunai-ring", "rightHand")],
            "projectileComponentId": "kunai-ring",
        },
        {
            "id": "bo-shuriken",
            "name": "Bō-shuriken",
            "family": "throwing",
            "historicity": "period-plausible",
            "components": [recipe_component("bo-shuriken", "projectileSpawn")],
            "projectileComponentId": "bo-shuriken",
        },
        {
            "id": "hira-shuriken-square",
            "name": "Hira-shuriken carré",
            "family": "throwing",
            "historicity": "specialist-weapon",
            "components": [
                recipe_component("hira-shuriken-square", "projectileSpawn")
            ],
            "projectileComponentId": "hira-shuriken-square",
        },
        {
            "id": "hira-shuriken-cross",
            "name": "Hira-shuriken cruciforme",
            "family": "throwing",
            "historicity": "specialist-weapon",
            "components": [
                recipe_component("hira-shuriken-cross", "projectileSpawn")
            ],
            "projectileComponentId": "hira-shuriken-cross",
        },
        {
            "id": "kusarigama-modular",
            "name": "Kusarigama modulaire",
            "family": "flexible",
            "historicity": "period-plausible",
            "components": [
                recipe_component("kusarigama-kama", "rightHand"),
                recipe_component("fundo-weight", "chainTarget"),
            ],
            "connector": chain_recipe(
                "chain-link-small",
                "kamaChainEye",
                "weightEye",
                minimum=8,
                maximum=28,
                segment_length=12,
            ),
        },
        {
            "id": "kusari-kunai",
            "name": "Kusari-kunai de quarantaine",
            "family": "flexible",
            "historicity": "fictional-period-field-modification",
            "components": [
                recipe_component("kunai-ring", "rightHand"),
                recipe_component("fundo-weight", "chainTarget"),
            ],
            "connector": chain_recipe(
                "chain-link-small",
                "kunaiRing",
                "weightEye",
                minimum=7,
                maximum=24,
                segment_length=12,
            ),
        },
        {
            "id": "kyoketsu-shoge-modular",
            "name": "Kyoketsu-shoge modulaire",
            "family": "flexible",
            "historicity": "specialist-weapon-chain-variant",
            "historicalNote": (
                "La version historique est souvent décrite avec une corde ; "
                "cette variante de quarantaine utilise le maillon léger."
            ),
            "components": [
                recipe_component("kyoketsu-shoge-blade", "rightHand"),
                recipe_component("kyoketsu-terminal-ring", "chainTarget"),
            ],
            "connector": chain_recipe(
                "chain-link-small",
                "bladeRing",
                "terminalRing",
                minimum=10,
                maximum=32,
                segment_length=12,
            ),
        },
        {
            "id": "nunchaku-ryukyu",
            "name": "Nunchaku de Ryūkyū",
            "family": "flexible-dual",
            "origin": "Ryukyu",
            "historicity": "rare-origin-disputed",
            "components": [
                recipe_component("nunchaku-handle-a", "rightHand"),
                recipe_component("nunchaku-handle-b", "chainTarget"),
            ],
            "connector": chain_recipe(
                "chain-link-small",
                "handleARing",
                "handleBRing",
                minimum=3,
                maximum=7,
                segment_length=11,
            ),
        },
        {
            "id": "manrikigusari-modular",
            "name": "Manrikigusari modulaire",
            "family": "flexible-dual",
            "historicity": "early-edo-specialist",
            "components": [
                recipe_component(
                    "fundo-weight",
                    "rightHand",
                    instance_id="fundo-left",
                ),
                recipe_component(
                    "fundo-weight",
                    "chainTarget",
                    instance_id="fundo-right",
                ),
            ],
            "connector": chain_recipe(
                "chain-link-small",
                "leftWeightEye",
                "rightWeightEye",
                minimum=10,
                maximum=30,
                segment_length=12,
            ),
        },
    ]
    return {
        "schema": 1,
        "category": "modular-weapon-components",
        "runtimePolicy": {
            "weaponsBakedIntoBodies": False,
            "wholeChainTexturesAllowed": False,
            "chainRendering": "repeat and rotate one declared link component",
        },
        "provenance": provenance,
        "componentCount": len(components),
        "components": components,
        "recipeCount": len(recipes),
        "weaponRecipes": recipes,
        "sharedFlexibleProfiles": [
            {
                "id": "light-chain",
                "linkComponentId": "chain-link-small",
                "wholeChainTexture": False,
                "uses": [
                    "kusarigama",
                    "kusari-kunai",
                    "kyoketsu-shoge",
                    "nunchaku",
                    "manrikigusari",
                ],
            },
            {
                "id": "heavy-chain",
                "linkComponentId": "chain-link-heavy",
                "wholeChainTexture": False,
                "uses": [
                    "fleau-cloche-enjin",
                    "chaines-menottes-nuno",
                    "encensoir-spores-kinoko",
                ],
            },
        ],
    }


def build_portal_manifest(portals: list[dict[str, Any]]) -> dict[str, Any]:
    transitions = {
        "ruelle-laterale": ("street-depth", "adjacent-street"),
        "porte-minka": ("interior", "minka-room"),
        "entree-machiya-noren": ("interior", "shop-workshop"),
        "porte-kura": ("interior", "storehouse"),
        "breche-palissade": ("street-depth", "rear-lane"),
        "escalier-etage": ("vertical-coherent", "upper-floor"),
        "trappe-cave": ("vertical-coherent", "basement"),
        "porte-cour-interieure": ("street-depth", "inner-courtyard"),
    }
    records = []
    for portal in portals:
        transition_kind, destination = transitions[portal["id"]]
        records.append(
            {
                **portal,
                "collision": "portal",
                "renderLayer": "world",
                "interaction": {
                    "requiresExplicitAction": True,
                    "action": "interact",
                    "automaticEntry": False,
                },
                "transition": {
                    "kind": transition_kind,
                    "destinationArchetype": destination,
                    "supportsReturnPortal": True,
                },
                "perspective": "front-facing-depth-cue",
                "groundAnchor": [0.5, 1.0],
            }
        )
    return {
        "schema": 1,
        "category": "depth-portals",
        "designPolicy": {
            "purpose": (
                "Simuler la profondeur d'une ville 2D par des rues, pièces, "
                "cours, étages et caves réellement reliés."
            ),
            "mostlyHorizontalProgression": True,
            "verticalTransitionsOnlyWhenArchitecturallyCoherent": True,
            "requiresExplicitInteraction": True,
        },
        "provenance": {
            "provider": "OpenAI",
            "tool": "OpenAI ImageGen built-in",
            "sourceAsset": web_path(PORTAL_SOURCE),
            "processedAtlas": web_path(PORTAL_ATLAS),
            "sourceLayout": {"columns": 4, "rows": 2},
            "generationDate": "2026-07-18",
            "promptRecord": "reconstructed-from-generation-brief",
            "prompt": PORTAL_PROMPT,
        },
        "count": len(records),
        "entries": records,
    }


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def validate_manifest_references(manifest: dict[str, Any]) -> list[str]:
    errors = []

    def visit(value: Any) -> None:
        if isinstance(value, list):
            for item in value:
                visit(item)
            return
        if not isinstance(value, dict):
            return
        file = value.get("file")
        if isinstance(file, str):
            path = ROOT.joinpath(*file.split("/"))
            if not path.exists():
                errors.append(f"fichier absent: {file}")
        for child in value.values():
            visit(child)

    visit(manifest)
    return errors


def main() -> int:
    weapon_components = split_atlas(
        WEAPON_ATLAS,
        WEAPON_OUTPUT,
        4,
        3,
        WEAPON_CELLS,
    )
    portals = split_atlas(
        PORTAL_ATLAS,
        PORTAL_OUTPUT,
        4,
        2,
        PORTAL_CELLS,
    )
    weapon_manifest = build_weapon_manifest(weapon_components)
    portal_manifest = build_portal_manifest(portals)
    write_json(WEAPON_MANIFEST, weapon_manifest)
    write_json(PORTAL_MANIFEST, portal_manifest)

    errors = [
        *validate_manifest_references(weapon_manifest),
        *validate_manifest_references(portal_manifest),
    ]
    report = {
        "weaponComponents": len(weapon_components),
        "weaponRecipes": weapon_manifest["recipeCount"],
        "depthPortals": len(portals),
        "rgbaPngs": len(weapon_components) + len(portals),
        "wholeChainTextures": 0,
        "manifests": [
            web_path(WEAPON_MANIFEST),
            web_path(PORTAL_MANIFEST),
        ],
        "errors": errors,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
