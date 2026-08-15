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

import tempfile
import unittest
from pathlib import Path

from versioning.proto import proto_surface
from versioning.semver import classify

BASE = """syntax = "proto3";
package scribe.v1;

enum Mount {
  MOUNT_UNSPECIFIED = 0;
  MOUNT_ADMIN = 1;
}

message Route {
  string path = 1;
  Mount mount = 4;
}

service Worker {
  rpc Invoke(Route) returns (Route);
}
"""

WITHOUT_MOUNT = """syntax = "proto3";
package scribe.v1;

message Route {
  string path = 1;
  reserved 4;
  string node = 11;
}

service Worker {
  rpc Invoke(Route) returns (Route);
}
"""

class ProtoSurfaceTest(unittest.TestCase):
    def surface(self, body: str) -> set[str]:
        workspace = tempfile.mkdtemp(prefix="scribe-proto-")
        root = Path(workspace) / "scribe"
        (root / "protocol").mkdir(parents=True)
        (root / "protocol" / "sample.proto").write_text(body)
        return proto_surface(root)

    def test_an_added_field_is_minor(self) -> None:
        head = BASE.replace("  Mount mount = 4;", "  Mount mount = 4;\n  string owner = 5;")

        self.assertEqual(classify(self.surface(BASE), self.surface(head), True), "minor")

    def test_an_added_rpc_is_minor(self) -> None:
        head = BASE.replace(
            "  rpc Invoke(Route) returns (Route);",
            "  rpc Invoke(Route) returns (Route);\n  rpc Describe(Route) returns (Route);",
        )

        self.assertEqual(classify(self.surface(BASE), self.surface(head), True), "minor")

    def test_dropping_an_enum_the_way_mount_was_dropped_is_major(self) -> None:
        self.assertEqual(classify(self.surface(BASE), self.surface(WITHOUT_MOUNT), True), "major")

    def test_renumbering_a_field_is_major(self) -> None:
        head = BASE.replace("string path = 1;", "string path = 2;")

        self.assertEqual(classify(self.surface(BASE), self.surface(head), True), "major")

    def test_reformatting_is_only_a_patch(self) -> None:
        head = BASE.replace("\n\n", "\n\n\n")

        self.assertEqual(classify(self.surface(BASE), self.surface(head), True), "patch")

    def test_the_decoder_reads_what_protoc_emitted(self) -> None:
        surface = self.surface(BASE)

        self.assertIn("message:scribe.v1.Route", surface)
        self.assertIn("enum:scribe.v1.Mount", surface)
        self.assertIn("enumvalue:scribe.v1.Mount:1:MOUNT_ADMIN", surface)
        self.assertIn("service:scribe.v1.Worker", surface)
        self.assertIn(
            "method:scribe.v1.Worker:Invoke:.scribe.v1.Route:.scribe.v1.Route",
            surface,
        )
        self.assertIn("field:scribe.v1.Route:1:path:9::1", surface)

if __name__ == "__main__":
    unittest.main()
