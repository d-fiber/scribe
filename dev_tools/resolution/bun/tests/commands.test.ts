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

import "@scribe/runtime/scholium/runner.ts";
import { equals, expect, expectLater, isA, Scribe, throwsA } from "@scribe/alchemy/test";
import { LocalCommands } from "@scribe/runtime/scholium/bun/commands.ts";

function text(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

Scribe.test("a program that exits zero answers its stdout and an empty stderr", async () => {
  const result = await new LocalCommands().run("echo", ["hello", "scholium"]);

  expect(result.code, equals(0));
  expect(text(result.stdout).trim(), equals("hello scholium"));
  expect(text(result.stderr), equals(""));
});

Scribe.test("a program that exits non-zero answers its code rather than throwing", async () => {
  const result = await new LocalCommands().run("false", []);

  expect(result.code, equals(1));
});

Scribe.test("stdin is fed to the program only when the caller gives one", async () => {
  const result = await new LocalCommands().run("cat", [], { stdin: new TextEncoder().encode("piped in") });

  expect(text(result.stdout), equals("piped in"));
});

Scribe.test("a program the platform cannot find refuses rather than answering a code", async () => {
  await expectLater(
    () => new LocalCommands().run("scholium-test-program-that-does-not-exist", []),
    throwsA(isA(Error)),
  );
});
