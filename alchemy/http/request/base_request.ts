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

import { ByteStream } from "../byte_stream.ts";
import type { Client } from "../client/client.ts";
import type { StreamedResponse } from "../response/streamed_response.ts";
import { ScribeError } from "../../error/scribe_error.ts";

/** What a client does when the answer to a request is a redirect. */
export type Redirect = "error" | "follow" | "manual";

/**
 * What every request has, whatever carries its body.
 *
 * @remarks
 * A request is **sealed by its first send**: `finalize` hands the body over once and refuses
 * afterwards, and the fields stop accepting writes. Without that, a request reused after a
 * redirect or a retry would send a stream somebody has already drained.
 */
export abstract class BaseRequest {
  /**
   * The method, upper-cased.
   *
   * A client sends this as-is on the wire, and HTTP method names are conventionally upper-case;
   * normalizing here means a caller who wrote `"get"` and one who wrote `"GET"` produce the same
   * request instead of two servers disagreeing on whether the difference matters.
   */
  readonly method: string;

  /** Where the request goes, parsed once so every collaborator reads the same `URL` rather than re-parsing a string. */
  readonly url: URL;

  readonly #headers = new Headers();

  #finalized = false;
  #redirect: Redirect = "follow";
  #maxRedirects = 5;
  #persistentConnection = true;
  /** How long the client waits for this exchange, or null for no limit. */
  #timeoutMs: number | null = null;

  constructor(method: string, url: URL | string) {
    this.method = method.toUpperCase();
    this.url = typeof url === "string" ? new URL(url) : url;
  }

  /**
   * The headers this request carries.
   *
   * Unlike the settable fields, this one stays open after a send: it is the collection itself
   * that is handed out, and a subclass drawing a boundary at finalize writes into it.
   */
  get headers(): Headers {
    return this.#headers;
  }

  /**
   * How many bytes the body holds, or `null` when that is not known ahead of time.
   *
   * A subclass whose body is a fixed buffer answers its exact length; one whose body is a stream
   * from an unknown source, a file read lazily, a generator, cannot know the total before it has
   * read the whole thing, so it answers `null` rather than lying with a guess a `Content-Length`
   * header would then hold a client to.
   */
  abstract get contentLength(): number | null;

  /**
   * What the client does with a redirect on this request's behalf.
   *
   * @remarks
   * The three answers are not two: `error` refuses the exchange, `manual` hands the redirect
   * back as an answer of its own, and only `follow` walks it. A request that carried a boolean
   * collapsed the first two, and the client then had to guess which one the caller meant.
   */
  get redirect(): Redirect {
    return this.#redirect;
  }
  set redirect(value: Redirect) {
    this.#checkFinalized();
    this.#redirect = value;
  }

  /** Whether {@link redirect} walks a redirect rather than refusing it or handing it back. */
  get followRedirects(): boolean {
    return this.#redirect === "follow";
  }
  set followRedirects(value: boolean) {
    this.redirect = value ? "follow" : "manual";
  }

  /**
   * How many redirects are followed before the client gives up.
   *
   * Bounded rather than unlimited, because a redirect can point back at itself: a server that
   * loops, by mistake or on purpose, would otherwise hang a request forever instead of failing it.
   */
  get maxRedirects(): number {
    return this.#maxRedirects;
  }
  set maxRedirects(value: number) {
    this.#checkFinalized();
    this.#maxRedirects = value;
  }

  /**
   * Whether the connection is kept open for a later request.
   *
   * Lives on the request, not on the client, for the same reason {@link timeoutMs} does: a caller
   * making one throwaway call to an otherwise long-lived client should be able to say so without
   * changing how every other request through that client behaves.
   */
  get persistentConnection(): boolean {
    return this.#persistentConnection;
  }
  set persistentConnection(value: boolean) {
    this.#checkFinalized();
    this.#persistentConnection = value;
  }

  /**
   * How long the client waits for this exchange, in milliseconds, or `null` for no limit.
   *
   * It lives on the request rather than on the call so that it survives into {@link send},
   * which is the only method a client has to implement and the only place a limit can be
   * applied.
   */
  get timeoutMs(): number | null {
    return this.#timeoutMs;
  }
  set timeoutMs(value: number | null) {
    this.#checkFinalized();
    this.#timeoutMs = value;
  }

  /**
   * Whether this request has already been handed over.
   *
   * Exposed as its own read, separate from calling {@link finalize} to find out, because checking
   * must never have the side effect of sealing: a caller inspecting a request before deciding
   * whether to configure it further cannot be the thing that finalizes it.
   */
  get finalized(): boolean {
    return this.#finalized;
  }

  /**
   * Seals the request and answers its body.
   *
   * A subclass overrides this to produce its own body, and calls `super.finalize()` first so
   * the seal is set in one place.
   */
  finalize(): ByteStream {
    this.#checkFinalized();
    this.#finalized = true;
    return ByteStream.fromBytes(new Uint8Array(0));
  }

  /**
   * Sends this request through `client`, and answers before the body has arrived.
   *
   * @remarks
   * The response streams rather than waiting for the whole body, so a caller reading a large
   * reply is not forced to hold it all in memory first: a caller who wants the whole thing asks
   * `StreamedResponse` for it.
   */
  send(client: Client): Promise<StreamedResponse> {
    return client.send(this);
  }

  /**
   * Refuses a change to a request that has already been sent.
   *
   * @remarks
   * `#checkFinalized` is private, so a subclass in `request.ts` cannot call it directly to guard
   * its own setters. This protected wrapper is the one seam that lets a subclass reuse the same
   * check rather than reimplementing it against its own finalized flag.
   */
  protected checkFinalized(): void {
    this.#checkFinalized();
  }

  /**
   * Refuses a change to a request that has already been handed over.
   *
   * @throws {ScribeError} When this request has been finalized.
   */
  #checkFinalized(): void {
    if (!this.#finalized) return;

    throw new ScribeError("This request has already been sent, and a sent request cannot be changed.");
  }

  /** This request as the verb and the address, which is what a log line wants. */
  toString(): string {
    return `${this.method} ${this.url}`;
  }
}
