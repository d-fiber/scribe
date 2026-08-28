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

import { json } from "@scribe/alchemy";
import { jwtPayloadUnverified } from "@scribe/runtime/support/crypto/jwt_payload.ts";
import { resolveClientIp } from "@scribe/runtime/http/ip/mod.ts";
import { MAX_BODY_BYTES } from "@scribe/runtime/http/limits.ts";
import { pathnameOf, searchOf } from "@scribe/runtime/http/pathname.ts";
import { RequestScope } from "@scribe/runtime/scope.ts";

const SEARCH_PARAMS_KEY = "http:search-params";

class RequestReader {
  private get req(): Request {
    return RequestScope.get();
  }

  headers(): Headers {
    return this.req.headers;
  }

  header(name: string): string | null {
    return this.headers().get(name);
  }

  token(): string | null {
    const auth = this.authorization();
    if (!auth?.startsWith("Bearer ")) return null;
    const token = auth.slice(7);
    return token.length > 0 ? token : null;
  }

  authorization(): string | null {
    return this.headers().get("authorization");
  }

  contentType(): string {
    return this.headers().get("content-type")?.split(";")[0].trim() ?? "";
  }

  userAgent(): string {
    return this.headers().get("user-agent")?.trim() ?? "";
  }

  contentLength(): number {
    return Number(this.headers().get("content-length") ?? 0);
  }

  path(): string {
    return pathnameOf(this.req.url);
  }

  searchParams(): URLSearchParams {
    const cached = RequestScope.cache.get<URLSearchParams>(SEARCH_PARAMS_KEY);
    if (cached !== undefined) return cached;

    const params = new URLSearchParams(searchOf(this.req.url));
    RequestScope.cache.set(SEARCH_PARAMS_KEY, params);
    return params;
  }

  query(key: string): string | null {
    return this.searchParams().get(key);
  }

  method(): string {
    return this.req.method;
  }

  startedAt(): number | undefined {
    const val = this.headers().get("x-request-start");
    return val ? Number(val) : undefined;
  }

  sessionId(): string | null {
    const token = this.token();
    if (!token) return null;

    const sessionId = jwtPayloadUnverified(token)?.session_id;
    return typeof sessionId === "string" && sessionId ? sessionId : null;
  }

  ip(): string {
    return resolveClientIp(this.headers(), RequestScope.peer());
  }

  isBodyTooLarge(): boolean {
    return this.contentLength() > MAX_BODY_BYTES;
  }

  bytes(): Uint8Array | null {
    const bytes = RequestScope.getBodyBytes();
    if (!bytes || bytes.byteLength === 0) return null;
    return bytes.byteLength > MAX_BODY_BYTES ? null : bytes;
  }

  raw(): unknown | null {
    const bytes = this.bytes();
    if (!bytes) return null;
    try {
      return json.decode(new TextDecoder().decode(bytes));
    } catch {
      return null;
    }
  }
}

export const request = new RequestReader();
