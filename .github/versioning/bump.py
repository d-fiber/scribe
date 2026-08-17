#!/usr/bin/env python3
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

import argparse
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from versioning.api import api_surface
from versioning.components import ANNOUNCED_FILE, Component, discover, mirror_announced, read_version, write_version
from versioning.git import materialise, revision_exists, touched_paths
from versioning.proto import ProtocMissing, proto_surface
from versioning.changelog import entries, has_breaking, prepend, render
from versioning.semver import Bump, apply_bump, classify, format_version, parse_version, strongest

@dataclass(frozen=True)
class Decision:
    component: Component
    bump: Bump
    before: str
    after: str
    note: str

def surface_of(tree_root: Path, component: Component) -> set[str]:
    directory = tree_root / component.directory
    if component.analyzer == "proto":
        return proto_surface(directory)
    return api_surface(directory, component.entrypoints)

def decide(
    component: Component,
    base_tree: Path,
    head_tree: Path,
    touched: list[str],
    repository: Path,
) -> Decision:
    before = read_version(repository, component)

    relevant = [path for path in touched if path != component.version_file]
    changed = any(
        path == component.directory or path.startswith(f"{component.directory}/") for path in relevant
    )
    if not changed:
        return Decision(component, "none", before, before, "no change")

    if not (base_tree / component.directory).exists():
        after = format_version(apply_bump(parse_version(before), "minor"))
        return Decision(component, "minor", before, after, "new component")

    try:
        base = surface_of(base_tree, component)
        head = surface_of(head_tree, component)
        bump = classify(base, head, touched=True)
        note = (
            "no API change"
            if bump == "patch"
            else f"{len(base - head)} removed, {len(head - base)} added"
        )
    except ProtocMissing:
        raise
    except (OSError, ValueError, subprocess.CalledProcessError) as cause:
        bump = "patch"
        note = f"could not read the API, using patch instead: {cause}"

    after = format_version(apply_bump(parse_version(before), bump))
    return Decision(component, bump, before, after, note)

def report(decisions: list[Decision]) -> None:
    width = max(len(decision.component.label) for decision in decisions)

    for decision in decisions:
        move = decision.before if decision.bump == "none" else f"{decision.before} -> {decision.after}"
        print(f"{decision.component.label:<{width}}  {decision.bump:<5}  {move:<20}  {decision.note}")

def main() -> int:
    parser = argparse.ArgumentParser(description="Bump component versions based on what actually changed.")
    parser.add_argument("--repo", default=".", type=Path)
    parser.add_argument("--base", default="HEAD^")
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--date", default=date.today().isoformat())
    arguments = parser.parse_args()

    repository = arguments.repo.resolve()

    if not revision_exists(arguments.base, repository):
        print(f"No revision {arguments.base} to compare against, nothing to version")
        return 0

    with tempfile.TemporaryDirectory(prefix="scribe-versioning-") as workspace:
        base_tree = Path(workspace) / "base" / "scribe"
        head_tree = Path(workspace) / "head" / "scribe"

        materialise(arguments.base, repository, base_tree)
        materialise(arguments.head, repository, head_tree)

        components = discover(head_tree)
        if not components:
            print("No versioned component found")
            return 0

        touched = touched_paths(arguments.base, arguments.head, repository)
        decisions = [decide(component, base_tree, head_tree, touched, repository) for component in components]

    report(decisions)

    moving = [decision for decision in decisions if decision.bump != "none"]
    overall = strongest([decision.bump for decision in decisions])

    declared_breaking = has_breaking(arguments.base, arguments.head, repository)
    if declared_breaking and overall != "major":
        print(f"\nA [BREAKING] commit says this breaks something the surface diff cannot see ({overall} -> major)")
        overall = "major"

    release = repository / "VERSION"
    before = release.read_text().strip() if release.exists() else None
    after = format_version(apply_bump(parse_version(before), overall)) if before else None

    if before:
        move = before if overall == "none" else f"{before} -> {after}"
        print(f"\nscribe as a whole: {overall}, {move}")

    if not moving:
        print("Nothing to bump")
        return 0

    if arguments.check:
        print(f"{len(moving)} version(s) would change. Run again without --check to write them.")
        return 0

    for decision in moving:
        write_version(repository, decision.component, decision.after)

    mirrored = mirror_announced(repository, [decision.component for decision in decisions])
    if mirrored:
        print(f"Mirrored into {ANNOUNCED_FILE}: {', '.join(mirrored)}")

    if before and after:
        release.write_text(f"{after}\n")
        section = render(
            after,
            arguments.date,
            entries(arguments.base, arguments.head, repository),
            [f"{d.component.label} {d.after}" for d in moving],
        )
        prepend(repository / "CHANGELOG.md", section)
        print(f"Wrote {len(moving)} version(s), scribe {after}, and the changelog entry")
        return 0

    print(f"Wrote {len(moving)} version(s)")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ProtocMissing, RuntimeError, ValueError) as cause:
        print(cause, file=sys.stderr)
        sys.exit(1)
