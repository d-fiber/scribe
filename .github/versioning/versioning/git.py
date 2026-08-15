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

import subprocess
from pathlib import Path

def run(command: list[str], cwd: Path | str | None = None) -> str:
    completed = subprocess.run(
        command,
        cwd=str(cwd) if cwd is not None else None,
        capture_output=True,
        text=True,
        check=True,
    )
    return completed.stdout

def revision_exists(revision: str, repository: Path) -> bool:
    try:
        run(["git", "rev-parse", "--verify", f"{revision}^{{commit}}"], cwd=repository)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def materialise(revision: str, repository: Path, destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)

    archive = subprocess.Popen(
        ["git", "archive", "--format=tar", revision],
        cwd=str(repository),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    extract = subprocess.Popen(
        ["tar", "-x", "-C", str(destination)],
        stdin=archive.stdout,
        stderr=subprocess.PIPE,
    )

    if archive.stdout is not None:
        archive.stdout.close()

    extract.communicate()
    archive.wait()

    if archive.returncode != 0 or extract.returncode != 0:
        raise RuntimeError(f"could not materialise {revision} into {destination}")

def touched_paths(base: str, head: str, repository: Path) -> list[str]:
    output = run(["git", "diff", "--name-only", f"{base}..{head}"], cwd=repository)
    return [line.strip() for line in output.splitlines() if line.strip()]
