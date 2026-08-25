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

import type { Future } from "../async/future.ts";
import type { Bytes } from "../value/bytes.ts";
import { ClientException } from "./exception.ts";

/**
 * A stream of bytes, with the two ways of draining it that a caller ever wants.
 *
 * It wraps a `ReadableStream` rather than replacing it: {@link stream} hands the underlying
 * one back, so anything that already speaks the platform's streams keeps working.
 */
export class ByteStream {
  /** The underlying stream. */
  readonly stream: ReadableStream<Uint8Array>;

  constructor(stream: ReadableStream<Uint8Array>) {
    this.stream = stream;
  }

  /** A stream carrying `bytes` and nothing else. */
  static fromBytes(bytes: Uint8Array): ByteStream {
    return new ByteStream(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(bytes);
          controller.close();
        },
      }),
    );
  }

  /**
   * Collects the whole stream into one buffer.
   *
   * @remarks
   * A body is read into memory whole, so how much of it there is decides how much memory this
   * process uses. `cap` is what keeps that decision on this side of the connection rather than on
   * the far side's.
   *
   * @param cap - The most to read. Everything, when left out.
   *
   * @throws {ClientException} When the stream carries more than `cap`.
   */
  async toBytes(cap?: Bytes): Future<Uint8Array> {
    const chunks: Uint8Array[] = [];
    let total = 0;

    for await (const chunk of this.stream) {
      chunks.push(chunk);
      total += chunk.length;
      if (cap !== undefined && total > cap.inBytes) {
        throw new ClientException(`The answer carried more than ${cap}, which is the most this call reads.`, null);
      }
    }

    const collected = new Uint8Array(total);
    let at = 0;
    for (const chunk of chunks) {
      collected.set(chunk, at);
      at += chunk.length;
    }
    return collected;
  }

  /** Collects the whole stream and decodes it, utf-8 unless told otherwise. */
  async bytesToString(encoding = "utf-8"): Future<string> {
    return new TextDecoder(encoding).decode(await this.toBytes());
  }
}
