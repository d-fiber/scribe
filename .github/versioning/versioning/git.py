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
