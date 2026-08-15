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

import { AccountRole } from "@scribe/core/contracts/account.ts";
import { clients } from "@scribe/host/dependencies/clients.ts";
import { SmsIntent } from "@scribe/host/dependencies/security/auth/src/client.ts";
import { rest } from "@scribe/host/dependencies/database/rest/rest.ts";
import { Env } from "@scribe/host/env.ts";
import type { SmsContent } from "@scribe/host/dependencies/features/messagings/sms/sms.ts";
import { projectHost, ProjectSlot } from "@scribe/host/project/mod.ts";
import {
  ApiContext,
  WebhookEndpoint,
} from "@scribe/core/kernel/endpoint/webhook/mod.ts";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

type SmsRenderer = (
  code: string,
  locale: string | null,
  appName: string,
) => SmsContent;

interface SmsTemplates {
  readonly changePhone: SmsRenderer;
  readonly confirmAccount: SmsRenderer;
  readonly resetPassword: SmsRenderer;
  readonly verifyDevice: SmsRenderer;
}

async function resolveLocale(
  uid: string,
  isAdmin: boolean,
): Promise<string | null> {
  const settings = isAdmin
    ? await rest
      .internal_t__admin_users_settings()
      .select((s) => ({ localization: s.localization }))
      .where((f) => f.admin_id.eq(uid))
      .getOne()
    : await rest
      .internal_t__app_user_settings()
      .select((s) => ({ localization: s.localization }))
      .where((f) => f.user_id.eq(uid))
      .getOne();
  return settings?.localization ?? null;
}

export class SendSmsHookEndpoint extends WebhookEndpoint {
  protected secret(): string {
    return Env.HOOK_SEND_SMS_SECRETS;
  }

  protected run(_ctx: ApiContext): Response {
    const { user, sms } = JSON.parse(this.raw);
    const to: string = user?.phone;
    const uid: string = user?.id;
    const code: string = sms?.otp;
    if (!to || !uid || !code) return this.response.unexpected();

    const isAdmin = user?.app_metadata?.role === AccountRole.Admin;
    const isPhoneConfirmed = Boolean(user?.phone_confirmed_at);

    EdgeRuntime.waitUntil(
      (async () => {
        try {
          const templates = await projectHost.load<SmsTemplates>(
            ProjectSlot.SmsTemplates,
          );
          if (!templates) return;
          const { changePhone, confirmAccount, resetPassword, verifyDevice } =
            templates;
          const locale = await resolveLocale(uid, isAdmin);
          const intent = await clients.security.auth.smsIntent.consume(to);

          const render = intent === SmsIntent.ResetPassword
            ? resetPassword
            : intent === SmsIntent.ChangePhone
            ? changePhone
            : isPhoneConfirmed
            ? verifyDevice
            : confirmAccount;

          const content = render(code, locale, Env.APP_NAME);

          const result = await clients.features.messagings.sms.account.send(
            to,
            content,
          );
          if (!result.ok) {
            console.error("[sms/gotrue] failed to send sms for:", to);
          }
        } catch (e) {
          console.error(
            "[sms/gotrue] failed to render or send the sms:",
            e,
          );
        }
      })(),
    );

    return this.response.ok();
  }
}
