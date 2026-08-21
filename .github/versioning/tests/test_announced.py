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

import json
import tempfile
import unittest
from pathlib import Path

from versioning.components import ANNOUNCED_FILE, discover, mirror_announced

ANNOUNCED_SOURCE = """export const PROTOCOL_VERSION = "1.0.0";

export const SDK_VERSION = "0.0.1";

export const WORKER_LANGUAGE = "js";
"""


def tree(protocol: str, sdk: str) -> Path:
    root = Path(tempfile.mkdtemp(prefix="scribe-announced-"))

    (root / "protocol").mkdir()
    (root / "protocol" / "VERSION").write_text(f"{protocol}\n")

    package = root / "sdk" / "js"
    (package / "src" / "protocol").mkdir(parents=True)
    (package / "deno.json").write_text(
        json.dumps({"name": "@scribe/sdk", "version": sdk, "exports": "./mod.ts"}),
    )
    (root / ANNOUNCED_FILE).write_text(ANNOUNCED_SOURCE)

    return root


class MirrorAnnouncedTest(unittest.TestCase):
    def test_it_takes_both_versions_from_the_files_that_own_them(self) -> None:
        root = tree("2.0.1", "0.1.2")

        mirrored = mirror_announced(root, discover(root))

        source = (root / ANNOUNCED_FILE).read_text()
        self.assertIn('export const PROTOCOL_VERSION = "2.0.1";', source)
        self.assertIn('export const SDK_VERSION = "0.1.2";', source)
        self.assertEqual(mirrored, ["PROTOCOL_VERSION 2.0.1", "SDK_VERSION 0.1.2"])

    def test_it_leaves_everything_else_in_the_file_alone(self) -> None:
        root = tree("2.0.1", "0.1.2")

        mirror_announced(root, discover(root))

        self.assertIn('export const WORKER_LANGUAGE = "js";', (root / ANNOUNCED_FILE).read_text())

    def test_a_version_that_did_not_move_is_written_back_the_same(self) -> None:
        root = tree("1.0.0", "0.0.1")

        mirror_announced(root, discover(root))

        self.assertIn('export const PROTOCOL_VERSION = "1.0.0";', (root / ANNOUNCED_FILE).read_text())

    def test_a_constant_the_file_does_not_declare_is_an_error(self) -> None:
        root = tree("2.0.1", "0.1.2")
        (root / ANNOUNCED_FILE).write_text('export const WORKER_LANGUAGE = "js";\n')

        with self.assertRaises(ValueError):
            mirror_announced(root, discover(root))

    def test_a_tree_without_the_file_is_left_alone(self) -> None:
        root = tree("2.0.1", "0.1.2")
        (root / ANNOUNCED_FILE).unlink()

        self.assertEqual(mirror_announced(root, discover(root)), [])
