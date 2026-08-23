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

import {
  contains,
  equals,
  expect,
  expectLater,
  having,
  isA,
  isFalse,
  isNotNull,
  isTrue,
  MemoryFileSystemDriver,
  MissingFileError,
  throwsA,
} from "../../src/test/mod.ts";
import { Bytes, FileSystems, ScribeError } from "../../mod.ts";

function opened() {
  return new MemoryFileSystemDriver().open();
}

Deno.test("a file hands back the text it was given", async () => {
  const disk = opened();
  await disk.writeText("/lib/audience.ts", "export const held = 1;");

  expect(
    await disk.readText("/lib/audience.ts"),
    equals("export const held = 1;"),
    "the file gave back something else",
  );
});

Deno.test("a file hands back a copy, so nobody edits what is held by writing into it", async () => {
  const disk = opened();
  await disk.write("/held", new Uint8Array([1, 2]));

  const taken = await disk.read("/held");
  taken[0] = 9;

  expect((await disk.read("/held"))[0], equals(1), "editing what was read changed what is held");
});

Deno.test("reading a path nothing is held at refuses instead of answering nothing", async () => {
  await expectLater(
    () => opened().read("/gone"),
    throwsA(having(isA(MissingFileError), (raised) => raised.message, "message", contains("/gone"))),
  );
});

Deno.test("a refusal of this port descends from ScribeError, so a caller can tell it apart", async () => {
  await expectLater(() => opened().readText("/gone"), throwsA(isA(MissingFileError)));
  await expectLater(
    () => opened().readText("/gone"),
    throwsA(isA(ScribeError)),
    "a refusal of this port does not descend from ScribeError",
  );
});

Deno.test("describing a path nothing is held at answers nothing rather than refusing", async () => {
  expect(await opened().describe("/gone"), equals(null), "describing a missing path did not answer null");
});

Deno.test("describing a file says what it is and how much it holds", async () => {
  const disk = opened();
  await disk.writeText("/held", "abc");

  const entry = await disk.describe("/held");

  expect(entry, isNotNull, "a file that was written cannot be described");
  expect(entry!.isFile, isTrue, "a file was not described as one");
  expect(entry!.isDirectory, isFalse, "a file was described as a directory");
  expect(entry!.size.inBytes, equals(Bytes.of(3).inBytes), "a file of three bytes was measured otherwise");
});

Deno.test("writing a file makes the directories above it without being asked", async () => {
  const disk = opened();
  await disk.writeText("/lib/src/db/tables.ts", "");

  const entry = await disk.describe("/lib/src");

  expect(entry, isNotNull, "the directory above a written file was not made");
  expect(entry!.isDirectory, isTrue, "the directory above a written file is not a directory");
});

Deno.test("a directory lists what is directly under it and nothing deeper", async () => {
  const disk = opened();
  await disk.writeText("/lib/audience.ts", "");
  await disk.writeText("/lib/src/key.ts", "");

  const names = (await disk.list("/lib")).map((entry) => entry!.name).sort();

  expect(names, equals(["audience.ts", "src"]), "a directory listed something other than what is under it");
});

Deno.test("listing what holds bytes refuses", async () => {
  const disk = opened();
  await disk.writeText("/held", "");

  await expectLater(
    () => disk.list("/held"),
    throwsA(having(isA(MissingFileError), (raised) => raised.message, "message", contains("bytes"))),
  );
});

Deno.test("removing a directory takes everything under it", async () => {
  const disk = opened();
  await disk.writeText("/lib/src/key.ts", "");
  await disk.writeText("/lib/audience.ts", "");

  await disk.remove("/lib/src");

  expect(await disk.describe("/lib/src/key.ts"), equals(null), "a file under a removed directory is still held");
  expect(await disk.describe("/lib/audience.ts"), isNotNull, "a sibling of a removed directory went with it");
});

Deno.test("removing a path nothing is held at does nothing rather than refusing", async () => {
  await opened().remove("/gone");
});

Deno.test("a temporary path is one nothing else was given", async () => {
  const disk = opened();

  const first = await disk.temporaryFile();
  const second = await disk.temporaryFile();

  expect(first !== second, isTrue, "two temporary files were given the same path");
  expect(await disk.readText(first), equals(""), "a temporary file was not made empty");
});

Deno.test("a driver hands back the same file system every time it is opened", () => {
  const driver = new MemoryFileSystemDriver();

  expect(driver.open() === driver.open(), isTrue, "opening twice gave two different file systems");
});

Deno.test("a package reaches a file through the slot the host filled", async () => {
  const driver = new MemoryFileSystemDriver();
  await driver.open().writeText("/package.yaml", "name: audience\n");

  FileSystems.use(driver);

  expect(
    await FileSystems.get().open().readText("/package.yaml"),
    equals("name: audience\n"),
    "reading through the slot gave something else",
  );
});
