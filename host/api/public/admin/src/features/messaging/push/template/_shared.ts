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

import type { PushTemplate } from "@scribe/host/dependencies/features/messagings/notification_push/push.ts";
import { PushTemplateError } from "@scribe/host/dependencies/features/messagings/notification_push/push.ts";

export {
  AdminPushEndpoint,
  AdminPushIdEndpoint,
  objectOrNull,
  page,
  READ_RATE_LIMIT,
  trimmedOrNull,
  WRITE_RATE_LIMIT,
} from "../_shared.ts";

export const MAX_NAME_LENGTH = 128;
export const NAME_PATTERN = /^[a-zA-Z0-9._-]+(\/[a-zA-Z0-9._-]+)*$/;
export const NAME_EXPECTATION = "at most 128 characters of [a-zA-Z0-9._-], optionally split into segments by /";

export function isValidName(name: string): boolean {
  return name.length <= MAX_NAME_LENGTH && NAME_PATTERN.test(name);
}

export function isNotFound(error: PushTemplateError): boolean {
  return error === PushTemplateError.NotFound;
}

export function payload(template: PushTemplate) {
  return {
    id: template.id,
    name: template.name,
    title: template.title,
    body: template.body,
    data: template.data,
  };
}
