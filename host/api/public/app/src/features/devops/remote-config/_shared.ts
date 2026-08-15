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
  type RemoteConfigCallerType,
  RemoteConfigError,
  RemoteConfigOutcome,
} from "@scribe/host/dependencies/features/devops/remote-configs/remote-configs.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { ApiContext, ApiEndpoint, Caller } from "@scribe/core/kernel/endpoint/api.ts";

export const APP_REMOTE_CONFIG_CODES = {
  unchanged: "unchanged",
  inactive: "config_inactive",
} as const;

export const HASH_QUERY = "hash";

const MAX_KEY_LENGTH = 128;
const KEY_PATTERN = /^[a-zA-Z0-9._-]{1,128}$/;

export const RATE_LIMIT = {
  limit: 60,
  window: Time.minutes(1),
  penalty: Time.minutes(1),
  maxPenalty: Time.minutes(10),
};

export function payload(config: RemoteConfig) {
  return {
    key: config.key,
    value: config.value,
    audience: config.audience,
    hash: config.hash,
    updated_at: config.updatedAt,
  };
}

export abstract class AppRemoteConfigEndpoint extends ApiEndpoint {
  protected access(): Caller {
    return Caller.Anonymous;
  }

  protected rateLimit() {
    return RATE_LIMIT;
  }

  protected callerType(ctx: ApiContext): RemoteConfigCallerType {
    return ctx.user ? "user" : null;
  }

  protected read(config: RemoteConfig, outcome: RemoteConfigOutcome, ctx: ApiContext) {
    return {
      remoteConfigId: config.id,
      audience: config.audience,
      outcome,
      ...(ctx.user ? { userId: ctx.user.id } : {}),
    };
  }

  protected validKey(key: string): boolean {
    return KEY_PATTERN.test(key);
  }

  protected invalidKey(): Response {
    return this.response.badRequest({
      code: "invalid_key",
      message: `A config key must be at most ${MAX_KEY_LENGTH} characters of [a-zA-Z0-9._-].`,
    });
  }

  protected failure(error: RemoteConfigError): Response {
    if (error === RemoteConfigError.Inactive) {
      return this.response.conflict({
        code: APP_REMOTE_CONFIG_CODES.inactive,
        message: "This configuration has been disabled.",
      });
    }
    if (error === RemoteConfigError.NotFound) return this.response.notFound();
    return this.response.unexpected();
  }
}
