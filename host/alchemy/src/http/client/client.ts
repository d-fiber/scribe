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

import type { Future } from "../../async/future.ts";
import { Duration } from "../../value/duration.ts";
import { Bytes } from "../../value/bytes.ts";
import type { BaseRequest } from "../request/base_request.ts";
import type { HttpResponse } from "../response/response.ts";
import type { StreamedResponse } from "../response/streamed_response.ts";

/** What a body may be given as on a convenience method. */
export type RequestBody = string | Uint8Array | Record<string, string> | null;

/** The options every convenience method takes. */
export interface RequestOptions {
  /**
   * Headers to send with the request.
   *
   * A `content-type` set here is never overwritten by the one {@link body} would have
   * implied, which is how a caller sends JSON.
   */
  readonly headers?: HeadersInit;

  /**
   * What to send as the body, whose shape decides the content-type.
   *
   * A record goes out as `application/x-www-form-urlencoded`, a string as `text/plain`, and
   * bytes as they are with no type announced. A verb that cannot carry a body drops it.
   */
  readonly body?: RequestBody;

  /**
   * How the body is encoded, and what charset its content-type announces. Utf-8 unless said
   * otherwise. It says nothing about the answer, which is decoded from the charset the server
   * announced.
   */
  readonly encoding?: string;

  /**
   * How long to wait for the whole exchange. {@link DEFAULT_REQUEST_TIMEOUT} unless said otherwise.
   *
   * @remarks
   * A request that runs out of time fails with a {@link ClientException} like any other exchange
   * that never happened. The caller does not have to tell an abort apart from a refused connection,
   * because there is nothing different to do about either.
   *
   * The default is finite on purpose: an unbounded call holds a worker and a connection for as long
   * as the far side keeps the socket open, which is the shape a slow dependency uses to take a
   * service down with it.
   */
  readonly timeout?: Duration;

  /**
   * What to do with a redirect. {@link DEFAULT_REDIRECT} unless said otherwise.
   *
   * @remarks
   * The default refuses rather than follows, because a caller that means to follow one knows why,
   * and a caller that does not is usually asking for an address somebody else chose. Following it
   * carries whatever headers the request set, this call's own credentials included, to a host the
   * caller never named.
   */
  readonly redirect?: "error" | "follow" | "manual";

  /** How many redirects to follow before giving up, when `redirect` is `"follow"`. */
  readonly maxRedirects?: number;

  /**
   * The most of a body to read before giving up. {@link DEFAULT_MAX_RESPONSE} unless said otherwise.
   *
   * @remarks
   * A body is read into memory whole, so a far side that never stops writing is a far side that
   * decides how much memory this process uses.
   */
  readonly maxResponseBytes?: Bytes;
}

/** How long an exchange has when nothing said otherwise. */
export const DEFAULT_REQUEST_TIMEOUT: Duration = Duration.seconds(30);

/** What happens to a redirect when nothing said otherwise. */
export const DEFAULT_REDIRECT: "error" | "follow" | "manual" = "error";

/** The most of a body that is read when nothing said otherwise. */
export const DEFAULT_MAX_RESPONSE: Bytes = Bytes.megabytes(8);

/**
 * Something that can send a request and keep its connections between calls.
 *
 * The interface exists so that a caller can be handed any of them without knowing which: the
 * real one, one that retries, one that logs, one a test wrote. Only {@link send} is primitive
 * because every other method derives from it, and {@link BaseClient} derives them once so that
 * an implementation never has to.
 *
 * A client holding connections has to be closed when it is done, or the process keeps them.
 */
export interface Client {
  /** Sends a request and answers as soon as the headers have arrived. */
  send(request: BaseRequest): Future<StreamedResponse>;

  /** Asks for the headers of `url` alone, sending no body and announcing no length. */
  head(url: URL | string, options?: RequestOptions): Future<HttpResponse>;

  /** Gets `url` and answers once the body has been drained. */
  get(url: URL | string, options?: RequestOptions): Future<HttpResponse>;

  /** Posts to `url` and answers once the body has been drained. */
  post(url: URL | string, options?: RequestOptions): Future<HttpResponse>;

  /** Puts to `url` and answers once the body has been drained. */
  put(url: URL | string, options?: RequestOptions): Future<HttpResponse>;

  /** Patches `url` and answers once the body has been drained. */
  patch(url: URL | string, options?: RequestOptions): Future<HttpResponse>;

  /** Deletes `url` and answers once the body has been drained. */
  delete(url: URL | string, options?: RequestOptions): Future<HttpResponse>;

  /** Gets `url` and answers its body as text, throwing on any status but a 2xx. */
  read(url: URL | string, options?: RequestOptions): Future<string>;

  /** Gets `url` and answers its body as bytes, throwing on any status but a 2xx. */
  readBytes(url: URL | string, options?: RequestOptions): Future<Uint8Array>;

  /** Releases whatever this client is holding. Sending afterwards throws. */
  close(): void;
}
