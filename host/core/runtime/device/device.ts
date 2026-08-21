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

import type { RequestDevice } from "@scribe/core/contracts/device.ts";
import { currentIdentity } from "@scribe/core/runtime/http/accessors/identity.ts";
import { request } from "@scribe/core/runtime/http/request.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";
import { claimNonce } from "./nonce.ts";
import { DevicePayloadCipher } from "./payload/cipher.ts";
import { DevicePayloadValidator } from "./payload/validator.ts";

const MAX_PAYLOAD_CHARS = 4096;
const CACHE_KEY = "device:resolved";

export async function decryptRequestDevice(
  encrypted: string,
  binding: string,
): Promise<RequestDevice | null> {
  const raw = await DevicePayloadCipher.decrypt(encrypted);
  if (raw === null) return null;

  const device = DevicePayloadValidator.validate(raw, binding);
  if (device === null) return null;

  if (device.nonce !== undefined && !(await claimNonce(device.nonce))) {
    return null;
  }

  return device;
}

export function requestDevice(): Promise<RequestDevice | null> {
  const cached = RequestScope.cache.get<Promise<RequestDevice | null>>(
    CACHE_KEY,
  );
  if (cached !== undefined) return cached;

  const pending = resolveDevice();
  RequestScope.cache.set(CACHE_KEY, pending);
  return pending;
}

function resolveDevice(): Promise<RequestDevice | null> {
  const encrypted = request.header("x-device-payload");
  if (!encrypted || encrypted.length > MAX_PAYLOAD_CHARS) {
    return Promise.resolve(null);
  }

  return decryptRequestDevice(encrypted, currentBinding());
}

function currentBinding(): string {
  return currentIdentity()?.id ??
    request.header("x-admin-app-key") ??
    request.header("x-app-key") ??
    "";
}
