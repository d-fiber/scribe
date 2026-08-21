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
import { Constraint, Version, VersionError } from "../mod.ts";

function allows(constraint: string, version: string): boolean {
  return Constraint.parse(constraint).allows(Version.parse(version));
}

Deno.test("a caret constraint accepts its own version", () => {
  assertEquals(allows("^1.2.3", "1.2.3"), true, "^1.2.3 refuses 1.2.3");
});

Deno.test("a caret constraint stops below the next major", () => {
  assertEquals(allows("^1.2.3", "1.9.9"), true, "^1.2.3 refuses 1.9.9");
  assertEquals(allows("^1.2.3", "2.0.0"), false, "^1.2.3 accepts 2.0.0");
});

Deno.test("a caret constraint below one stops at the next minor", () => {
  assertEquals(allows("^0.1.2", "0.1.9"), true, "^0.1.2 refuses 0.1.9");
  assertEquals(allows("^0.1.2", "0.2.0"), false, "^0.1.2 accepts 0.2.0");
});

Deno.test("an exact constraint accepts that version and no other", () => {
  assertEquals(allows("1.2.3", "1.2.3"), true, "1.2.3 refuses itself");
  assertEquals(allows("1.2.3", "1.2.4"), false, "1.2.3 accepts 1.2.4");
});

Deno.test("bounds written side by side narrow each other", () => {
  assertEquals(
    allows(">=1.0.0 <2.0.0", "1.5.0"),
    true,
    ">=1.0.0 <2.0.0 refuses 1.5.0",
  );
  assertEquals(
    allows(">=1.0.0 <2.0.0", "2.0.0"),
    false,
    ">=1.0.0 <2.0.0 accepts 2.0.0",
  );
});

Deno.test("any accepts every version", () => {
  assertEquals(allows("any", "0.0.1"), true, "any refuses 0.0.1");
});

Deno.test("a constraint refuses a bound it cannot read", () => {
  assertThrows(
    () => Constraint.parse("~1.2.3"),
    VersionError,
    "is not a bound",
  );
});

Deno.test("two caret constraints on the same major meet", () => {
  const met = Constraint.parse("^1.2.0").intersect(Constraint.parse("^1.4.0"));
  assertEquals(
    met?.allows(Version.parse("1.4.0")),
    true,
    "^1.2.0 and ^1.4.0 refuse 1.4.0",
  );
  assertEquals(
    met?.allows(Version.parse("1.3.0")),
    false,
    "^1.2.0 and ^1.4.0 accept 1.3.0",
  );
});

Deno.test("two caret constraints on different majors meet nowhere", () => {
  assertEquals(
    Constraint.parse("^1.0.0").intersect(Constraint.parse("^2.0.0")),
    null,
    "^1.0.0 and ^2.0.0 leave something to pick",
  );
});

Deno.test("a constraint keeps the text it was written as", () => {
  assertEquals(
    Constraint.parse("^1.2.3").toString(),
    "^1.2.3",
    "the constraint is shown as something else",
  );
});
