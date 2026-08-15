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
import { rest } from "@scribe/host/dependencies/database/rest/rest.ts";
import { Env } from "@scribe/host/env.ts";
import { projectHost, ProjectSlot } from "@scribe/host/project/mod.ts";
import {
  ApiContext,
  WebhookEndpoint,
} from "@scribe/core/kernel/endpoint/webhook/mod.ts";
import { GoTrueAction, type TemplateContext } from "./action.ts";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

async function resolveAdminContext(
  uid: string,
  recipientEmail: string,
): Promise<TemplateContext> {
  const [profile, settings] = await Promise.all([
    rest
      .internal_t__admin_users_profiles()
      .select((s) => ({ first_name: s.first_name }))
      .where((f) => f.admin_id.eq(uid))
      .getOne(),
    rest
      .internal_t__admin_users_settings()
      .select((s) => ({ localization: s.localization }))
      .where((f) => f.admin_id.eq(uid))
      .getOne(),
  ]);
  return {
    name: profile?.first_name ?? null,
    locale: settings?.localization ?? null,
    recipientEmail,
  };
}

interface AppUserContextResolver {
  resolveAppUserContext(uid: string, recipientEmail: string): Promise<TemplateContext>;
}

async function resolveAppContext(
  uid: string,
  recipientEmail: string,
): Promise<TemplateContext> {
  const project = await projectHost.load<AppUserContextResolver>(
    ProjectSlot.GotrueEmailContext,
  );
  if (!project) return { name: null, locale: null, recipientEmail };
  return await project.resolveAppUserContext(uid, recipientEmail);
}

export class SendEmailHookEndpoint extends WebhookEndpoint {
  protected secret(): string {
    return Env.HOOK_SEND_EMAIL_SECRETS;
  }

  protected run(_ctx: ApiContext): Response {
    const { user, email_data } = JSON.parse(this.raw);
    const to: string = user?.email;
    const uid: string = user?.id;
    if (!to || !uid) return this.response.unexpected();

    const isAdmin = user?.app_metadata?.role === AccountRole.Admin;
    const action = GoTrueAction.from(email_data, isAdmin);
    if (!action) return this.response.unexpected();

    EdgeRuntime.waitUntil(
      (async () => {
        const ctx =
          await (isAdmin
            ? resolveAdminContext(uid, to)
            : resolveAppContext(uid, to));
        const template = action.template(ctx);

        const result = await clients.features.messagings.mail.account.create(
          to,
          template.name,
          template.data,
        );
        if (!result.ok) {
          console.error("[email/gotrue] failed to queue mail for:", to);
        }
      })(),
    );

    return this.response.ok();
  }
}
