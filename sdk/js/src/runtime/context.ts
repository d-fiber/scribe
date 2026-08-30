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

import type { Device, Invocation } from "../../gen/scribe/protocol/invocation_pb.ts";
import { Caller, decodeMethod } from "../contracts/access.ts";
import { Caller as ProtoCaller } from "../../gen/scribe/protocol/common_pb.ts";
import { parseBodyBytes, parseFormBytes } from "../validation/body.ts";
import type { BodyFromSchema, BodySchema, FormFromSchema, FormSchema } from "../validation/schema.ts";

export interface RequestUser {
  /** The identifier of the account making this request. */
  readonly id: string;

  /** The email address of the account making this request. */
  readonly email: string;

  /** The kind of caller the identity resolved to. */
  readonly caller: Caller;

  /** The role the identity carries. Empty when the identity carries none. */
  readonly role: string;

  /** The permissions the identity's role grants. */
  readonly permissions: readonly string[];
}

export interface RequestIpLocation {
  /** The city the request's IP address resolved to. Empty when it could not be resolved. */
  readonly city: string;

  /** The country the request's IP address resolved to. Empty when it could not be resolved. */
  readonly country: string;
}

export type RequestDevice = Device;

const callers: Record<ProtoCaller, Caller> = {
  [ProtoCaller.UNSPECIFIED]: Caller.Anonymous,
  [ProtoCaller.ANONYMOUS]: Caller.Anonymous,
  [ProtoCaller.USER]: Caller.User,
  [ProtoCaller.ADMIN]: Caller.Admin,
  [ProtoCaller.SERVICE]: Caller.Service,
  [ProtoCaller.WEBHOOK]: Caller.Webhook,
};

export class RequestContext {
  constructor(readonly invocation: Invocation) {}

  /** The account making this request, or `null` for an anonymous or unauthenticated caller. */
  get user(): RequestUser | null {
    const identity = this.invocation.identity;
    if (!identity || identity.id === "") return null;

    return {
      id: identity.id,
      email: identity.email,
      caller: callers[identity.caller] ?? Caller.Anonymous,
      role: identity.rules?.role ?? "",
      permissions: identity.rules?.permissions ?? [],
    };
  }

  /** The identifier of the account making this request, or `null` for an unauthenticated caller. */
  get id(): string | null {
    return this.user?.id ?? null;
  }

  /** The identifier the host assigned to this invocation. */
  get invocationId(): string {
    return this.invocation.invocationId;
  }

  /** The identifier this request's trace is carried under, across every node it passes through. */
  get traceId(): string {
    return this.invocation.traceId;
  }

  /** The HTTP method this request was made with, in upper case. */
  get method(): string {
    return decodeMethod(this.invocation.request?.method ?? 0).toUpperCase();
  }

  /** The path this request was made to, path parameters unresolved. */
  get path(): string {
    return this.invocation.request?.path ?? "";
  }

  /** The IP address this request was made from. */
  get ip(): string {
    return this.invocation.request?.ip ?? "";
  }

  /** The `User-Agent` header this request carried. */
  get userAgent(): string {
    return this.invocation.request?.userAgent ?? "";
  }

  /** The identifier of the session this request carries, or `null` for a request without one. */
  get sessionId(): string | null {
    const session = this.invocation.request?.sessionId ?? "";
    return session === "" ? null : session;
  }

  /** This request's path parameters, keyed by the name their route declared them under. */
  get pathParams(): Readonly<Record<string, string>> {
    return this.invocation.request?.pathParams ?? {};
  }

  param(name: string): string | null {
    return this.pathParams[name] ?? null;
  }

  query(key: string): string | null {
    return this.invocation.request?.query[key] ?? null;
  }

  header(name: string): string | null {
    return this.invocation.request?.headers[name.toLowerCase()] ?? null;
  }

  body<S extends BodySchema>(schema: S): BodyFromSchema<S> | null {
    return parseBodyBytes(schema, this.#bytes());
  }

  form<S extends FormSchema>(schema: S): Promise<FormFromSchema<S> | null> {
    return parseFormBytes(schema, this.#bytes(), this.header("content-type") ?? "");
  }

  raw(): unknown | null {
    const bytes = this.#bytes();
    if (!bytes || bytes.byteLength === 0) return null;

    try {
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return null;
    }
  }

  device(): RequestDevice | null {
    const device = this.invocation.device;
    return device && device.deviceId !== "" ? device : null;
  }

  location(): RequestIpLocation {
    return {
      city: this.invocation.location?.city ?? "",
      country: this.invocation.location?.country ?? "",
    };
  }

  #bytes(): Uint8Array | null {
    const body = this.invocation.request?.body;
    return body && body.byteLength > 0 ? body : null;
  }
}
