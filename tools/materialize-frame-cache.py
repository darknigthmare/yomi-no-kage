#!/usr/bin/env python3
"""Materialize ignored frame PNG caches from canonical six-cell sheets.

This tool is deliberately metadata-free: it only reads ``sprite.json`` files
and canonical ``sheets/*.png`` atlases, then verifies or writes the declared
``frames/*.png`` crops.  Every write is an atomic replacement in the target
directory so an interrupted run cannot leave a partially encoded PNG behind.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
import json
import os
from pathlib import Path
from typing import Any
from uuid import uuid4

from PIL import Image, UnidentifiedImageError


ROOT = Path(__file__).resolve().parents[1]
MODULAR_ROOT = ROOT / "assets" / "modular"
CHARACTER_ROOT = MODULAR_ROOT / "characters"
FPS_CHARACTER_ROOT = MODULAR_ROOT / "fps" / "characters"
FPS_PLAYER_SPRITE = (
    MODULAR_ROOT / "fps" / "player" / "akio" / "body" / "sprite.json"
)
FPS_DIRECTIONS = (
    "front",
    "front-left",
    "left",
    "back-left",
    "back",
    "back-right",
    "right",
    "front-right",
)
DIFFERENCE_REPORT_LIMIT = 100


@dataclass(frozen=True)
class SpriteSource:
    view: str
    category: str
    character_id: str
    path: Path


@dataclass(frozen=True)
class FrameTask:
    source: Path
    destination: Path
    rect: tuple[int, int, int, int]
    owner: tuple[str, str, str]
    animation: str
    direction: str | None


def read_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("the JSON root must be an object")
    return value


def relative(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def positive_integer(value: Any) -> int | None:
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        return None
    return value


def resolve_beneath(base: Path, value: Any, field: str) -> Path:
    if not isinstance(value, str) or not value:
        raise ValueError(f"{field}: expected a non-empty relative path")
    declared = Path(value)
    if declared.is_absolute():
        raise ValueError(f"{field}: absolute paths are forbidden")
    result = (base / declared).resolve()
    try:
        result.relative_to(base.resolve())
    except ValueError as error:
        raise ValueError(f"{field}: path escapes {relative(base)}") from error
    return result


def discover_sources() -> list[SpriteSource]:
    sources: list[SpriteSource] = []
    for root, view in ((CHARACTER_ROOT, "2d"), (FPS_CHARACTER_ROOT, "fps")):
        if not root.exists():
            continue
        for sprite_path in sorted(root.glob("*/*/sprite.json")):
            sources.append(
                SpriteSource(
                    view=view,
                    category=sprite_path.parent.parent.name,
                    character_id=sprite_path.parent.name,
                    path=sprite_path,
                )
            )
    if FPS_PLAYER_SPRITE.exists():
        sources.append(
            SpriteSource(
                view="fps-player",
                category="player",
                character_id="akio",
                path=FPS_PLAYER_SPRITE,
            )
        )
    return sorted(
        sources,
        key=lambda item: (item.category, item.character_id, item.view, relative(item.path)),
    )


class Planner:
    def __init__(self) -> None:
        self.tasks: dict[Path, FrameTask] = {}
        self.issues: list[str] = []
        self.sheet_sizes: dict[Path, tuple[int, int]] = {}

    def issue(self, context: str, message: str) -> None:
        self.issues.append(f"{context}: {message}")

    def sheet_size(self, path: Path, context: str) -> tuple[int, int] | None:
        if path in self.sheet_sizes:
            return self.sheet_sizes[path]
        try:
            with Image.open(path) as image:
                if image.format != "PNG":
                    raise ValueError("canonical sheet is not a PNG")
                image.load()
                size = image.size
        except (FileNotFoundError, OSError, UnidentifiedImageError, ValueError) as error:
            self.issue(context, f"cannot read {relative(path)} ({error})")
            return None
        self.sheet_sizes[path] = size
        return size

    def six_cells(
        self,
        sprite: dict[str, Any],
        frames: Any,
        sheet_size: tuple[int, int],
        context: str,
    ) -> list[tuple[int, int, int, int]] | None:
        if not isinstance(frames, list) or len(frames) != 6:
            self.issue(context, "exactly six frame declarations are required")
            return None

        width, height = sheet_size
        frame_width = positive_integer(sprite.get("frameWidth"))
        frame_height = positive_integer(sprite.get("frameHeight"))
        if (sprite.get("frameWidth") is None) != (sprite.get("frameHeight") is None):
            self.issue(context, "frameWidth and frameHeight must be declared together")
            return None
        if sprite.get("frameWidth") is not None and (
            frame_width is None or frame_height is None
        ):
            self.issue(context, "declared frame dimensions must be positive integers")
            return None

        declared_rects: list[tuple[int, int, int, int]] = []
        has_rect = False
        for index, frame in enumerate(frames):
            if not isinstance(frame, dict):
                continue
            if frame.get("index") is not None and frame.get("index") != index:
                self.issue(context, f"frame {index} has a non-sequential index")
                return None
            rect = frame.get("rect")
            if rect is None:
                continue
            has_rect = True
            if (
                not isinstance(rect, list)
                or len(rect) != 4
                or any(
                    isinstance(component, bool) or not isinstance(component, int)
                    for component in rect
                )
            ):
                self.issue(context, f"frame {index} has an invalid rect")
                return None
            declared_rects.append(tuple(rect))

        if has_rect:
            if len(declared_rects) != 6:
                self.issue(context, "rect must be declared for all six frames or none")
                return None
            cursor = 0
            source_row_y = declared_rects[0][1]
            local_rects: list[tuple[int, int, int, int]] = []
            for index, (x, y, cell_width, cell_height) in enumerate(declared_rects):
                # These rects originate in the five-row master atlas.  The
                # canonical animation sheet contains only that row, so its
                # local crop always starts at y=0 while x/width stay exact.
                if (
                    x != cursor
                    or y != source_row_y
                    or cell_width <= 0
                    or cell_height != height
                ):
                    self.issue(
                        context,
                        f"frame {index} rect does not form a contiguous horizontal cell",
                    )
                    return None
                if frame_width is not None and (
                    cell_width != frame_width or cell_height != frame_height
                ):
                    self.issue(context, f"frame {index} rect conflicts with frame dimensions")
                    return None
                cursor += cell_width
                local_rects.append((x, 0, cell_width, cell_height))
            if cursor != width:
                self.issue(context, "the six declared rects do not cover the whole sheet")
                return None
            if frame_width is not None and (width, height) != (
                frame_width * 6,
                frame_height,
            ):
                self.issue(context, "sheet size conflicts with declared frame dimensions")
                return None
            return local_rects

        if frame_width is None:
            if width % 6:
                self.issue(context, "sheet width is not divisible into six exact cells")
                return None
            frame_width = width // 6
            frame_height = height
        if (width, height) != (frame_width * 6, frame_height):
            self.issue(
                context,
                "sheet size does not equal six declared horizontal frame dimensions",
            )
            return None
        return [
            (index * frame_width, 0, frame_width, frame_height)
            for index in range(6)
        ]

    def add_task(self, task: FrameTask, context: str) -> None:
        try:
            destination_relative = task.destination.relative_to(ROOT)
            task.source.relative_to(ROOT)
        except ValueError:
            self.issue(context, "source or destination escapes the repository")
            return
        if task.source.suffix.lower() != ".png":
            self.issue(context, "canonical sheet must have a .png extension")
            return
        if task.destination.suffix.lower() != ".png" or "frames" not in destination_relative.parts:
            self.issue(context, "frame destination must be a PNG below a frames directory")
            return
        existing = self.tasks.get(task.destination)
        if existing is not None and (
            existing.source != task.source or existing.rect != task.rect
        ):
            self.issue(context, f"conflicting recipes target {relative(task.destination)}")
            return
        self.tasks[task.destination] = task

    def local_animations(
        self,
        source: SpriteSource,
        sprite: dict[str, Any],
    ) -> None:
        animations = sprite.get("animations")
        if not isinstance(animations, dict) or not animations:
            self.issue(relative(source.path), "animations must be a non-empty object")
            return
        folder = source.path.parent
        for animation in sorted(animations):
            context = f"{relative(source.path)} animations.{animation}"
            frames = animations[animation]
            sheet_path = folder / "sheets" / f"{animation}.png"
            size = self.sheet_size(sheet_path, context)
            if size is None:
                continue
            rects = self.six_cells(sprite, frames, size, context)
            if rects is None:
                continue
            for index, (frame, rect) in enumerate(zip(frames, rects, strict=True)):
                if not isinstance(frame, dict):
                    self.issue(context, f"frame {index} must be an object")
                    continue
                try:
                    destination = resolve_beneath(
                        folder,
                        frame.get("file"),
                        f"{context}.frames[{index}].file",
                    )
                except ValueError as error:
                    self.issue(context, str(error))
                    continue
                self.add_task(
                    FrameTask(
                        source=sheet_path,
                        destination=destination,
                        rect=rect,
                        owner=(source.view, source.category, source.character_id),
                        animation=animation,
                        direction=None,
                    ),
                    context,
                )

    def directional_animations(
        self,
        source: SpriteSource,
        sprite: dict[str, Any],
    ) -> None:
        banks = sprite.get("fpsDirections")
        if not isinstance(banks, dict) or not banks:
            self.local_animations(source, sprite)
            return
        ordered_directions = sorted(
            banks,
            key=lambda value: (
                FPS_DIRECTIONS.index(value) if value in FPS_DIRECTIONS else len(FPS_DIRECTIONS),
                value,
            ),
        )
        for direction in ordered_directions:
            bank = banks[direction]
            bank_context = f"{relative(source.path)} fpsDirections.{direction}"
            if not isinstance(bank, dict):
                self.issue(bank_context, "direction bank must be an object")
                continue
            sheets = bank.get("animations")
            frames_by_animation = bank.get("frames")
            if not isinstance(sheets, dict) or not isinstance(frames_by_animation, dict):
                self.issue(bank_context, "animations and frames must be objects")
                continue
            if set(sheets) != set(frames_by_animation):
                self.issue(bank_context, "animation sheet and frame keys do not match")
                continue
            for animation in sorted(sheets):
                context = f"{bank_context}.{animation}"
                try:
                    sheet_path = resolve_beneath(
                        ROOT,
                        sheets[animation],
                        f"{context}.sheet",
                    )
                except ValueError as error:
                    self.issue(context, str(error))
                    continue
                size = self.sheet_size(sheet_path, context)
                if size is None:
                    continue
                declared_paths = frames_by_animation[animation]
                pseudo_frames = (
                    [{"index": index} for index in range(6)]
                    if isinstance(declared_paths, list) and len(declared_paths) == 6
                    else declared_paths
                )
                rects = self.six_cells(sprite, pseudo_frames, size, context)
                if rects is None:
                    continue
                assert isinstance(declared_paths, list)
                for index, (declared_path, rect) in enumerate(
                    zip(declared_paths, rects, strict=True)
                ):
                    try:
                        destination = resolve_beneath(
                            ROOT,
                            declared_path,
                            f"{context}.frames[{index}]",
                        )
                        destination.relative_to(source.path.parent.resolve())
                    except ValueError as error:
                        self.issue(
                            context,
                            f"frame {index} is outside its character directory ({error})",
                        )
                        continue
                    self.add_task(
                        FrameTask(
                            source=sheet_path,
                            destination=destination,
                            rect=rect,
                            owner=(source.view, source.category, source.character_id),
                            animation=animation,
                            direction=direction,
                        ),
                        context,
                    )

    def add_source(self, source: SpriteSource) -> None:
        try:
            sprite = read_json(source.path)
        except (OSError, ValueError, json.JSONDecodeError) as error:
            self.issue(relative(source.path), f"cannot read sprite metadata ({error})")
            return
        if source.view == "fps":
            self.directional_animations(source, sprite)
        else:
            self.local_animations(source, sprite)


def frame_state(expected: Image.Image, destination: Path) -> tuple[str, str | None]:
    if not destination.exists():
        return "missing", None
    try:
        with Image.open(destination) as current:
            if current.format != "PNG":
                return "stale", "not-png"
            current.load()
            if current.mode != expected.mode:
                return "stale", "mode"
            if current.size != expected.size:
                return "stale", "dimensions"
            if current.tobytes() != expected.tobytes():
                return "stale", "pixels"
    except (OSError, UnidentifiedImageError):
        return "stale", "unreadable"
    return "current", None


def atomic_save_png(image: Image.Image, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    # A normal exclusive file inherits the repository ACL on Windows. Python's
    # tempfile helpers can create owner-only ACLs that later QA processes cannot
    # read after the atomic replacement.
    temporary = destination.parent / f".{destination.stem}.{uuid4().hex}.tmp"
    try:
        with temporary.open("x+b") as handle:
            image.save(handle, format="PNG", optimize=False, compress_level=9)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, destination)
    except BaseException:
        try:
            temporary.unlink(missing_ok=True)
        finally:
            raise


def empty_character_report(owner: tuple[str, str, str]) -> dict[str, Any]:
    view, category, character_id = owner
    return {
        "view": view,
        "category": category,
        "id": character_id,
        "planned": 0,
        "current": 0,
        "missing": 0,
        "stale": 0,
        "written": 0,
        "failed": 0,
    }


def execute(
    planner: Planner,
    sources: list[SpriteSource],
    check: bool,
    categories: list[str],
    character_ids: list[str],
) -> tuple[dict[str, Any], int]:
    owners = sorted(
        {(source.view, source.category, source.character_id) for source in sources}
    )
    character_reports = {owner: empty_character_report(owner) for owner in owners}
    ordered_tasks = sorted(
        planner.tasks.values(),
        key=lambda task: (
            relative(task.source),
            task.rect,
            relative(task.destination),
        ),
    )
    for task in ordered_tasks:
        character_reports[task.owner]["planned"] += 1

    result_counts = {
        "planned": len(ordered_tasks),
        "current": 0,
        "missing": 0,
        "stale": 0,
        "wouldWrite": 0,
        "written": 0,
        "failed": 0,
    }
    differences: list[dict[str, Any]] = []
    execution_issues: list[str] = []

    if not planner.issues:
        by_sheet: dict[Path, list[FrameTask]] = {}
        for task in ordered_tasks:
            by_sheet.setdefault(task.source, []).append(task)
        for sheet_path in sorted(by_sheet, key=relative):
            try:
                with Image.open(sheet_path) as sheet:
                    sheet.load()
                    for task in by_sheet[sheet_path]:
                        x, y, width, height = task.rect
                        expected = sheet.crop((x, y, x + width, y + height))
                        try:
                            state, reason = frame_state(expected, task.destination)
                            result_counts[state] += 1
                            character_reports[task.owner][state] += 1
                            if state == "current":
                                continue
                            result_counts["wouldWrite"] += 1
                            if len(differences) < DIFFERENCE_REPORT_LIMIT:
                                difference: dict[str, Any] = {
                                    "path": relative(task.destination),
                                    "state": state,
                                }
                                if reason is not None:
                                    difference["reason"] = reason
                                differences.append(difference)
                            if not check:
                                try:
                                    atomic_save_png(expected, task.destination)
                                except OSError as error:
                                    result_counts["failed"] += 1
                                    character_reports[task.owner]["failed"] += 1
                                    execution_issues.append(
                                        f"{relative(task.destination)}: atomic write failed ({error})"
                                    )
                                else:
                                    result_counts["written"] += 1
                                    character_reports[task.owner]["written"] += 1
                        finally:
                            expected.close()
            except (OSError, UnidentifiedImageError) as error:
                failed_count = len(by_sheet[sheet_path])
                result_counts["failed"] += failed_count
                for task in by_sheet[sheet_path]:
                    character_reports[task.owner]["failed"] += 1
                execution_issues.append(
                    f"{relative(sheet_path)}: source became unreadable during execution ({error})"
                )

    all_issues = sorted(planner.issues + execution_issues)
    difference_total = result_counts["missing"] + result_counts["stale"]
    if check:
        ok = not all_issues and difference_total == 0
    else:
        ok = not all_issues and result_counts["failed"] == 0
    report = {
        "schema": 1,
        "mode": "check" if check else "materialize",
        "filters": {
            "categories": categories,
            "ids": character_ids,
        },
        "selected": {
            "spriteFiles": len(sources),
            "logicalCharacters": len(
                {(source.category, source.character_id) for source in sources}
            ),
            "views": {
                view: sum(1 for source in sources if source.view == view)
                for view in sorted({source.view for source in sources})
            },
            "canonicalSheets": len(planner.sheet_sizes),
        },
        "results": result_counts,
        "characters": [character_reports[owner] for owner in owners],
        "differences": differences,
        "differencesOmitted": max(0, difference_total - len(differences)),
        "issues": all_issues,
        "ok": ok,
    }
    if planner.issues:
        return report, 2
    return report, 0 if ok else 1


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Rebuild ignored 2D/FPS frame PNGs from canonical six-cell sheets."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Verify every selected cache frame without writing any file.",
    )
    parser.add_argument(
        "--categories",
        nargs="*",
        default=[],
        help="Optional exact category folders (for example: regular special).",
    )
    parser.add_argument(
        "--ids",
        nargs="*",
        default=[],
        help="Optional exact character IDs.",
    )
    args = parser.parse_args()

    categories = sorted(set(args.categories))
    character_ids = sorted(set(args.ids))
    discovered = discover_sources()
    sources = [
        source
        for source in discovered
        if (not categories or source.category in categories)
        and (not character_ids or source.character_id in character_ids)
    ]

    planner = Planner()
    unmatched_categories = sorted(
        set(categories) - {source.category for source in sources}
    )
    unmatched_ids = sorted(set(character_ids) - {source.character_id for source in sources})
    if unmatched_categories:
        planner.issue("filters.categories", f"unmatched values: {unmatched_categories}")
    if unmatched_ids:
        planner.issue("filters.ids", f"unmatched values: {unmatched_ids}")
    if not sources:
        planner.issue("filters", "no sprite metadata matched the selection")

    for source in sources:
        planner.add_source(source)

    report, exit_code = execute(
        planner,
        sources,
        args.check,
        categories,
        character_ids,
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
