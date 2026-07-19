"""Validate enemy FPS bitmaps, eight-way view banks, and weapon sockets."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image


ANIMATIONS = ["idle", "move", "attack", "hurt", "death"]
DIRECTIONS = [
    "front",
    "front-left",
    "left",
    "back-left",
    "back",
    "back-right",
    "right",
    "front-right",
]
CARDINAL_DIRECTIONS = {"front", "back", "left", "right"}
DIAGONAL_DIRECTIONS = {
    "front-left",
    "back-left",
    "back-right",
    "front-right",
}
FRAME_SIZE = (96, 128)
SHEET_SIZE = (FRAME_SIZE[0] * 6, FRAME_SIZE[1])
ROOT = Path("assets/modular/fps/characters")
PROJECT_ROOT = Path(".")
EXPECTED_CHARACTERS = 105
CROSS_ERA_IMAGEGEN_SOURCE_IDS = {
    "new-modern-commuter",
    "new-modern-riot-host",
    "new-modern-response-officer",
    "new-cyber-neon-shinobi",
    "new-cyber-drone-corpse",
    "new-cyber-oni-frame",
    "new-modern-metro-colossus",
    "new-cyber-yomi-hacker",
    "new-cyber-shogun-zero",
}


def pixels(image):
    getter = getattr(image, "get_flattened_data", image.getdata)
    return list(getter())


def valid_socket(value):
    return (
        isinstance(value, list)
        and len(value) == 2
        and all(
            isinstance(coordinate, (int, float)) and 0 <= coordinate <= 1
            for coordinate in value
        )
    )


def silhouette_metrics(image, include_components=True):
    """Return cheap anti-composite signals for one 96x128 body bitmap."""

    alpha = image.getchannel("A")
    bounds = alpha.getbbox()
    if not bounds:
        return {
            "headLobes": 0,
            "headCenterPixels": 0,
            "largeBodyComponents": 0,
        }
    width, height = image.size
    alpha_bytes = alpha.tobytes()
    body_height = bounds[3] - bounds[1]
    head_bottom = min(bounds[3], bounds[1] + max(3, round(body_height * 0.3)))
    active_columns = []
    for x in range(bounds[0], bounds[2]):
        if any(
            alpha_bytes[y * width + x] > 24
            for y in range(bounds[1], head_bottom)
        ):
            active_columns.append(x)
    column_groups = []
    for x in active_columns:
        if not column_groups or x - column_groups[-1][-1] > 2:
            column_groups.append([x])
        else:
            column_groups[-1].append(x)
    minimum_head_width = max(3, round((bounds[2] - bounds[0]) * 0.12))
    head_lobes = sum(
        1 for group in column_groups if len(group) >= minimum_head_width
    )
    center_x = width // 2
    center_radius = max(2, round((bounds[2] - bounds[0]) * 0.1))
    head_center_pixels = sum(
        1
        for y in range(bounds[1], head_bottom)
        for x in range(center_x - center_radius, center_x + center_radius + 1)
        if 0 <= x < width and alpha_bytes[y * width + x] > 24
    )

    if not include_components:
        return {
            "headLobes": head_lobes,
            "headCenterPixels": head_center_pixels,
            "largeBodyComponents": 1,
        }

    active = bytearray(1 if value > 24 else 0 for value in alpha_bytes)
    components = []
    for start in range(width * height):
        if not active[start]:
            continue
        active[start] = 0
        queue = [start]
        area = 0
        min_y = max_y = start // width
        while queue:
            index = queue.pop()
            x = index % width
            y = index // width
            area += 1
            min_y = min(min_y, y)
            max_y = max(max_y, y)
            for neighbor_y in range(max(0, y - 1), min(height, y + 2)):
                row = neighbor_y * width
                for neighbor_x in range(max(0, x - 1), min(width, x + 2)):
                    neighbor = row + neighbor_x
                    if active[neighbor]:
                        active[neighbor] = 0
                        queue.append(neighbor)
        components.append((area, max_y - min_y + 1))
    largest_area = max((area for area, _ in components), default=0)
    large_body_components = sum(
        1
        for area, component_height in components
        if area >= max(20, largest_area * 0.28)
        and component_height >= body_height * 0.42
    )
    return {
        "headLobes": head_lobes,
        "headCenterPixels": head_center_pixels,
        "largeBodyComponents": large_body_components,
    }


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
    directional_characters = 0
    directional_sheet_refs = 0
    directional_frame_refs = 0
    directional_rig_frames = 0
    imagegen_source_references = set()
    non_mirrored_axial_checks = 0
    cardinal_bank_count = 0
    diagonal_bank_count = 0
    single_silhouette_diagonal_checks = 0
    single_silhouette_axial_checks = 0
    anti_composite_checks = 0
    phase_locked_directional_checks = 0

    characters = []
    for category in sorted(path for path in ROOT.iterdir() if path.is_dir()):
        entries = sorted(path for path in category.iterdir() if path.is_dir())
        category_counts[category.name] = len(entries)
        characters.extend((category.name, entry) for entry in entries)

    if len(characters) != EXPECTED_CHARACTERS:
        errors.append(
            f"{len(characters)} personnages FPS, {EXPECTED_CHARACTERS} attendus"
        )

    for category, character in characters:
        metadata_path = character / "sprite.json"
        if not metadata_path.exists():
            errors.append(f"{category}/{character.name}: sprite.json absent")
            continue
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        if (
            metadata.get("frameWidth") != FRAME_SIZE[0]
            or metadata.get("frameHeight") != FRAME_SIZE[1]
        ):
            errors.append(f"{category}/{character.name}: dimensions metadata invalides")
        if metadata.get("groundAnchor") != [0.5, 1.0]:
            errors.append(f"{category}/{character.name}: baseline metadata invalide")
        if metadata.get("alphaMode") != "straight-transparent":
            errors.append(f"{category}/{character.name}: alphaMode invalide")
        coverage = metadata.get("viewCoverage", {})
        if (
            coverage.get("frontBackAuthored") is not False
            or coverage.get("runtimeSequence") != "single-lateral-frame-locked"
            or coverage.get("imagegenRawRuntimeUse", False) is not False
        ):
            errors.append(
                f"{category}/{character.name}: contrat runtime frame-locké invalide"
            )

        if character.name in CROSS_ERA_IMAGEGEN_SOURCE_IDS:
            source_folder = character / "sources-directional"
            manifest_path = source_folder / "manifest.json"
            valid_source_reference = True
            if not manifest_path.exists():
                errors.append(
                    f"{category}/{character.name}: manifeste ImageGen source absent"
                )
                valid_source_reference = False
            else:
                manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
                if (
                    manifest.get("characterId") != character.name
                    or manifest.get("generationTool")
                    != "OpenAI ImageGen built-in"
                    or manifest.get("runtimeDecision")
                    != "rejected-for-cross-direction-frame-phase-incoherence"
                    or manifest.get("runtimeSource")
                    != "single-lateral-frame-locked"
                ):
                    errors.append(
                        f"{category}/{character.name}: contrat manifeste ImageGen invalide"
                    )
                    valid_source_reference = False
                for direction in ("front", "back"):
                    record = manifest.get("files", {}).get(direction, {})
                    raw_path = source_folder / str(record.get("file", ""))
                    if (
                        not raw_path.exists()
                        or not str(record.get("callId", "")).startswith("call_")
                        or record.get("used") is not False
                        or record.get("runtimeUse") != "source-reference-only"
                    ):
                        errors.append(
                            f"{category}/{character.name}/{direction}: "
                            "référence ImageGen brute invalide"
                        )
                        valid_source_reference = False
            if valid_source_reference:
                imagegen_source_references.add(character.name)

        # Backwards-compatible root bank (left profile).
        for animation in ANIMATIONS:
            sheet_path = character / "sheets" / f"{animation}.png"
            if not sheet_path.exists():
                errors.append(f"{category}/{character.name}/{animation}: planche absente")
                continue
            sheet = Image.open(sheet_path).convert("RGBA")
            sheet_count += 1
            if sheet.size != SHEET_SIZE:
                errors.append(
                    f"{category}/{character.name}/{animation}: "
                    f"planche {sheet.size}, {SHEET_SIZE} attendue"
                )

            hashes = []
            for index in range(6):
                frame_path = character / "frames" / animation / f"{index:02d}.png"
                if not frame_path.exists():
                    errors.append(
                        f"{category}/{character.name}/{animation}/{index:02d}: "
                        "frame absente"
                    )
                    continue
                frame = Image.open(frame_path).convert("RGBA")
                frame_count += 1
                if frame.size != FRAME_SIZE:
                    errors.append(
                        f"{category}/{character.name}/{animation}/{index:02d}: "
                        f"{frame.size}"
                    )
                    continue

                frame_pixels = pixels(frame)
                visible = {(r, g, b, a) for r, g, b, a in frame_pixels if a > 0}
                visible_color_counts.append(len(visible))
                transparent_pixels += sum(
                    1 for _, _, _, alpha in frame_pixels if alpha == 0
                )
                opaque_pixels += sum(
                    1 for _, _, _, alpha in frame_pixels if alpha > 0
                )
                opaque_magenta_pixels += sum(
                    1
                    for red, green, blue, alpha in frame_pixels
                    if alpha > 0 and red >= 248 and green <= 12 and blue >= 248
                )
                transparent_nonzero_rgb += sum(
                    1
                    for red, green, blue, alpha in frame_pixels
                    if alpha == 0 and (red != 0 or green != 0 or blue != 0)
                )
                if not visible:
                    errors.append(
                        f"{category}/{character.name}/{animation}/{index:02d}: "
                        "frame vide"
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

        directions = metadata.get("fpsDirections")
        if not isinstance(directions, dict):
            errors.append(f"{category}/{character.name}: fpsDirections absent")
            continue
        directional_characters += 1
        rig_directions = metadata.get("weaponRig", {}).get("directions", {})
        axial_hashes = {}
        directional_geometry = {}

        for direction in DIRECTIONS:
            bank = directions.get(direction)
            if not isinstance(bank, dict):
                errors.append(
                    f"{category}/{character.name}: direction {direction} absente"
                )
                continue
            if bank.get("singleSilhouetteSource") is not True:
                errors.append(
                    f"{category}/{character.name}/{direction}: "
                    "contrat singleSilhouetteSource absent"
                )
            if (
                character.name in CROSS_ERA_IMAGEGEN_SOURCE_IDS
                and direction in {"front", "back"}
            ):
                if bank.get("authoredAxialView") is not False:
                    errors.append(
                        f"{category}/{character.name}/{direction}: "
                        "vue ImageGen authorée non déclarée"
                    )
                elif "frame-locked" not in str(bank.get("source", "")).lower():
                    errors.append(
                        f"{category}/{character.name}/{direction}: "
                        "provenance ImageGen absente"
                    )
                else:
                    imagegen_source_references.add(character.name)
            if direction in {"front", "back"} and (
                bank.get("authoredAxialView") is not False
                or "frame-locked" not in str(bank.get("source", "")).lower()
            ):
                errors.append(
                    f"{category}/{character.name}/{direction}: "
                    "projection axiale runtime non frame-lockée"
                )
            if direction in CARDINAL_DIRECTIONS:
                if bank.get("sourceKind") != "cardinal-bitmap-source":
                    errors.append(
                        f"{category}/{character.name}/{direction}: "
                        "banque cardinale non déclarée comme source bitmap"
                    )
                else:
                    cardinal_bank_count += 1
            else:
                expected_axial = "front" if direction.startswith("front") else "back"
                expected_side = "left" if direction.endswith("left") else "right"
                if (
                    bank.get("sourceKind") != "derived-diagonal-bitmap"
                    or bank.get("derivedFrom") != [expected_axial]
                    or bank.get("orientationToward") != expected_side
                ):
                    errors.append(
                        f"{category}/{character.name}/{direction}: "
                        "contrat diagonal dérivé invalide"
                    )
                else:
                    diagonal_bank_count += 1

            animations = bank.get("animations", {})
            frame_banks = bank.get("frames", {})
            direction_rig = rig_directions.get(direction)
            if not isinstance(direction_rig, dict):
                errors.append(
                    f"{category}/{character.name}/{direction}: "
                    "weaponRig directionnel absent"
                )
                direction_rig = {}

            for animation in ANIMATIONS:
                sheet_value = animations.get(animation)
                sheet_path = PROJECT_ROOT / str(sheet_value or "")
                directional_sheet_refs += 1
                if not sheet_value or not sheet_path.exists():
                    errors.append(
                        f"{category}/{character.name}/{direction}/{animation}: "
                        "planche directionnelle absente"
                    )
                    continue
                sheet = Image.open(sheet_path).convert("RGBA")
                if sheet.size != SHEET_SIZE:
                    errors.append(
                        f"{category}/{character.name}/{direction}/{animation}: "
                        f"planche {sheet.size}"
                    )

                declared_frames = frame_banks.get(animation)
                if not isinstance(declared_frames, list) or len(declared_frames) != 6:
                    errors.append(
                        f"{category}/{character.name}/{direction}/{animation}: "
                        "6 frames directionnelles attendues"
                    )
                    continue
                frame_hashes = []
                for index, frame_value in enumerate(declared_frames):
                    frame_path = PROJECT_ROOT / str(frame_value)
                    directional_frame_refs += 1
                    if not frame_path.exists():
                        errors.append(
                            f"{category}/{character.name}/{direction}/{animation}/{index}: "
                            "frame absente"
                        )
                        continue
                    frame = Image.open(frame_path).convert("RGBA")
                    if frame.size != FRAME_SIZE:
                        errors.append(
                            f"{category}/{character.name}/{direction}/{animation}/{index}: "
                            f"{frame.size}"
                        )
                        continue
                    bbox = frame.getchannel("A").getbbox()
                    if not bbox or bbox[3] != FRAME_SIZE[1]:
                        errors.append(
                            f"{category}/{character.name}/{direction}/{animation}/{index}: "
                            f"baseline {bbox[3] if bbox else 'vide'}"
                        )
                    if bbox:
                        alpha_histogram = frame.getchannel("A").histogram()
                        directional_geometry[(direction, animation, index)] = (
                            sum(alpha_histogram[1:]),
                            bbox,
                        )
                    if character.name:
                        silhouette = silhouette_metrics(
                            frame,
                            include_components=index == 0,
                        )
                        if silhouette["largeBodyComponents"] > 1:
                            errors.append(
                                f"{category}/{character.name}/{direction}/"
                                f"{animation}/{index}: plusieurs corps opaques"
                            )
                        if (
                            animation != "death"
                            and direction not in {"left", "right"}
                        ):
                            if (
                                silhouette["headLobes"] > 1
                                and silhouette["headCenterPixels"] < 6
                            ):
                                errors.append(
                                    f"{category}/{character.name}/{direction}/"
                                    f"{animation}/{index}: tete composite en deux lobes"
                                )
                            if silhouette["headCenterPixels"] == 0:
                                errors.append(
                                    f"{category}/{character.name}/{direction}/"
                                    f"{animation}/{index}: centre tete vide"
                                )
                        anti_composite_checks += 1
                    frame_hashes.append(hashlib.sha256(frame.tobytes()).hexdigest())
                    cell = sheet.crop(
                        (
                            index * FRAME_SIZE[0],
                            0,
                            (index + 1) * FRAME_SIZE[0],
                            FRAME_SIZE[1],
                        )
                    )
                    if cell.tobytes() != frame.tobytes():
                        errors.append(
                            f"{category}/{character.name}/{direction}/{animation}/{index}: "
                            "planche/frame directionnel divergent"
                        )
                if len(frame_hashes) == 6 and len(set(frame_hashes)) != 6:
                    errors.append(
                        f"{category}/{character.name}/{direction}/{animation}: "
                        "frames directionnelles dupliquées"
                    )
                if frame_hashes:
                    axial_hashes[(direction, animation)] = frame_hashes[0]

                rig_frames = direction_rig.get("animations", {}).get(animation)
                if not isinstance(rig_frames, list) or len(rig_frames) != 6:
                    errors.append(
                        f"{category}/{character.name}/{direction}/{animation}: "
                        "6 sockets d'arme attendus"
                    )
                    continue
                directional_rig_frames += len(rig_frames)
                for index, rig in enumerate(rig_frames):
                    hidden = animation == "death"
                    if hidden:
                        if rig.get("layer") != "hidden" or rig.get("scale") != 0:
                            errors.append(
                                f"{category}/{character.name}/{direction}/death/{index}: "
                                "arme non masquée"
                            )
                        continue
                    if rig.get("layer") != "front-body":
                        errors.append(
                            f"{category}/{character.name}/{direction}/{animation}/{index}: "
                            "arme hors premier plan"
                        )
                    for field in ("primaryHand", "secondaryHand"):
                        if not valid_socket(rig.get(field)):
                            errors.append(
                                f"{category}/{character.name}/{direction}/{animation}/{index}: "
                                f"socket {field} invalide"
                            )

        if character.name:
            for direction in ("front", "back"):
                for animation in ANIMATIONS:
                    for index in range(6):
                        axial_geometry = directional_geometry.get(
                            (direction, animation, index),
                        )
                        lateral_geometry = directional_geometry.get(
                            ("left", animation, index),
                        )
                        if not axial_geometry or not lateral_geometry:
                            continue
                        axial_area, axial_bounds = axial_geometry
                        lateral_area, lateral_bounds = lateral_geometry
                        area_ratio = axial_area / max(1, lateral_area)
                        if (
                            area_ratio > 0.94
                            or axial_bounds[2] - axial_bounds[0]
                            > lateral_bounds[2] - lateral_bounds[0] + 2
                        ):
                            errors.append(
                                f"{category}/{character.name}/{direction}/"
                                f"{animation}/{index}: projection axiale "
                                f"composite (aire={area_ratio:.2f})"
                            )
                        else:
                            single_silhouette_axial_checks += 1

        # Every turned bank must preserve the exact action/frame phase of the
        # authoritative lateral sequence. A direction switch may change width
        # and lean, but never standing/lying timing or vertical pose extent.
        for direction in [entry for entry in DIRECTIONS if entry != "left"]:
            for animation in ANIMATIONS:
                for index in range(6):
                    turned_geometry = directional_geometry.get(
                        (direction, animation, index),
                    )
                    lateral_geometry = directional_geometry.get(
                        ("left", animation, index),
                    )
                    if not turned_geometry or not lateral_geometry:
                        continue
                    _, turned_bounds = turned_geometry
                    _, lateral_bounds = lateral_geometry
                    lateral_height = lateral_bounds[3] - lateral_bounds[1]
                    turned_height = turned_bounds[3] - turned_bounds[1]
                    if (
                        abs(turned_bounds[1] - lateral_bounds[1]) > 3
                        or turned_bounds[3] != lateral_bounds[3]
                        or turned_height / max(1, lateral_height) < 0.94
                    ):
                        errors.append(
                            f"{category}/{character.name}/{direction}/"
                            f"{animation}/{index}: phase verticale divergente"
                        )
                    else:
                        phase_locked_directional_checks += 1

        # A diagonal is a projection of one axial pose, never the union of the
        # axial and lateral bodies. Its area and bounds must remain inside the
        # authoritative front/back silhouette envelope.
        for direction, expected_axial in {
            "front-left": "front",
            "front-right": "front",
            "back-left": "back",
            "back-right": "back",
        }.items():
            for animation in ANIMATIONS:
                for index in range(6):
                    diagonal_geometry = directional_geometry.get(
                        (direction, animation, index),
                    )
                    axial_geometry = directional_geometry.get(
                        (expected_axial, animation, index),
                    )
                    if not diagonal_geometry or not axial_geometry:
                        continue
                    diagonal_area, diagonal_bounds = diagonal_geometry
                    axial_area, axial_bounds = axial_geometry
                    area_ratio = diagonal_area / max(1, axial_area)
                    diagonal_width = diagonal_bounds[2] - diagonal_bounds[0]
                    axial_width = axial_bounds[2] - axial_bounds[0]
                    if (
                        not 0.62 <= area_ratio <= 1.02
                        or diagonal_width > axial_width + 6
                        or abs(diagonal_bounds[1] - axial_bounds[1]) > 3
                        or diagonal_bounds[3] != axial_bounds[3]
                    ):
                        errors.append(
                            f"{category}/{character.name}/{direction}/"
                            f"{animation}/{index}: projection diagonale "
                            f"double ou incoherente (aire={area_ratio:.2f})"
                        )
                    else:
                        single_silhouette_diagonal_checks += 1

        # Front/back must be independent bitmaps, not the old canvas half-mirror.
        for animation in ANIMATIONS:
            front = axial_hashes.get(("front", animation))
            back = axial_hashes.get(("back", animation))
            left = directions.get("left", {}).get("frames", {}).get(animation, [])
            if not front or not back or not left:
                continue
            left_image = Image.open(PROJECT_ROOT / left[0]).convert("RGBA")
            mirrored_left = hashlib.sha256(
                left_image.transpose(Image.Transpose.FLIP_LEFT_RIGHT).tobytes()
            ).hexdigest()
            if front in {back, mirrored_left} or back == mirrored_left:
                errors.append(
                    f"{category}/{character.name}/{animation}: "
                    "face/dos encore dérivé d'un simple miroir"
                )
            else:
                non_mirrored_axial_checks += 1

    if opaque_magenta_pixels:
        errors.append(f"{opaque_magenta_pixels} pixels magenta visibles")
    if transparent_nonzero_rgb:
        errors.append(
            f"{transparent_nonzero_rgb} pixels transparents avec RGB résiduel"
        )
    if transparent_pixels == 0 or opaque_pixels == 0:
        errors.append(
            "les frames ne mélangent pas alpha transparent et pixels visibles"
        )
    if imagegen_source_references != CROSS_ERA_IMAGEGEN_SOURCE_IDS:
        errors.append(
            "références source ImageGen manquantes: "
            f"{sorted(CROSS_ERA_IMAGEGEN_SOURCE_IDS - imagegen_source_references)}"
        )
    expected_axial_checks = EXPECTED_CHARACTERS * 2 * len(ANIMATIONS) * 6
    expected_diagonal_checks = EXPECTED_CHARACTERS * 4 * len(ANIMATIONS) * 6
    expected_anti_composite_checks = (
        EXPECTED_CHARACTERS * len(DIRECTIONS) * len(ANIMATIONS) * 6
    )
    expected_phase_locked_checks = (
        EXPECTED_CHARACTERS * (len(DIRECTIONS) - 1) * len(ANIMATIONS) * 6
    )
    if single_silhouette_axial_checks != expected_axial_checks:
        errors.append(
            f"{single_silhouette_axial_checks} projections axiales propres, "
            f"{expected_axial_checks} attendues"
        )
    if single_silhouette_diagonal_checks != expected_diagonal_checks:
        errors.append(
            f"{single_silhouette_diagonal_checks} projections diagonales propres, "
            f"{expected_diagonal_checks} attendues"
        )
    if anti_composite_checks != expected_anti_composite_checks:
        errors.append(
            f"{anti_composite_checks} checks anti-composite, "
            f"{expected_anti_composite_checks} attendus"
        )
    if phase_locked_directional_checks != expected_phase_locked_checks:
        errors.append(
            f"{phase_locked_directional_checks} checks de phase directionnelle, "
            f"{expected_phase_locked_checks} attendus"
        )

    report = {
        "characters": len(characters),
        "categoryCounts": category_counts,
        "animationSheets": sheet_count,
        "framePngs": frame_count,
        "frameSize": list(FRAME_SIZE),
        "groundedFrames": grounded_frames,
        "distinctAnimationSets": distinct_animation_sets,
        "sheetCellsMatchingFrames": sheet_cells_matching_frames,
        "directions": DIRECTIONS,
        "cardinalDirections": sorted(CARDINAL_DIRECTIONS),
        "diagonalDirections": sorted(DIAGONAL_DIRECTIONS),
        "directionalCharacters": directional_characters,
        "cardinalBitmapSourceBanks": cardinal_bank_count,
        "derivedDiagonalBitmapBanks": diagonal_bank_count,
        "singleSilhouetteDiagonalChecks": single_silhouette_diagonal_checks,
        "singleSilhouetteAxialChecks": single_silhouette_axial_checks,
        "antiCompositeChecks": anti_composite_checks,
        "phaseLockedDirectionalChecks": phase_locked_directional_checks,
        "directionalSheetRefs": directional_sheet_refs,
        "directionalFrameRefs": directional_frame_refs,
        "directionalRigFrames": directional_rig_frames,
        "imagegenSourceReferenceCharacters": sorted(imagegen_source_references),
        "nonMirroredAxialChecks": non_mirrored_axial_checks,
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
