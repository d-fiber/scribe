# Copyright (C) 2026 Fiber
#
# This file is part of scribe and is made available under the PolyForm Shield
# License 1.0.0. The full terms are in the LICENSE file at the root of this
# repository, and at https://polyformproject.org/licenses/shield/1.0.0
#
# What you may do:
# - Use this software for any purpose, including commercially, and build and
#   sell your own products on top of it.
# - Change it, and create new works based on it.
# - Distribute copies of it, with or without your changes.
#
# The one thing you may not do:
# - Use it to provide any product that competes with scribe, or with any
#   product Fiber or its affiliates provide using scribe. Products compete
#   even when they are offered free of charge, through a different kind of
#   interface, or for a different technical platform.
#
# If you pass this software on:
# - Anyone who receives any part of it from you must also receive these terms,
#   or the URL above, together with the "Required Notice" line carried by the
#   LICENSE file.
#
# Disclaimer:
# AS FAR AS THE LAW ALLOWS, THIS SOFTWARE COMES AS IS, WITHOUT ANY WARRANTY OR
# CONDITION, AND THE LICENSOR WILL NOT BE LIABLE TO YOU FOR ANY DAMAGES ARISING
# OUT OF THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY KIND OF
# LEGAL CLAIM.
#
# This header is a summary written for convenience. Where it differs from the
# LICENSE file, the LICENSE file governs.

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

SKIPPED = {"node_modules", ".git", ".github", "gen", "dist"}

VERSION_LINE = re.compile(r'("version"\s*:\s*")[^"]*(")')

ANNOUNCED_FILE = "sdk/js/src/protocol/version.ts"

ANNOUNCED = {"PROTOCOL_VERSION": "protocol", "SDK_VERSION": "sdk/js"}

@dataclass(frozen=True)
class Component:
    label: str
    directory: str
    version_file: str
    version_kind: Literal["text", "deno_json"]
    analyzer: Literal["proto", "api"]
    entrypoints: tuple[str, ...]

def _entrypoints(exports: object) -> tuple[str, ...]:
    if isinstance(exports, str):
        return (exports,)
    if isinstance(exports, dict):
        return tuple(value for value in exports.values() if isinstance(value, str))
    return ()

def _read_json(path: Path) -> dict | None:
    try:
        return json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        return None

def _inspect(directory: Path, tree_root: Path) -> Component | None:
    relative = str(directory.relative_to(tree_root))

    config = _read_json(directory / "deno.json")
    if config and isinstance(config.get("name"), str) and isinstance(config.get("version"), str) and config.get("exports"):
        return Component(
            label=config["name"],
            directory=relative,
            version_file=f"{relative}/deno.json",
            version_kind="deno_json",
            analyzer="api",
            entrypoints=_entrypoints(config["exports"]),
        )

    if (directory / "VERSION").is_file():
        return Component(
            label=relative,
            directory=relative,
            version_file=f"{relative}/VERSION",
            version_kind="text",
            analyzer="proto",
            entrypoints=(),
        )

    return None


def discover(tree_root: Path) -> list[Component]:
    found: list[Component] = []

    def walk(directory: Path) -> None:
        for entry in sorted(directory.iterdir()):
            if not entry.is_dir() or entry.name in SKIPPED:
                continue
            component = _inspect(entry, tree_root)
            if component is not None:
                found.append(component)
            walk(entry)

    walk(tree_root)
    return sorted(found, key=lambda component: component.directory)

def read_version(tree_root: Path, component: Component) -> str:
    raw = (tree_root / component.version_file).read_text()
    if component.version_kind == "text":
        return raw.strip()

    version = json.loads(raw).get("version")
    if not isinstance(version, str):
        raise ValueError(f"{component.version_file} carries no version")

    return version

def write_version(tree_root: Path, component: Component, version: str) -> None:
    path = tree_root / component.version_file

    if component.version_kind == "text":
        path.write_text(f"{version}\n")
        return

    raw = path.read_text()
    replaced, count = VERSION_LINE.subn(rf"\g<1>{version}\g<2>", raw, count=1)
    if count == 0:
        raise ValueError(f"could not rewrite the version in {component.version_file}")

    path.write_text(replaced)


def announced_line(name: str) -> re.Pattern[str]:
    return re.compile(rf'(export const {name}\s*=\s*")[^"]*(")')


def mirror_announced(tree_root: Path, components: list[Component]) -> list[str]:
    path = tree_root / ANNOUNCED_FILE
    if not path.is_file():
        return []

    by_directory = {component.directory: component for component in components}
    raw = path.read_text()
    mirrored: list[str] = []

    for name, directory in ANNOUNCED.items():
        component = by_directory.get(directory)
        if component is None:
            continue

        version = read_version(tree_root, component)
        raw, count = announced_line(name).subn(rf"\g<1>{version}\g<2>", raw, count=1)
        if count == 0:
            raise ValueError(f"{ANNOUNCED_FILE} declares no {name}")

        mirrored.append(f"{name} {version}")

    path.write_text(raw)
    return mirrored
