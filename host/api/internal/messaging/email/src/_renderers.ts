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

import { EmailContent } from "@scribe/host/dependencies/features/messagings/mail/mail.ts";
import { Env } from "@scribe/host/env.ts";
import { projectHost, ProjectSlot } from "@scribe/host/project/mod.ts";

type Renderer = (data: Record<string, unknown>) => Promise<EmailContent>;

type TemplateGroup = Record<string, Renderer>;

interface MailTemplates {
  readonly admin: TemplateGroup;
  readonly app: TemplateGroup;
}

let RENDERERS: Record<string, Renderer> = {};

const templates = await projectHost.load<MailTemplates>(ProjectSlot.MailTemplates);

if (templates) {
  const { admin, app } = templates;
  const appName = Env.APP_NAME;
  RENDERERS = {
    "app/auth/confirm-account": (d) =>
      app.confirmAccount({
        name: d.name as string | null,
        confirmationLink: d.confirmationLink as string,
        locale: d.locale as string | null,
        appName,
      }),
    "app/auth/verify-device": (d) =>
      app.verifyDevice({
        name: d.name as string | null,
        code: d.code as string,
        locale: d.locale as string | null,
        appName,
      }),
    "admin/auth/verify-device": (d) =>
      admin.verifyDevice({
        name: d.name as string | null,
        code: d.code as string,
        locale: d.locale as string | null,
        appName,
      }),
    "app/account/reset-password": (d) =>
      app.resetPassword({
        name: d.name as string | null,
        resetLink: d.confirmationLink as string,
        locale: d.locale as string | null,
        appName,
      }),
    "admin/account/reset-password": (d) =>
      admin.resetPassword({
        name: d.name as string | null,
        resetLink: d.confirmationLink as string,
        locale: d.locale as string | null,
        appName,
      }),
    "app/account/email-change": (d) =>
      app.emailChange({
        name: d.name as string | null,
        confirmationLink: d.confirmationLink as string,
        newEmail: d.newEmail as string,
        locale: d.locale as string | null,
        appName,
      }),
    "app/account/update-password": (d) =>
      app.updatePassword({
        name: d.name as string | null,
        locale: d.locale as string | null,
        appName,
      }),
    "admin/account/update-password": (d) =>
      admin.updatePassword({
        name: d.name as string | null,
        locale: d.locale as string | null,
        appName,
      }),
    "app/account/delete-account": (d) =>
      app.deleteAccount({
        name: d.name as string | null,
        email: d.email as string,
        locale: d.locale as string | null,
        appName,
      }),
    "admin/account/delete-account": (d) =>
      admin.deleteAccount({
        name: d.name as string | null,
        email: d.email as string,
        locale: d.locale as string | null,
        appName,
      }),
    "app/account/new-device": (d) =>
      app.newDevice({
        name: d.name as string | null,
        model: d.model as string,
        os: d.os as string,
        ip: d.ip as string,
        city: d.city as string,
        country: d.country as string,
        locale: d.locale as string | null,
        appName,
      }),
    "admin/account/new-device": (d) =>
      admin.newDevice({
        name: d.name as string | null,
        model: d.model as string,
        os: d.os as string,
        ip: d.ip as string,
        city: d.city as string,
        country: d.country as string,
        locale: d.locale as string | null,
        appName,
      }),
    "admin/auth/dashboard-access": (d) =>
      admin.dashboardAccess({
        email: d.email as string,
        username: d.username as string,
        password: d.password as string,
        locale: d.locale as string | null,
        appName,
      }),
    "admin/account/vpn-access": (d) =>
      admin.vpnAccess({
        email: d.email as string,
        url: d.url as string,
        locale: d.locale as string | null,
        firstName: d.firstName as string | null,
        lastName: d.lastName as string | null,
        appName,
      }),
    "admin/account/vpn-expiry-reminder": (d) =>
      admin.vpnExpiryReminder({
        email: d.email as string,
        daysRemaining: d.days_remaining as number,
        locale: d.locale as string | null,
        appName,
      }),
  };
}

export function rendererFor(templateName: string): Renderer | null {
  return RENDERERS[templateName] ?? null;
}
