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

import type { Device, Invocation } from "../../gen/scribe/protocol/invocation_pb.ts";
import { Caller, decodeMethod } from "../contracts/access.ts";
import { Caller as ProtoCaller } from "../../gen/scribe/protocol/common_pb.ts";
import { parseBodyBytes, parseFormBytes } from "../validation/body.ts";
import type { BodyFromSchema, BodySchema, FormFromSchema, FormSchema } from "../validation/schema.ts";

export interface RequestUser {
  readonly id: string;
  readonly email: string;
  readonly caller: Caller;
  readonly role: string;
  readonly permissions: readonly string[];
}

export interface RequestIpLocation {
  readonly city: string;
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

export class InvocationContext {
  constructor(readonly invocation: Invocation) {}

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

  get id(): string | null {
    return this.user?.id ?? null;
  }

  get invocationId(): string {
    return this.invocation.invocationId;
  }

  get traceId(): string {
    return this.invocation.traceId;
  }

  get method(): string {
    return decodeMethod(this.invocation.request?.method ?? 0).toUpperCase();
  }

  get path(): string {
    return this.invocation.request?.path ?? "";
  }

  get ip(): string {
    return this.invocation.request?.ip ?? "";
  }

  get userAgent(): string {
    return this.invocation.request?.userAgent ?? "";
  }

  get sessionId(): string | null {
    const session = this.invocation.request?.sessionId ?? "";
    return session === "" ? null : session;
  }

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
