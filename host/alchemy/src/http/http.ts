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
import type { Client, RequestOptions } from "./client/client.ts";
import { Clients } from "./client/clients.ts";
import type { HttpResponse } from "./response/response.ts";

/**
 * The one-off calls, and the way to take a client when one call is not enough.
 *
 * @remarks
 * Each of the eight verbs opens a client, runs one exchange and closes it, so nothing is left
 * holding a connection that nobody remembers taking. With a pooling client that costs nothing
 * measurable, because the pool lives behind the client and not in it.
 *
 * What the shape decides is ownership rather than speed. A client that really holds something,
 * one that retries or logs or pools per instance, is worth keeping across calls, and a one-off
 * function gives it no chance to. That is what {@link Http.open} is for.
 */
export interface Http {
  /** Sends a one-off HEAD. */
  head(url: URL | string, options?: RequestOptions): Future<HttpResponse>;

  /** Sends a one-off GET. */
  get(url: URL | string, options?: RequestOptions): Future<HttpResponse>;

  /** Sends a one-off POST. */
  post(url: URL | string, options?: RequestOptions): Future<HttpResponse>;

  /** Sends a one-off PUT. */
  put(url: URL | string, options?: RequestOptions): Future<HttpResponse>;

  /** Sends a one-off PATCH. */
  patch(url: URL | string, options?: RequestOptions): Future<HttpResponse>;

  /**
   * Sends a one-off DELETE.
   *
   * It is spelled in full, unlike the free function it replaces, because a member may be named
   * after a reserved word where a function may not.
   */
  delete(url: URL | string, options?: RequestOptions): Future<HttpResponse>;

  /** Gets `url` and answers its body as text, throwing on any status but a 2xx. */
  read(url: URL | string, options?: RequestOptions): Future<string>;

  /** Gets `url` and answers its body as bytes, throwing on any status but a 2xx. */
  readBytes(url: URL | string, options?: RequestOptions): Future<Uint8Array>;

  /**
   * Opens a client the caller owns, and has to close.
   *
   * @remarks
   * It is what the eight verbs are not for: several exchanges that should share whatever the
   * client holds, and a streamed answer, which outlives the call that started it and would be cut
   * off by a client closed underneath it.
   *
   * ```ts
   * const client = http.open();
   * try {
   *   const answer = await client.send(request);
   *   await drain(answer.stream);
   * } finally {
   *   client.close();
   * }
   * ```
   */
  open(): Client;
}

/** Opens a client, runs one exchange through it, and closes it whatever the exchange did. */
async function once<T>(call: (client: Client) => Future<T>): Future<T> {
  const client = Clients.get().open();
  try {
    return await call(client);
  } finally {
    client.close();
  }
}

/**
 * How a call goes out.
 *
 * @example
 * ```ts
 * const answer = await http.get("https://example.test/health");
 * const body = await http.read("https://example.test/version");
 * ```
 */
export const http: Http = {
  head: (url, options) => once((client) => client.head(url, options)),
  get: (url, options) => once((client) => client.get(url, options)),
  post: (url, options) => once((client) => client.post(url, options)),
  put: (url, options) => once((client) => client.put(url, options)),
  patch: (url, options) => once((client) => client.patch(url, options)),
  delete: (url, options) => once((client) => client.delete(url, options)),
  read: (url, options) => once((client) => client.read(url, options)),
  readBytes: (url, options) => once((client) => client.readBytes(url, options)),
  open: () => Clients.get().open(),
};
