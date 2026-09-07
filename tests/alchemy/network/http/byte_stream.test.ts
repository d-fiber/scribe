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
import { equals, expect, expectLater, isA, Scribe, throwsA } from "@scribe/alchemy/test";
import { Bytes } from "@scribe/alchemy";
import { ByteStream, ClientException } from "@scribe/alchemy/http";

function chunked(...chunks: number[][]): ByteStream {
  return new ByteStream(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(new Uint8Array(chunk));
        controller.close();
      },
    }),
  );
}

Scribe.test("fromBytes carries exactly the bytes it was given", async () => {
  const stream = ByteStream.fromBytes(new Uint8Array([1, 2, 3]));
  expect(await stream.toBytes(), equals(new Uint8Array([1, 2, 3])));
});

Scribe.test("toBytes concatenates several chunks into one buffer, in order", async () => {
  const stream = chunked([1, 2], [3], [4, 5]);
  expect(await stream.toBytes(), equals(new Uint8Array([1, 2, 3, 4, 5])));
});

Scribe.test("toBytes under the cap reads the whole stream without raising", async () => {
  const stream = chunked([1, 2, 3]);
  expect(await stream.toBytes(Bytes.of(10)), equals(new Uint8Array([1, 2, 3])));
});

Scribe.test("toBytes over the cap raises a ClientException instead of reading the whole stream", async () => {
  const stream = chunked([1, 2, 3, 4, 5]);
  await expectLater(() => stream.toBytes(Bytes.of(2)), throwsA(isA(ClientException)));
});

Scribe.test("bytesToString decodes as utf-8 by default", async () => {
  const stream = ByteStream.fromBytes(new TextEncoder().encode("héllo"));
  expect(await stream.bytesToString(), equals("héllo"));
});

Scribe.test("bytesToString decodes with the encoding it is given", async () => {
  const stream = ByteStream.fromBytes(new Uint8Array([0x68, 0x69]));
  expect(await stream.bytesToString("ascii"), equals("hi"));
});

Scribe.test("stream hands back the exact ReadableStream this was built from", () => {
  const raw = new ReadableStream<Uint8Array>({ start: (c) => c.close() });
  const stream = new ByteStream(raw);

  expect(stream.stream === raw, equals(true), "the underlying stream was wrapped rather than kept as-is");
});
