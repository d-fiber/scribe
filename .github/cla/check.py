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

import argparse
import json
import subprocess
import sys
from pathlib import Path


def run(command: list[str]) -> str:
    return subprocess.run(command, capture_output=True, text=True, check=True).stdout


def commit(revision: str) -> bool:
    return subprocess.run(["git", "cat-file", "-e", f"{revision}^{{commit}}"], capture_output=True).returncode == 0


def authors(base: str, head: str) -> list[tuple[str, str]]:
    # A base that is not a commit is the first push of a branch, where GitHub sends all zeros, and
    # a force push that replaced the old tip with an unrelated one. Both mean the same thing here:
    # every commit up to head is new, so that is what gets read.
    span = f"{base}..{head}" if commit(base) else head
    log = run(["git", "log", "--no-merges", "--format=%ae%x00%an", span])

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
            f"\n{len(unsigned)} contributor(s) have not signed, and the agreement is not in force.\n"
            "The text in .github/cla/CLA.md is an adaptation of the Apache ICLA that no lawyer\n"
            "has read, and it still has two blanks: the company and its seat in clause 1, and\n"
            "the governing law and venue in clause 10. Nobody is asked to sign that. Arming it\n"
            "means filling those in and having the text reviewed, or pointing at a hosted\n"
            "agreement the way Flutter points at Google's.",
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
