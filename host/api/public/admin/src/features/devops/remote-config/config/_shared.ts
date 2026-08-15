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

import {
  type RemoteConfig,
  RemoteConfigError,
} from "@scribe/host/dependencies/features/devops/remote-configs/remote-configs.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { enumValues, RemoteConfigAudience } from "@scribe/core/contracts/enums.ts";
import { ApiEndpoint, Caller } from "@scribe/core/kernel/endpoint/api.ts";
import { invalidKeyMessage, KEY_PATTERN } from "../_shared.ts";

export { KEY_PATTERN, MAX_KEY_LENGTH } from "../_shared.ts";

export const READ_RATE_LIMIT = {
  limit: 60,
  window: Time.minutes(1),
  penalty: Time.minutes(1),
  maxPenalty: Time.minutes(10),
};

export const WRITE_RATE_LIMIT = {
  limit: 30,
  window: Time.minutes(5),
  penalty: Time.minutes(5),
  maxPenalty: Time.minutes(30),
};

export function payload(config: RemoteConfig) {
  return {
    key: config.key,
    value: config.value,
    audience: config.audience,
    description: config.description,
    is_active: config.isActive,
    hash: config.hash,
    created_at: config.createdAt,
    updated_at: config.updatedAt,
  };
}

export function objectOrNull(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export function audienceOrNull(value: unknown): RemoteConfigAudience | null {
  return typeof value === "string" &&
      enumValues(RemoteConfigAudience).includes(value as RemoteConfigAudience)
    ? (value as RemoteConfigAudience)
    : null;
}

export function audienceMessage(): string {
  return `\`audience\` must be one of ${enumValues(RemoteConfigAudience).join(", ")}.`;
}

export abstract class AdminRemoteConfigEndpoint extends ApiEndpoint {
  protected access(): Caller {
    return Caller.Admin;
  }

  protected invalidKey(): Response {
    return this.response.badRequest({
      code: "invalid_key",
      message: invalidKeyMessage(),
    });
  }

  protected invalidBody(): Response {
    return this.response.badRequest();
  }

  protected notFoundOrUnexpected(error: RemoteConfigError): Response {
    return error === RemoteConfigError.NotFound ? this.response.notFound() : this.response.unexpected();
  }
}

export abstract class AdminRemoteConfigKeyEndpoint extends AdminRemoteConfigEndpoint {
  protected readonly key: string;

  constructor(key: string) {
    super();
    this.key = key;
  }

  protected validKey(): boolean {
    return KEY_PATTERN.test(this.key);
  }
}
