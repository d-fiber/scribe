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
