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
