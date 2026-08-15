// Copyright (C) 2026 Fiber
//
// This file is part of scribe and is made available under the PolyForm Shield
// License 1.0.0. The full terms are in the LICENSE file at the root of this
// repository, and at https://polyformproject.org/licenses/shield/1.0.0
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
//
// The one thing you may not do:
// - Use it to provide any product that competes with scribe, or with any
//   product Fiber or its affiliates provide using scribe. Products compete
//   even when they are offered free of charge, through a different kind of
//   interface, or for a different technical platform.
//
// If you pass this software on:
// - Anyone who receives any part of it from you must also receive these terms,
//   or the URL above, together with the "Required Notice" line carried by the
//   LICENSE file.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE COMES AS IS, WITHOUT ANY WARRANTY OR
// CONDITION, AND THE LICENSOR WILL NOT BE LIABLE TO YOU FOR ANY DAMAGES ARISING
// OUT OF THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY KIND OF
// LEGAL CLAIM.
//
// This header is a summary written for convenience. Where it differs from the
// LICENSE file, the LICENSE file governs.

import { jwtPayloadUnverified } from "@scribe/core/runtime/support/crypto/jwt_payload.ts";
import { resolveClientIp } from "@scribe/core/runtime/http/ip/mod.ts";
import { MAX_BODY_BYTES } from "@scribe/core/runtime/http/limits.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";

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
    return new URL(this.req.url).pathname;
  }

  query(key: string): string | null {
    return new URL(this.req.url).searchParams.get(key);
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
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return null;
    }
  }
}

export const request = new RequestReader();
