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

import { rest } from "@scribe/host/packages/foundation/database/rest/rest.ts";
import { AccountRole } from "@scribe/core/contracts/account.ts";
import { AvatarType } from "@scribe/core/contracts/enums.ts";
import { Failure } from "@scribe/core/contracts/result.ts";
import { AuthValidator } from "../../_core/validator.ts";
import { AdminEmailSignUpError, type AdminSignUp } from "../types.ts";
import { type SignUpAccount, SignUpChannel, type SignUpInsert } from "./account.ts";

export interface AdminSignUpPrepared {
  phone: string;
}

export class AdminSignUpAccount implements
  SignUpAccount<
    AdminSignUp,
    AdminSignUpPrepared
  > {
  readonly role = AccountRole.Admin;
  readonly isEmailPreConfirmed = true;

  prepare(
    data: AdminSignUp,
  ): Failure<AdminEmailSignUpError> | AdminSignUpPrepared {
    if (!AuthValidator.profile.isValidName(data.firstname)) {
      return new Failure(AdminEmailSignUpError.InvalidFirstName);
    }
    if (!AuthValidator.profile.isValidName(data.lastname)) {
      return new Failure(AdminEmailSignUpError.InvalidLastName);
    }
    if (!AuthValidator.profile.isValidGender(data.gender)) {
      return new Failure(AdminEmailSignUpError.InvalidGender);
    }
    if (!AuthValidator.profile.isValidBirthday(data.birthday)) {
      return new Failure(AdminEmailSignUpError.InvalidBirthday);
    }

    const phone = AuthValidator.phone.format(data.phone);
    if (!AuthValidator.phone.isValid(phone)) {
      return new Failure(AdminEmailSignUpError.InvalidPhone);
    }

    return { phone };
  }

  async exists(userId: string): Promise<boolean> {
    const row = await rest
      .internal_t__admin_users()
      .select((s) => ({ admin_id: s.admin_id }))
      .where((f) => f.admin_id.eq(userId))
      .getOne();
    return row !== null;
  }

  async insert({
    userId,
    identity,
    data,
    prepared,
    device,
  }: SignUpInsert<AdminSignUp, AdminSignUpPrepared>): Promise<boolean> {
    if (identity.channel !== SignUpChannel.Email) return false;

    const account = await rest.internal_t__admin_users().insert({
      admin_id: userId,
      role: data.role,
      email: identity.email,
      phone: prepared.phone,
      is_email_verified: false,
      is_phone_verified: false,
    });
    if (!account) return false;

    const [profile, settings] = await Promise.all([
      rest.internal_t__admin_users_profiles().insert({
        admin_id: userId,
        avatar_type: AvatarType.TEXT,
        avatar_text: data.firstname[0].toUpperCase() +
          data.lastname[0].toUpperCase(),
        avatar_background_color: "FA062B",
        first_name: data.firstname,
        last_name: data.lastname,
        gender: data.gender,
        birthday: data.birthday,
      }),
      rest.internal_t__admin_users_settings().insert({
        admin_id: userId,
        localization: device.localization,
        theme_mode: device.theme_mode,
      }),
    ]);

    return profile && settings;
  }

  async delete(userId: string): Promise<void> {
    await rest
      .internal_t__admin_users()
      .where((f) => f.admin_id.eq(userId))
      .delete();
  }
}
