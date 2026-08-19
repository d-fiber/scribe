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

import { Time } from "@scribe/core/contracts/common/time.ts";
import type { Result } from "@scribe/core/contracts/result.ts";
import { Failure, OK } from "@scribe/core/contracts/result.ts";
import { RateLimit } from "@scribe/foundation/src/rate_limit/mod.ts";
import { checkCaller } from "@scribe/core/runtime/http/caller.ts";
import { CurrentSessionResolver } from "../_core/current_session.ts";
import { goTrue } from "../_core/gotrue/gotrue_client.ts";
import { AccountRevocation } from "../_core/revocation.ts";

export interface AccountIdentity {
  readonly identity_id: string;
  readonly provider: string;
  readonly email: string | null;
  readonly created_at: string | null;
  readonly last_sign_in_at: string | null;
}

export enum IdentitiesError {
  Unauthorized = "unauthorized",
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export type IdentitiesResult = Result<AccountIdentity[], IdentitiesError>;

export enum UnlinkIdentityError {
  Unauthorized = "unauthorized",
  NotFound = "not_found",
  LastIdentity = "last_identity",
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export type UnlinkIdentityResult = Result<void, UnlinkIdentityError>;

const LIST_LIMIT = new RateLimit({
      key: "user:identities",
      limit: 30,
      window: Time.minutes(1),
      penalty: Time.minutes(1),
      maxPenalty: Time.minutes(10),
      failOpen: false,
});

const UNLINK_LIMIT = new RateLimit({
      key: "user:identities:unlink",
      limit: 5,
      window: Time.minutes(15),
      penalty: Time.minutes(15),
      maxPenalty: Time.hours(1),
      failOpen: false,
});

export class UserIdentitiesClient {
  async list(): Promise<IdentitiesResult> {
    const session = CurrentSessionResolver.resolve();
    if (!session) return new Failure(IdentitiesError.Unauthorized);

    const rate = await checkCaller(LIST_LIMIT);
    if (!rate.ok) return new Failure(IdentitiesError.TooManyRequests);

    const response = await goTrue.session.user(session.token);
    if (!response.ok) return new Failure(IdentitiesError.Unexpected);

    return new OK(
      (response.data.identities ?? []).map((identity) => ({
        identity_id: identity.identity_id,
        provider: identity.provider,
        email: identity.identity_data?.email ?? null,
        created_at: identity.created_at,
        last_sign_in_at: identity.last_sign_in_at,
      })),
    );
  }

  async unlink(identityId: string): Promise<UnlinkIdentityResult> {
    const session = CurrentSessionResolver.resolve();
    if (!session) return new Failure(UnlinkIdentityError.Unauthorized);

    const rate = await checkCaller(UNLINK_LIMIT);
    if (!rate.ok) return new Failure(UnlinkIdentityError.TooManyRequests);

    const response = await goTrue.session.user(session.token);
    if (!response.ok) return new Failure(UnlinkIdentityError.Unexpected);

    const identities = response.data.identities ?? [];
    if (!identities.some((i) => i.identity_id === identityId)) {
      return new Failure(UnlinkIdentityError.NotFound);
    }
    if (identities.length <= 1) {
      return new Failure(UnlinkIdentityError.LastIdentity);
    }

    const unlinked = await goTrue.session.unlinkIdentity(
      session.token,
      identityId,
    );
    if (!unlinked.ok) {
      return new Failure(
        unlinked.error.code === "single_identity_not_deletable"
          ? UnlinkIdentityError.LastIdentity
          : UnlinkIdentityError.Unexpected,
      );
    }

    await AccountRevocation.caches(session.userId);

    return new OK();
  }
}
