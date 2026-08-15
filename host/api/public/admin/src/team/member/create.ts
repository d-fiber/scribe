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

import { clients } from "@scribe/host/dependencies/clients.ts";
import { rest } from "@scribe/host/dependencies/database/rest/rest.ts";
import { AdminEmailSignUpError, EmailSignUpError } from "@scribe/host/dependencies/security/auth/src/sign_up/sign_up.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { Gender } from "@scribe/core/contracts/enums.ts";
import { Failure } from "@scribe/core/contracts/result.ts";
import { ApiContext, ApiEndpoint, Caller, Required } from "@scribe/core/kernel/endpoint/api.ts";
import { canGrantRole } from "../_authority.ts";

export class AdminCreateTeamMemberEndpoint extends ApiEndpoint {
  protected access(): Caller {
    return Caller.Admin;
  }

  protected rateLimit() {
    return {
      limit: 10,
      window: Time.minutes(1),
      penalty: Time.minutes(1),
    };
  }

  protected async run(ctx: ApiContext): Promise<Response> {
    const body = ctx.body({
      email: Required(String),
      password: Required(String),
      phone: Required(String),
      firstname: Required(String),
      lastname: Required(String),
      gender: Required(String),
      birthday: Required(Number),
      role: Required(String),
      admin: Object,
    });
    if (!body) return this.response.badRequest();

    const isExists = await rest
      .internal_t__admin_users_roles()
      .select((s) => ({ role: s.role }))
      .where((f) => f.role.eq(body.role))
      .getOne();
    if (!isExists) {
      return this.response.badRequest({
        code: "invalid_role",
        message: "The specified role does not exist.",
      });
    }

    if (!(await canGrantRole(body.role))) {
      return this.response.forbidden({
        code: "not_permitted",
        message: "You cannot grant a role that exceeds your own permissions.",
      });
    }

    const result = await clients.security.auth.signUp.admin.email.withEmailAndPassword({
      email: body.email,
      password: body.password,
      phone: body.phone,
      firstname: body.firstname,
      lastname: body.lastname,
      gender: body.gender as Gender,
      birthday: body.birthday,
      role: body.role,
      data: body.admin ?? {},
    });

    if (result instanceof Failure) {
      if (typeof result.error === "object") {
        return this.response.badRequest(result.error);
      }

      switch (result.error) {
        case EmailSignUpError.EmailAlreadyExists:
          return this.response.conflict({
            code: "email_already_exists",
            message: "An account with this email address already exists.",
          });
        case EmailSignUpError.EmailRequired:
        case EmailSignUpError.PasswordRequired:
          return this.response.badRequest();
        case EmailSignUpError.InvalidEmail:
          return this.response.badRequest({
            code: "invalid_email",
            message:
              "The email address you entered does not appear to be valid. Please check the format (e.g. name@example.com).",
          });
        case EmailSignUpError.InvalidPassword:
          return this.response.badRequest({
            code: "invalid_password",
            message:
              "Password must be between 10 and 128 characters, include an uppercase letter, a lowercase letter and a number, and avoid repeated or sequential runs.",
          });
        case AdminEmailSignUpError.InvalidFirstName:
          return this.response.badRequest({
            code: "invalid_first_name",
            message: "First name is not valid.",
          });
        case AdminEmailSignUpError.InvalidLastName:
          return this.response.badRequest({
            code: "invalid_last_name",
            message: "Last name is not valid.",
          });
        case AdminEmailSignUpError.InvalidGender:
          return this.response.badRequest({
            code: "invalid_gender",
            message: "The provided gender is not valid.",
          });
        case AdminEmailSignUpError.InvalidBirthday:
          return this.response.badRequest({
            code: "invalid_birthday",
            message: "The provided birthday is not valid.",
          });
        case AdminEmailSignUpError.InvalidPhone:
          return this.response.badRequest({
            code: "invalid_phone",
            message: "The provided phone number is not valid.",
          });
        default:
          return this.response.unexpected();
      }
    }

    const sent = await clients.features.messagings.mail.noreply.create(
      body.email,
      "admin/auth/dashboard-access",
      {
        email: body.email,
        username: `${body.firstname} ${body.lastname}`,
        password: body.password,
      },
    );

    if (!sent.ok) {
      console.error("[team/member/create] failed to queue dashboard-access mail", {
        email: body.email,
      });
    }

    return this.response.ok();
  }
}
