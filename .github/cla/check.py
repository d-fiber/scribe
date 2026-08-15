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
import json
import subprocess
import sys
from pathlib import Path


def run(command: list[str]) -> str:
    return subprocess.run(command, capture_output=True, text=True, check=True).stdout


def authors(base: str, head: str) -> list[tuple[str, str]]:
    log = run(["git", "log", "--no-merges", "--format=%ae%x00%an", f"{base}..{head}"])

    seen: dict[str, str] = {}
    for line in log.splitlines():
        if "\x00" not in line:
            continue
        email, name = line.split("\x00", 1)
        seen.setdefault(email.strip().lower(), name.strip())

    return sorted(seen.items())


def covered(email: str, registry: dict) -> str | None:
    exempt = registry.get("exempt", {})

    if email in {entry.lower() for entry in exempt.get("emails", [])}:
        return "exempt"

    domain = email.rpartition("@")[2]
    if domain in {entry.lower() for entry in exempt.get("domains", [])}:
        return "exempt"

    if email in {entry.get("email", "").lower() for entry in registry.get("signed", [])}:
        return "signed"

    return None


def main() -> int:
    parser = argparse.ArgumentParser(description="Refuse commits from authors who have not signed the CLA.")
    parser.add_argument("base")
    parser.add_argument("head", nargs="?", default="HEAD")
    parser.add_argument("--registry", type=Path, default=Path(__file__).parent / "signatures.json")
    arguments = parser.parse_args()

    registry = json.loads(arguments.registry.read_text())
    contributors = authors(arguments.base, arguments.head)

    if not contributors:
        print("No commit to check")
        return 0

    unsigned: list[tuple[str, str]] = []
    for email, name in contributors:
        state = covered(email, registry)
        if state is None:
            print(f"UNSIGNED  {name} <{email}>")
            unsigned.append((email, name))
        else:
            print(f"{state:8}  {name} <{email}>")

    if not unsigned:
        print(f"\nAll {len(contributors)} contributor(s) are covered")
        return 0

    if not registry.get("agreementInForce", False):
        print(
            f"\n{len(unsigned)} contributor(s) have not signed, but the agreement is not in force yet.\n"
            "See .github/cla/CLA.md. Not failing the build until the text exists.",
            file=sys.stderr,
        )
        return 0

    print(
        f"\n{len(unsigned)} contributor(s) have not signed the CLA.\n\n"
        "Fiber cannot merge a contribution it has no right to use, which is what\n"
        "an unsigned contribution is. Read .github/cla/CLA.md, then add a line to\n"
        ".github/cla/signatures.json in a pull request of its own.\n\n"
        "Contributing on behalf of an employer means the employer has to agree too.",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
