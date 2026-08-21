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
from pathlib import Path

from .git import run

SUBJECT = re.compile(r"^\[([A-Z]+)\]:\s*(.+)$")

HEADINGS: dict[str, str] = {
    "BREAKING": "Breaking",
    "DEV": "Added",
    "BUGFIX": "Fixed",
    "PERF": "Performance",
    "SECURITY": "Security",
    "REFACTO": "Changed",
    "REVERT": "Reverted",
    "DOC": "Documentation",
    "TEST": "Tests",
    "CI": "Tooling",
    "CHORE": "Tooling",
    "RELEASE": None,
}

ORDER = ["Breaking", "Added", "Fixed", "Security", "Performance", "Changed", "Reverted", "Documentation", "Tests", "Tooling"]

PREAMBLE = """# Changelog

Every entry comes from a commit subject. Versions are not written by hand:
`.github/versioning/bump.py` compares the public surface of each component and
decides what the change is worth.
"""

@dataclass(frozen=True)
class Entry:
    heading: str
    subject: str
    commit: str

def entries(base: str, head: str, repository: Path) -> list[Entry]:
    log = run(["git", "log", "--no-merges", "--format=%H%x00%s", f"{base}..{head}"], cwd=repository)

    collected: list[Entry] = []
    for line in log.splitlines():
        if "\x00" not in line:
            continue
        commit, subject = line.split("\x00", 1)
        match = SUBJECT.match(subject.strip())
        if match is None:
            continue

        heading = HEADINGS.get(match.group(1))
        if heading is None:
            continue

        collected.append(Entry(heading, match.group(2).strip(), commit[:8]))

    return collected

def has_breaking(base: str, head: str, repository: Path) -> bool:
    log = run(["git", "log", "--no-merges", "--format=%s", f"{base}..{head}"], cwd=repository)

    return any(SUBJECT.match(line.strip()) and SUBJECT.match(line.strip()).group(1) == "BREAKING" for line in log.splitlines())


def render(version: str, date: str, collected: list[Entry], moved: list[str]) -> str:
    if not collected and not moved:
        return ""

    lines = [f"## {version} ({date})", ""]

    if moved:
        lines.append("Component versions: " + ", ".join(moved))
        lines.append("")

    grouped: dict[str, list[Entry]] = {}
    for entry in collected:
        grouped.setdefault(entry.heading, []).append(entry)

    for heading in ORDER:
        if heading not in grouped:
            continue
        lines.append(f"### {heading}")
        lines.append("")
        for entry in grouped[heading]:
            lines.append(f"- {entry.subject} ({entry.commit})")
        lines.append("")

    return "\n".join(lines)

def prepend(path: Path, section: str) -> None:
    if not section:
        return

    existing = path.read_text() if path.exists() else PREAMBLE

    if existing.startswith("# Changelog"):
        head, _, tail = existing.partition("\n")
        preamble_end = tail.find("\n## ")
        if preamble_end == -1:
            body = ""
            preamble = tail
        else:
            preamble = tail[:preamble_end]
            body = tail[preamble_end + 1 :]
        path.write_text(f"{head}\n{preamble.rstrip()}\n\n{section.rstrip()}\n\n{body.lstrip()}".rstrip() + "\n")
        return

    path.write_text(f"{PREAMBLE}\n{section.rstrip()}\n\n{existing.lstrip()}".rstrip() + "\n")
