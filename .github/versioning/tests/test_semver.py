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

import unittest

from versioning.semver import Version, apply_bump, classify, format_version, parse_version, strongest

class ParsingTest(unittest.TestCase):
    def test_a_version_round_trips(self) -> None:
        self.assertEqual(format_version(parse_version(" 2.0.0\n")), "2.0.0")

    def test_an_incomplete_version_is_refused(self) -> None:
        for raw in ("2.0", "v2.0.0", "", "2.0.0-rc1"):
            with self.assertRaises(ValueError):
                parse_version(raw)

class BumpTest(unittest.TestCase):
    def test_a_bump_resets_everything_below_it(self) -> None:
        version = Version(1, 2, 3)

        self.assertEqual(format_version(apply_bump(version, "major")), "2.0.0")
        self.assertEqual(format_version(apply_bump(version, "minor")), "1.3.0")
        self.assertEqual(format_version(apply_bump(version, "patch")), "1.2.4")
        self.assertEqual(format_version(apply_bump(version, "none")), "1.2.3")

    def test_the_strongest_bump_of_a_set_wins(self) -> None:
        self.assertEqual(strongest(["none", "patch", "minor"]), "minor")
        self.assertEqual(strongest(["minor", "major", "patch"]), "major")
        self.assertEqual(strongest([]), "none")

class ClassifyTest(unittest.TestCase):
    def test_removing_is_major_and_adding_is_minor(self) -> None:
        base = {"a", "b"}

        self.assertEqual(classify(base, {"a"}, True), "major")
        self.assertEqual(classify(base, {"a", "b", "c"}, True), "minor")
        self.assertEqual(classify(base, {"a", "c"}, True), "major")
        self.assertEqual(classify(base, {"a", "b"}, True), "patch")
        self.assertEqual(classify(base, {"a", "b"}, False), "none")

    def test_a_rename_reads_as_a_removal_never_as_an_addition_alone(self) -> None:
        base = {"field:Route:4:mount:14::1"}
        head = {"field:Route:4:node:9::1"}

        self.assertEqual(classify(base, head, True), "major")

if __name__ == "__main__":
    unittest.main()
