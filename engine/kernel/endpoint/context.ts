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

import type { Future } from "@scribe/alchemy";
import type { IpLocation } from "@scribe/alchemy/route";
import type { RequestDevice } from "@scribe/contracts/device.ts";
import {
  type BodyFromSchema,
  type BodySchema,
  type FormFromSchema,
  type FormSchema,
  parseBodyBytes,
  parseFormBytes,
} from "@scribe/alchemy/body";
import { requestDevice } from "@scribe/runtime/device/mod.ts";
import type { RequestUser } from "@scribe/alchemy/route";
import { currentIdentity } from "@scribe/runtime/http/accessors/identity.ts";
import { currentLocation } from "@scribe/runtime/http/accessors/location.ts";
import { request } from "@scribe/runtime/http/request.ts";
import { RequestScope } from "@scribe/runtime/scope.ts";

/**
 * What an endpoint handler is given to read the request it answers.
 *
 * @remarks
 * Every accessor here is a thin read over a request-scoped value, `RequestScope`, `currentIdentity`,
 * `requestDevice`, that already exists whether or not a handler asks for it: `ApiContext` exists so
 * a `Route` subclass reads the request through one object handed to `run` instead of importing each
 * of those accessors itself, and so a test can construct one without first setting up a whole request.
 */
export class ApiContext {
  /** The identity of the caller, or `null` for an anonymous request. */
  get user(): RequestUser | null {
    return currentIdentity() ?? null;
  }

  /** The caller's identity id, or `null` for an anonymous request. */
  get id(): string | null {
    return this.user?.id ?? null;
  }

  /** The request body parsed against `schema`, or `null` when it does not match. */
  body<S extends BodySchema>(schema: S): BodyFromSchema<S> | null {
    return parseBodyBytes(schema, request.bytes());
  }

  /** The request body read as form data and parsed against `schema`, or `null` when it does not match. */
  form<S extends FormSchema>(schema: S): Future<FormFromSchema<S> | null> {
    return parseFormBytes(schema, RequestScope.getBodyBytes(), request.header("content-type") ?? "");
  }

  /** The request body parsed as JSON with no schema check, or `null` when it does not parse. */
  raw(): unknown | null {
    return request.raw();
  }

  /** The request's HTTP method. */
  get method(): string {
    return request.method();
  }

  /** The request's path. */
  get path(): string {
    return request.path();
  }

  /** The request's `User-Agent` header, as the caller sent it. */
  get userAgent(): string {
    return request.userAgent();
  }

  /** The caller's IP address, as the process resolved it from the request. */
  get ip(): string {
    return request.ip();
  }

  /** The caller's session identifier, or `null` when the request carries none. */
  get sessionId(): string | null {
    return request.sessionId();
  }

  /** The value of query parameter `key`, or `null` when the request carries none. */
  query(key: string): string | null {
    return request.query(key);
  }

  /** The value of request header `name`, or `null` when the request carries none. */
  header(name: string): string | null {
    return request.header(name);
  }

  /** The device claims the request carries, decrypted and validated, or `null` when it carries none. */
  device(): Future<RequestDevice | null> {
    return requestDevice();
  }

  /** Where the caller's IP resolves to, or an empty location when nothing could resolve it. */
  location(): Future<IpLocation> {
    return currentLocation();
  }
}
