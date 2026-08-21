# Copyright (C) 2026 Fiber
#
# This Source Code Form is subject to the terms of the Mozilla Public License,
# v. 2.0. If a copy of the MPL was not distributed with this file, You can
# obtain one at https://mozilla.org/MPL/2.0/.
#
# What you may do:
# - Use this software for any purpose, including commercially, and build and
#   sell your own products on top of it.
# - Change it, and create new works based on it.
# - Distribute copies of it, with or without your changes.
# - Combine it with files under any other licence, proprietary ones included,
#   and licence that larger work on your own terms.
#
# What you must do in return:
# - Keep this notice on every file you received it on.
# - Publish, under these same terms, the source of every file covered by them
#   that you distribute, including the ones you changed, so that whoever
#   receives your version can obtain that source.
# - Leave Fiber out of it: the name "Fiber", its branding, its logos and its
#   trademarks may not be used to endorse or promote what you build, and this
#   licence grants no right to them.
#
# Disclaimer:
# AS FAR AS THE LAW ALLOWS, THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY
# OR CONDITION OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
# WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
# NON-INFRINGEMENT. IN NO EVENT SHALL FIBER BE LIABLE FOR ANY DIRECT, INDIRECT,
# INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING BUT NOT
# LIMITED TO LOSS OF USE, DATA, PROFITS, OR BUSINESS INTERRUPTION) ARISING OUT
# OF OR RELATED TO THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY
# KIND OF LEGAL CLAIM.
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
