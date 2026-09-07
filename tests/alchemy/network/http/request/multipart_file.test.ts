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
import { equals, expect, isA, Scribe, throwsA } from "@scribe/alchemy/test";
import { MultipartFile } from "@scribe/alchemy/http";

Scribe.test("fromBytes carries the field, the bytes and their length, with no filename or a default content type", () => {
  const file = MultipartFile.fromBytes("avatar", new Uint8Array([1, 2, 3]));

  expect(file.field, equals("avatar"));
  expect(file.length, equals(3));
  expect(file.filename, equals(null));
  expect(file.contentType, equals("application/octet-stream"));
});

Scribe.test("fromBytes carries the filename and content type when given", () => {
  const file = MultipartFile.fromBytes("avatar", new Uint8Array([1]), {
    filename: "a.png",
    contentType: "image/png",
  });

  expect(file.filename, equals("a.png"));
  expect(file.contentType, equals("image/png"));
});

Scribe.test("fromString encodes the text as utf-8 and defaults to a text content type", async () => {
  const file = MultipartFile.fromString("note", "héllo");

  expect(file.contentType, equals("text/plain; charset=utf-8"));
  expect(file.length, equals(new TextEncoder().encode("héllo").length));
  expect(await file.finalize().toBytes(), equals(new TextEncoder().encode("héllo")));
});

Scribe.test("fromString lets a given content type override the default", () => {
  const file = MultipartFile.fromString("note", "hello", { contentType: "text/markdown" });
  expect(file.contentType, equals("text/markdown"));
});

Scribe.test("finalize hands back the bytes once, and refuses a second call", () => {
  const file = MultipartFile.fromBytes("avatar", new Uint8Array([1, 2, 3]));

  file.finalize();

  expect(() => file.finalize(), throwsA(isA(Error)));
});
