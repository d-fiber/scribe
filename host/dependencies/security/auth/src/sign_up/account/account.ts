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

import type { AccountRole } from "@scribe/core/contracts/account.ts";
import type { RequestDevice } from "@scribe/core/contracts/device.ts";
import { SocialProvider as DatabaseSocialProvider } from "@scribe/core/contracts/enums.ts";
import type { Failure } from "@scribe/core/contracts/result.ts";
import { SocialProvider } from "../../_core/gotrue/primitives.ts";
import type { AdminEmailSignUpError, UserEmailSignUpError } from "../types.ts";

export enum SignUpChannel {
  Email = "email",
  Phone = "phone",
  Social = "social",
}

export type SignUpIdentity =
  | { readonly channel: SignUpChannel.Email; readonly email: string }
  | { readonly channel: SignUpChannel.Phone; readonly phone: string }
  | {
    readonly channel: SignUpChannel.Social;
    readonly provider: SocialProvider;
    readonly email: string | null;
  };

const _DATABASE_SOCIAL_PROVIDER: Record<
  SocialProvider,
  DatabaseSocialProvider
> = {
  [SocialProvider.Google]: DatabaseSocialProvider.GOOGLE,
  [SocialProvider.Apple]: DatabaseSocialProvider.APPLE,
};

export function identityColumns(identity: SignUpIdentity): {
  email: string | null;
  phone: string | null;
  social_provider: DatabaseSocialProvider | null;
} {
  switch (identity.channel) {
    case SignUpChannel.Email:
      return { email: identity.email, phone: null, social_provider: null };
    case SignUpChannel.Phone:
      return { email: null, phone: identity.phone, social_provider: null };
    case SignUpChannel.Social:
      return {
        email: identity.email,
        phone: null,
        social_provider: _DATABASE_SOCIAL_PROVIDER[identity.provider],
      };
  }
}

export interface SignUpInsert<TInput, TPrepared> {
  readonly userId: string;
  readonly identity: SignUpIdentity;
  readonly data: TInput;
  readonly prepared: TPrepared;
  readonly device: RequestDevice;
}

export interface SignUpAccount<TInput, TPrepared> {
  readonly role: AccountRole;

  readonly isEmailPreConfirmed: boolean;

  prepare(
    data: TInput,
  ):
    | Promise<Failure<AdminEmailSignUpError | UserEmailSignUpError> | TPrepared>
    | Failure<AdminEmailSignUpError | UserEmailSignUpError>
    | TPrepared;

  exists(userId: string): Promise<boolean>;

  insert(input: SignUpInsert<TInput, TPrepared>): Promise<boolean>;

  delete(userId: string): Promise<void>;
}
