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

import "@scribe/scholium/runner.ts";
import {
  contains,
  equals,
  expect,
  expectLater,
  having,
  isA,
  isNot,
  MemoryFileSystem,
  MemoryFileSystemDriver,
  MissingFileError,
  same,
  Scribe,
  throwsA,
} from "@scribe/alchemy/test";

Scribe.test("reading a path nothing was written to refuses", async () => {
  const disk = new MemoryFileSystem();

  await expectLater(
    () => disk.read("/missing"),
    throwsA(having(isA(MissingFileError), (raised) => raised.message, "message", contains('"/missing"'))),
  );
});

Scribe.test("readText refuses the same way read does, on a path nothing was written to", async () => {
  const disk = new MemoryFileSystem();

  await expectLater(() => disk.readText("/missing"), throwsA(isA(MissingFileError)));
});

Scribe.test("readText decodes what write held as utf-8", async () => {
  const disk = new MemoryFileSystem();
  await disk.writeText("/notes.txt", "héllo");

  expect(await disk.readText("/notes.txt"), equals("héllo"));
});

Scribe.test("writing a deep path makes every directory above it appear", async () => {
  const disk = new MemoryFileSystem();

  await disk.write("/a/b/c", new Uint8Array([1]));

  const atRoot = await disk.list("/");
  expect(atRoot.some((entry) => entry.name === "a" && entry.isDirectory), equals(true));

  const underA = await disk.list("/a");
  expect(underA.some((entry) => entry.name === "b" && entry.isDirectory), equals(true));
});

Scribe.test("listing a path that holds bytes refuses instead of answering entries", async () => {
  const disk = new MemoryFileSystem();
  await disk.write("/file", new Uint8Array([1]));

  await expectLater(
    () => disk.list("/file"),
    throwsA(having(isA(MissingFileError), (raised) => raised.message, "message", contains("holds bytes"))),
  );
});

Scribe.test("describe answers null for a path nothing holds", async () => {
  const disk = new MemoryFileSystem();

  expect(await disk.describe("/missing"), equals(null));
});

Scribe.test("describe answers a file for a path holding bytes", async () => {
  const disk = new MemoryFileSystem();
  await disk.write("/file", new Uint8Array([1, 2, 3]));

  const described = await disk.describe("/file");

  expect(described?.isFile, equals(true));
  expect(described?.isDirectory, equals(false));
});

Scribe.test("describe answers a directory for a path made only of sub-entries", async () => {
  const disk = new MemoryFileSystem();
  await disk.write("/a/file", new Uint8Array([1]));

  const described = await disk.describe("/a");

  expect(described?.isFile, equals(false));
  expect(described?.isDirectory, equals(true));
});

Scribe.test("removing a directory removes everything under it", async () => {
  const disk = new MemoryFileSystem();
  await disk.write("/a/one", new Uint8Array([1]));
  await disk.write("/a/two", new Uint8Array([2]));

  await disk.remove("/a");

  expect(await disk.describe("/a/one"), equals(null));
  expect(await disk.describe("/a/two"), equals(null));
  expect(await disk.describe("/a"), equals(null));
});

Scribe.test("removing a path nothing holds costs nothing", async () => {
  const disk = new MemoryFileSystem();

  await disk.remove("/never-written");
});

Scribe.test("temporaryFile answers a fresh, already readable, empty path on every call", async () => {
  const disk = new MemoryFileSystem();

  const first = await disk.temporaryFile();
  const second = await disk.temporaryFile();

  expect(first, isNot(equals(second)));
  expect(await disk.readText(first), equals(""));
});

Scribe.test("temporaryDirectory answers a fresh, already made path on every call", async () => {
  const disk = new MemoryFileSystem();

  const first = await disk.temporaryDirectory();
  const second = await disk.temporaryDirectory();

  expect(first, isNot(equals(second)));
  const described = await disk.describe(first);
  expect(described?.isDirectory, equals(true));
});

Scribe.test("a driver hands back the same file system on every call", async () => {
  const driver = new MemoryFileSystemDriver();

  const first = driver.open();
  const second = driver.open();
  expect(first, same(second));

  await first.writeText("/note", "written through the first reference");
  expect(await second.readText("/note"), equals("written through the first reference"));
});
