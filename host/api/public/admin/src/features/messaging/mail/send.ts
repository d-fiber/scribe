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
import type { EmailContent, Mail } from "@scribe/host/dependencies/features/messagings/mail/mail.ts";
import { FOUNDATION_SMTP_ACCOUNTS, MailError } from "@scribe/host/dependencies/features/messagings/mail/mail.ts";
import { ApiContext } from "@scribe/core/kernel/endpoint/api.ts";
import { AdminMailEndpoint, objectOrNull, SEND_RATE_LIMIT, trimmedOrNull } from "./_shared.ts";

const RECIPIENT_PATTERN = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;

export class AdminMailSendEndpoint extends AdminMailEndpoint {
  protected rateLimit() {
    return SEND_RATE_LIMIT;
  }

  protected async run(ctx: ApiContext): Promise<Response> {
    const body = objectOrNull(ctx.raw());
    if (!body) return this.invalidBody();

    const to = trimmedOrNull(body.to);
    if (!to || !RECIPIENT_PATTERN.test(to)) {
      return this.invalidField("to", "a valid email address");
    }

    const account = trimmedOrNull(body.account) ?? FOUNDATION_SMTP_ACCOUNTS.account;
    const templateName = trimmedOrNull(body.template_name);
    const content = this.#contentOrNull(body);

    if (templateName && content) {
      return this.response.badRequest({
        code: "ambiguous_payload",
        message: "Provide either `template_name` or an inline `subject`/`text`, not both.",
      });
    }
    if (!templateName && !content) {
      return this.invalidField("template_name", "provided, or an inline `subject` and `text`");
    }

    const data = body.data === undefined ? {} : objectOrNull(body.data);
    if (!data) return this.invalidField("data", "a JSON object");

    const sender = await clients.features.messagings.mail.for(account);
    if (!sender.ok) {
      return this.response.unprocessable({
        code: "account_not_found",
        message: "`account` does not match a configured SMTP account.",
      });
    }

    const created = templateName
      ? await sender.data.create(to, templateName, data)
      : await sender.data.createRaw(to, content as EmailContent);
    if (!created.ok) return this.#failure(created.error);

    return this.response.accepted({ data: this.#payload(created.data) });
  }

  #contentOrNull(body: Record<string, unknown>): EmailContent | null {
    const subject = trimmedOrNull(body.subject);
    const text = trimmedOrNull(body.text);
    if (!subject || !text) return null;

    return {
      subject,
      text,
      ...(typeof body.html === "string" ? { html: body.html } : {}),
    };
  }

  #failure(error: MailError): Response {
    return error === MailError.TemplateNotFound
      ? this.response.unprocessable({
        code: "template_not_found",
        message: "`template_name` does not match an existing email template.",
      })
      : this.response.unexpected();
  }

  #payload(mail: Mail) {
    return {
      id: mail.id,
      recipient: mail.recipient,
      status: mail.status,
      smtp_account: mail.smtpAccount,
      created_at: mail.createdAt,
    };
  }
}
