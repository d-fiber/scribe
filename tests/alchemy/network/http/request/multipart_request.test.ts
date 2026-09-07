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
import { contains, equals, expect, expectLater, isA, Scribe, throwsA } from "@scribe/alchemy/test";
import { MultipartFile, MultipartRequest } from "@scribe/alchemy/http";

Scribe.test("contentLength matches exactly what finalize actually produces, fields and a file together", async () => {
  const request = new MultipartRequest("POST", "https://example.test/upload");
  request.fields.set("name", "ada");
  request.fields.set("café", "au lait");
  request.files.push(MultipartFile.fromBytes("avatar", new Uint8Array([1, 2, 3, 4])));

  const announced = request.contentLength;
  const produced = (await request.finalize().toBytes()).length;

  expect(produced, equals(announced), "contentLength did not match the length of the body finalize actually wrote");
});

Scribe.test("finalize writes a readable body with a field, a file and the closing boundary", async () => {
  const request = new MultipartRequest("POST", "https://example.test/upload");
  request.fields.set("name", "ada");
  request.files.push(MultipartFile.fromBytes("avatar", new TextEncoder().encode("file-bytes"), {
    filename: "a.png",
    contentType: "image/png",
  }));

  const text = await request.finalize().bytesToString();
  const boundary = /boundary=(\S+)/.exec(request.headers.get("content-type") ?? "")?.[1];

  expect(boundary !== undefined, equals(true), "no boundary was set on the content-type");
  expect(text.includes(`name="name"`), equals(true), "the field's name was not written");
  expect(text.includes("ada"), equals(true), "the field's value was not written");
  expect(text.includes(`name="avatar"; filename="a.png"`), equals(true), "the file's headers were not written");
  expect(text.includes("file-bytes"), equals(true), "the file's bytes were not written");
  expect(text.endsWith(`--${boundary}--\r\n`), equals(true), "the body did not end with the closing boundary");
});

Scribe.test("a quote or a newline in a field name is percent-escaped, not left to break the header", async () => {
  const request = new MultipartRequest("POST", "https://example.test/upload");
  request.fields.set('a"b\nc', "value");

  const text = await request.finalize().bytesToString();

  expect(text.includes("a%22b%0Ac"), equals(true), "a quote or newline in a field name was not escaped");
  expect(text.includes('a"b\nc'), equals(false), "an unescaped quote or newline reached the body");
});

Scribe.test("a quote in a filename is percent-escaped the same way", async () => {
  const request = new MultipartRequest("POST", "https://example.test/upload");
  request.files.push(MultipartFile.fromBytes("avatar", new Uint8Array([1]), { filename: 'a"b.png' }));

  const text = await request.finalize().bytesToString();

  expect(text.includes('filename="a%22b.png"'), equals(true), "a quote in a filename was not escaped");
});

Scribe.test("the same MultipartFile sent through two requests refuses the second, since it can only be sent once", async () => {
  const file = MultipartFile.fromBytes("avatar", new Uint8Array([1, 2, 3]));

  const first = new MultipartRequest("POST", "https://example.test/one");
  first.files.push(file);
  await first.finalize().toBytes();

  const second = new MultipartRequest("POST", "https://example.test/two");
  second.files.push(file);

  await expectLater(() => second.finalize().toBytes(), throwsA(isA(Error)));
});

Scribe.test("a request with no fields and no files still finalizes to a well-formed, empty body", async () => {
  const request = new MultipartRequest("POST", "https://example.test/upload");

  const text = await request.finalize().bytesToString();
  const boundary = /boundary=(\S+)/.exec(request.headers.get("content-type") ?? "")?.[1];

  expect(text, equals(`--${boundary}--\r\n`), "an empty multipart body carried more than the closing boundary");
});

Scribe.test("finalize sets a multipart/form-data content-type carrying the drawn boundary", () => {
  const request = new MultipartRequest("POST", "https://example.test/upload");
  request.finalize();

  expect(
    request.headers.get("content-type"),
    contains("multipart/form-data; boundary="),
    "finalize did not set a multipart content-type carrying a boundary",
  );
});
