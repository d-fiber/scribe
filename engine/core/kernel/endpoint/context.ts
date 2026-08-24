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

import type { IpLocation } from "@scribe/alchemy/route";
import type { RequestDevice } from "@scribe/core/contracts/device.ts";
import {
  type BodyFromSchema,
  type BodySchema,
  type FormFromSchema,
  type FormSchema,
  parseBodyBytes,
  parseFormBytes,
} from "@scribe/alchemy/body";
import { requestDevice } from "@scribe/core/runtime/device/mod.ts";
import type { RequestUser } from "@scribe/alchemy/route";
import { currentIdentity } from "@scribe/core/runtime/http/accessors/identity.ts";
import { currentLocation } from "@scribe/core/runtime/http/accessors/location.ts";
import { request } from "@scribe/core/runtime/http/request.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";

export class ApiContext {
  get user(): RequestUser | null {
    return currentIdentity() ?? null;
  }

  get id(): string | null {
    return this.user?.id ?? null;
  }

  body<S extends BodySchema>(schema: S): BodyFromSchema<S> | null {
    return parseBodyBytes(schema, request.bytes());
  }

  form<S extends FormSchema>(schema: S): Promise<FormFromSchema<S> | null> {
    return parseFormBytes(schema, RequestScope.getBodyBytes(), request.header("content-type") ?? "");
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

  location(): Promise<IpLocation> {
    return currentLocation();
  }
}
