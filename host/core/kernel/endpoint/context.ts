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

import type { RequestIpLocation } from "@scribe/core/contracts/common/location.ts";
import type { RequestDevice } from "@scribe/core/contracts/device.ts";
import { parseBody, parseForm } from "@scribe/core/kernel/validation/body.ts";
import type {
  BodyFromSchema,
  BodySchema,
  FormFromSchema,
  FormSchema,
} from "@scribe/core/kernel/validation/schema.ts";
import { requestDevice } from "@scribe/core/runtime/device/mod.ts";
import {
  currentIdentity,
  type RequestUser,
} from "@scribe/core/runtime/http/accessors/identity.ts";
import { currentLocation } from "@scribe/core/runtime/http/accessors/location.ts";
import { request } from "@scribe/core/runtime/http/request.ts";

export class ApiContext {
  get user(): RequestUser | null {
    return currentIdentity() ?? null;
  }

  get id(): string | null {
    return this.user?.id ?? null;
  }

  body<S extends BodySchema>(schema: S): BodyFromSchema<S> | null {
    return parseBody(schema);
  }

  form<S extends FormSchema>(schema: S): Promise<FormFromSchema<S> | null> {
    return parseForm(schema);
  }

  raw(): unknown | null {
    return request.raw();
  }

  get method(): string {
    return request.method();
  }

  get path(): string {
    return request.path();
  }

  get userAgent(): string {
    return request.userAgent();
  }

  get ip(): string {
    return request.ip();
  }

  get sessionId(): string | null {
    return request.sessionId();
  }

  query(key: string): string | null {
    return request.query(key);
  }

  header(name: string): string | null {
    return request.header(name);
  }

  device(): Promise<RequestDevice | null> {
    return requestDevice();
  }

  location(): Promise<RequestIpLocation> {
    return currentLocation();
  }
}
