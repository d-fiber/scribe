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
import type { EmailContent, EmailTemplate, Mail } from "@scribe/host/dependencies/features/messagings/mail/mail.ts";
import { MailStatus } from "@scribe/host/dependencies/features/messagings/mail/mail.ts";
import { Required } from "@scribe/core/kernel/validation/schema.ts";
import { ApiContext, ServiceEndpoint } from "@scribe/core/kernel/endpoint/service.ts";
import { rendererFor } from "./_renderers.ts";

function fill(text: string, data: Record<string, unknown>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    const value = data[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

function interpolate(
  template: EmailTemplate,
  data: Record<string, unknown>,
): EmailContent | null {
  if (!template.subject || !template.text) return null;

  return {
    subject: fill(template.subject, data),
    html: template.html ? fill(template.html, data) : undefined,
    text: fill(template.text, data),
  };
}

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

async function resolveContent(mail: Mail): Promise<EmailContent | null> {
  if (mail.emailTemplateId === null) {
    return (mail.data as unknown as EmailContent) ?? null;
  }

  const template = await clients.features.messagings.mail.templates.getById(
    mail.emailTemplateId,
  );
  if (!template.ok) return null;

  const render = rendererFor(template.data.name);
  if (render) return await render(mail.data ?? {});

  return interpolate(template.data, mail.data ?? {});
}

export class SenderEndpoint extends ServiceEndpoint {
  protected run(ctx: ApiContext): Response {
    const body = ctx.body({ mail_id: Required(Number) });
    if (!body) return this.response.badRequest();

    EdgeRuntime.waitUntil(
      (async () => {
        const found = await clients.features.messagings.mail.noreply.get(
          body.mail_id,
        );
        if (!found.ok || found.data.status !== MailStatus.Pending) return;

        const mail = found.data;

        const resolve = await resolveContent(mail);
        if (!resolve) return;

        const sender = await clients.features.messagings.mail.for(mail.smtpAccount);
        if (!sender.ok) return;

        await sender.data.deliver(body.mail_id, resolve);
      })(),
    );

    return this.response.ok();
  }
}
