// Copyright (C) 2026 Fiber
//
// This Source Code Form is subject to the terms of the Mozilla Public License,
// v. 2.0. If a copy of the MPL was not distributed with this file, You can
// obtain one at https://mozilla.org/MPL/2.0/.
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
// - Combine it with files under any other licence, proprietary ones included,
//   and licence that larger work on your own terms.
//
// What you must do in return:
// - Keep this notice on every file you received it on.
// - Publish, under these same terms, the source of every file covered by them
//   that you distribute, including the ones you changed, so that whoever
//   receives your version can obtain that source.
// - Leave Fiber out of it: the name "Fiber", its branding, its logos and its
//   trademarks may not be used to endorse or promote what you build, and this
//   licence grants no right to them.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY
// OR CONDITION OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
// WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
// NON-INFRINGEMENT. IN NO EVENT SHALL FIBER BE LIABLE FOR ANY DIRECT, INDIRECT,
// INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING BUT NOT
// LIMITED TO LOSS OF USE, DATA, PROFITS, OR BUSINESS INTERRUPTION) ARISING OUT
// OF OR RELATED TO THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY
// KIND OF LEGAL CLAIM.
//
// This header is a summary written for convenience. Where it differs from the
// LICENSE file, the LICENSE file governs.

import { assertEquals, assertThrows } from "@std/assert";
import { Version, VersionError } from "../mod.ts";

Deno.test("a version reads its three numbers", () => {
  const version = Version.parse("1.2.3");
  assertEquals(
    [version.major, version.minor, version.patch],
    [1, 2, 3],
    "1.2.3 does not read as one, two, three",
  );
});

Deno.test("a version refuses a pre-release suffix", () => {
  assertThrows(
    () => Version.parse("1.2.3-beta.1"),
    VersionError,
    "is not a version",
  );
});

Deno.test("a version refuses two numbers", () => {
  assertThrows(() => Version.parse("1.2"), VersionError, "is not a version");
});

Deno.test("versions order by major, then minor, then patch", () => {
  const ordered = ["0.9.9", "1.0.0", "1.0.1", "1.1.0", "2.0.0"].map(
    Version.parse,
  );
  for (let index = 1; index < ordered.length; index++) {
    const gap = ordered[index].compareTo(ordered[index - 1]);
    assertEquals(
      gap > 0,
      true,
      `${ordered[index]} does not come after ${ordered[index - 1]}`,
    );
  }
});

Deno.test(
  "the next breaking version raises the major once there is one",
  () => {
    assertEquals(
      Version.parse("1.2.3").nextBreaking().toString(),
      "2.0.0",
      "1.2.3 breaks somewhere other than 2.0.0",
    );
  },
);

Deno.test(
  "the next breaking version raises the minor before the first major",
  () => {
    assertEquals(
      Version.parse("0.1.2").nextBreaking().toString(),
      "0.2.0",
      "0.1.2 breaks somewhere other than 0.2.0",
    );
  },
);

Deno.test(
  "the next breaking version raises the patch when nothing else is set",
  () => {
    assertEquals(
      Version.parse("0.0.3").nextBreaking().toString(),
      "0.0.4",
      "0.0.3 breaks somewhere other than 0.0.4",
    );
  },
);
