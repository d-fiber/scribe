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

import re
from dataclasses import dataclass
from typing import Iterable, Literal

Bump = Literal["none", "patch", "minor", "major"]

RANK: dict[str, int] = {"none": 0, "patch": 1, "minor": 2, "major": 3}

PATTERN = re.compile(r"^(\d+)\.(\d+)\.(\d+)$")

@dataclass(frozen=True)
class Version:
    major: int
    minor: int
    patch: int

def parse_version(raw: str) -> Version:
    match = PATTERN.match(raw.strip())
    if match is None:
        raise ValueError(f"not a semver version: {raw!r}")

    return Version(int(match.group(1)), int(match.group(2)), int(match.group(3)))

def format_version(version: Version) -> str:
    return f"{version.major}.{version.minor}.{version.patch}"

def apply_bump(version: Version, bump: Bump) -> Version:
    if bump == "major":
        return Version(version.major + 1, 0, 0)
    if bump == "minor":
        return Version(version.major, version.minor + 1, 0)
    if bump == "patch":
        return Version(version.major, version.minor, version.patch + 1)
    return version

def strongest(bumps: Iterable[Bump]) -> Bump:
    held: Bump = "none"
    for candidate in bumps:
        if RANK[candidate] > RANK[held]:
            held = candidate
    return held

def classify(base: set[str], head: set[str], touched: bool) -> Bump:
    if base - head:
        return "major"
    if head - base:
        return "minor"
    return "patch" if touched else "none"
