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

import { Env } from "@scribe/host/env.ts";

function confirmUrl(isAdmin: boolean): string {
  const base = isAdmin ? Env.ADMIN_URL : Env.APP_URL;
  return `${base}/functions/v1/hosting/confirm`;
}

interface EmailData {
  email_action_type: string;
  token: string;
  token_hash: string;
}

export interface TemplateContext {
  readonly name: string | null;
  readonly locale: string | null;
  readonly recipientEmail: string;
}

export interface EmailTemplate {
  readonly name: string;
  readonly data: Record<string, unknown>;
}

export abstract class GoTrueAction {
  protected constructor(
    protected readonly raw: EmailData,
    protected readonly confirmBase: string,
    protected readonly audience: "admin" | "app",
  ) {}

  abstract template(context: TemplateContext): EmailTemplate;

  static from(
    data: Record<string, string>,
    isAdmin: boolean,
  ): GoTrueAction | null {
    const raw = data as unknown as EmailData;
    const confirmBase = confirmUrl(isAdmin);
    const audience = isAdmin ? "admin" : "app";
    switch (raw.email_action_type) {
      case "signup":
        return new SignupAction(raw, confirmBase, audience);
      case "recovery":
        return new RecoveryAction(raw, confirmBase, audience);
      case "email_change":
        return new EmailChangeAction(raw, confirmBase, audience);
      case "email":
      case "magiclink":
        return new EmailOtpAction(raw, confirmBase, audience);
      case "password_changed_notification":
        return new PasswordChangedAction(raw, confirmBase, audience);
      default:
        return null;
    }
  }
}

abstract class LinkAction extends GoTrueAction {
  protected abstract readonly linkType: string;
  protected abstract readonly templateName: string;

  template(context: TemplateContext): EmailTemplate {
    const confirmationLink =
      `${this.confirmBase}?token_hash=${this.raw.token_hash}&type=${this.linkType}`;
    return {
      name: `${this.audience}/${this.templateName}`,
      data: { name: context.name, confirmationLink, locale: context.locale },
    };
  }
}

abstract class OtpAction extends GoTrueAction {
  protected abstract readonly templateName: string;

  template(context: TemplateContext): EmailTemplate {
    return {
      name: `${this.audience}/${this.templateName}`,
      data: {
        name: context.name,
        code: this.raw.token,
        locale: context.locale,
      },
    };
  }
}

class SignupAction extends LinkAction {
  protected readonly linkType = "signup";
  protected readonly templateName = "auth/confirm-account";
}

class RecoveryAction extends LinkAction {
  protected readonly linkType = "recovery";
  protected readonly templateName = "account/reset-password";
}

class EmailOtpAction extends OtpAction {
  protected readonly templateName = "auth/verify-device";
}

class EmailChangeAction extends GoTrueAction {
  template(context: TemplateContext): EmailTemplate {
    const confirmationLink =
      `${this.confirmBase}?token_hash=${this.raw.token_hash}&type=email_change`;
    return {
      name: `${this.audience}/account/email-change`,
      data: {
        name: context.name,
        confirmationLink,
        newEmail: context.recipientEmail,
        locale: context.locale,
      },
    };
  }
}

class PasswordChangedAction extends GoTrueAction {
  template(context: TemplateContext): EmailTemplate {
    return {
      name: `${this.audience}/account/update-password`,
      data: { name: context.name, locale: context.locale },
    };
  }
}
