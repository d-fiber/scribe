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
import { DEFAULT_MAX_RESPONSE, DEFAULT_REDIRECT, DEFAULT_REQUEST_TIMEOUT } from "./client.ts";
import type { Client, RequestBody, RequestOptions } from "./client.ts";
import { ClientException } from "../exception.ts";
import type { BaseRequest } from "../request/base_request.ts";
import { HttpRequest } from "../request/request.ts";
import { HttpResponse } from "../response/response.ts";
import type { StreamedResponse } from "../response/streamed_response.ts";

/**
 * Everything a {@link Client} does, derived from the one thing it has to implement.
 *
 * A subclass writes {@link send} and inherits the eight convenience methods, so the behaviour
 * every client shares is written once and cannot differ between two clients: how a body becomes
 * bytes, when a status is an error, how a stream becomes a whole response.
 */
export abstract class BaseClient implements Client {
  /**
   * Sends `request` and answers the reply, its body not yet read.
   *
   * It is the one member a client writes, and the only place this folder touches a network. What
   * it answers is streamed, so a caller that wants a whole body asks for one and a caller reading
   * something large does not have to.
   */
  abstract send(request: BaseRequest): Future<StreamedResponse>;

  /** Asks for what a `GET` would answer, without the body. */
  head(url: URL | string, options: RequestOptions = {}): Future<HttpResponse> {
    return this.#send("HEAD", url, options);
  }

  /** Reads what is at `url`. */
  get(url: URL | string, options: RequestOptions = {}): Future<HttpResponse> {
    return this.#send("GET", url, options);
  }

  /** Sends `options.body` to `url`, meaning to create something. */
  post(url: URL | string, options: RequestOptions = {}): Future<HttpResponse> {
    return this.#send("POST", url, options);
  }

  /** Sends `options.body` to `url`, meaning to replace what is there. */
  put(url: URL | string, options: RequestOptions = {}): Future<HttpResponse> {
    return this.#send("PUT", url, options);
  }

  /** Sends `options.body` to `url`, meaning to change part of what is there. */
  patch(url: URL | string, options: RequestOptions = {}): Future<HttpResponse> {
    return this.#send("PATCH", url, options);
  }

  /** Asks for what is at `url` to be removed. */
  delete(url: URL | string, options: RequestOptions = {}): Future<HttpResponse> {
    return this.#send("DELETE", url, options);
  }

  /**
   * Reads what is at `url` as text, and refuses anything that is not a success.
   *
   * @remarks
   * It is the difference with {@link get}, which hands back a refusal as a response and leaves the
   * status to the caller. This one is for the call where a failure has nothing useful in its body.
   *
   * @throws {ClientException} When the status is not in the two hundreds.
   */
  async read(url: URL | string, options: RequestOptions = {}): Future<string> {
    const response = await this.get(url, options);
    this.#checkOk(response);
    return response.body;
  }

  /**
   * Reads what is at `url` as bytes, and refuses anything that is not a success.
   *
   * @throws {ClientException} When the status is not in the two hundreds.
   */
  async readBytes(
    url: URL | string,
    options: RequestOptions = {},
  ): Future<Uint8Array> {
    const response = await this.get(url, options);
    this.#checkOk(response);
    return response.bodyBytes;
  }

  /**
   * Lets go of whatever this client holds open.
   *
   * It does nothing here, because a client that holds nothing has nothing to let go of. A client
   * that pools connections overrides it, and a caller calls it either way rather than having to
   * know which kind it holds.
   */
  close(): void {}

  /**
   * Builds the request the eight members above describe, sends it, and reads the whole reply.
   *
   * It is written once here so that what a body becomes, how a header is set and when a timeout is
   * carried cannot differ between one verb and another.
   */
  async #send(
    method: string,
    url: URL | string,
    options: RequestOptions,
  ): Future<HttpResponse> {
    const request = new HttpRequest(method, url);

    if (options.headers) {
      for (const [name, value] of new Headers(options.headers)) {
        request.headers.set(name, value);
      }
    }
    if (options.encoding) request.encoding = options.encoding;
    request.timeoutMs = (options.timeout ?? DEFAULT_REQUEST_TIMEOUT).inMilliseconds;
    request.followRedirects = (options.redirect ?? DEFAULT_REDIRECT) === "follow";
    if (options.maxRedirects !== undefined) request.maxRedirects = options.maxRedirects;
    _applyBody(request, options.body ?? null);

    return await HttpResponse.fromStream(
      await this.send(request),
      options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE,
    );
  }

  /**
   * Throws when `response` carries a status the caller cannot read a body from.
   *
   * `read` and `readBytes` are the two methods that promise a body, so they are the two that
   * cannot hand back the body of an error page as if it were the answer.
   */
  #checkOk(response: HttpResponse): void {
    if (response.ok) return;

    throw new ClientException(
      `The call to ${named(response.request?.url ?? null)} failed with status ${response.statusCode}.`,
      response.request?.url ?? null,
    );
  }
}

/**
 * Puts `body` on `request` under the encoding its own type calls for.
 *
 * A record becomes a url-encoded form, text becomes text, bytes go as they are. It is the same
 * rule package:http follows, and it is what makes `body:` mean one thing at every call.
 */
function _applyBody(request: HttpRequest, body: RequestBody): void {
  if (body === null) return;

  if (typeof body === "string") {
    request.body = body;
    return;
  }
  if (body instanceof Uint8Array) {
    request.bodyBytes = body;
    return;
  }
  request.bodyFields = body;
}

/**
 * `url` written without anything that should not travel.
 *
 * @remarks
 * A message ends up wherever messages end up, which is the log collector. An address carries a
 * query, and a query carries `access_token`, `signature` and whatever else was pre-signed; it can
 * also carry the password half of a basic authentication. What locates the fault is the host and
 * the path, and those are all this hands over.
 */
function named(url: URL | null): string {
  return url === null ? "an address nothing recorded" : `${url.origin}${url.pathname}`;
}
