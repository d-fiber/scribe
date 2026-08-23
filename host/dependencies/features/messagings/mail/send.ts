// Copyright (C) 2026 Fiber
//
// This Source Code Form is subject to the terms of the Mozilla Public License,
// v. 2.0. If a copy of the MPL was not distributed with this file, You can
// obtain one at https://mozilla.org/MPL/2.0/.
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
// - Combine it with files under any other licence, proprietary ones included,
//   and licence that larger work on your own terms.
//
// What you must do in return:
// - Keep this notice on every file you received it on.
// - Publish, under these same terms, the source of every file covered by them
//   that you distribute, including the ones you changed, so that whoever
//   receives your version can obtain that source.
// - Leave Fiber out of it: the name "Fiber", its branding, its logos and its
//   trademarks may not be used to endorse or promote what you build, and this
//   licence grants no right to them.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY
// OR CONDITION OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
// WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
// NON-INFRINGEMENT. IN NO EVENT SHALL FIBER BE LIABLE FOR ANY DIRECT, INDIRECT,
// INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING BUT NOT
// LIMITED TO LOSS OF USE, DATA, PROFITS, OR BUSINESS INTERRUPTION) ARISING OUT
// OF OR RELATED TO THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY
// KIND OF LEGAL CLAIM.
//
// This header is a summary written for convenience. Where it differs from the
// LICENSE file, the LICENSE file governs.

import type { InternalTMailsRow } from "@scribe/foundation/lib/src/database/gen/rows.ts";
import { database } from "@scribe/foundation/lib/src/database/database.ts";
import { Pagination } from "@scribe/alchemy";
import { Failure, Ok, okay, type Result } from "@scribe/alchemy";
import { Env } from "@scribe/host/env.ts";
import nodemailer from "nodemailer";
import type { PageRequest } from "@scribe/alchemy";
import { DEFAULT_PAGE_SIZE } from "./core/list.ts";
import { Repository } from "./core/repository.ts";
import type { EmailTemplateId } from "./templates.ts";

type MailRow = Pick<
  InternalTMailsRow,
  | "mail_id"
  | "recipient"
  | "subject"
  | "email_template_id"
  | "data"
  | "status"
  | "account"
  | "tracking_token"
  | "created_at"
  | "updated_at"
>;

const TRACKING_TOKEN_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const TRACKING_TOKEN_LENGTH = 15;

export type MailId = number;

export enum MailStatus {
  Pending = "pending",
  Sent = "sent",
  Failed = "failed",
}

export interface Mail {
  readonly id: MailId;
  readonly recipient: string;
  readonly subject: string | null;
  readonly emailTemplateId: EmailTemplateId | null;
  readonly data: Record<string, unknown> | null;
  readonly status: MailStatus;
  readonly smtpAccount: string;
  readonly openToken: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface EmailAttachment {
  readonly filename: string;
  readonly content: string;
  readonly contentType: string;
}

export interface EmailContent {
  readonly subject: string;
  readonly html?: string;
  readonly text: string;
  readonly attachments?: EmailAttachment[];
}

export interface MailListOptions extends PageRequest {
  readonly recipient?: string;
}

export interface SmtpAccountConfig {
  readonly host: string;
  readonly port: number;
  readonly user: string;
  readonly pass: string;
}

export enum MailError {
  NotFound = "not_found",
  TemplateNotFound = "template_not_found",
  AccountNotFound = "account_not_found",
  SmtpFailed = "smtp_failed",
  Backend = "backend",
}

export interface MailSenderService {
  create(
    to: string,
    templateName: string,
    data: Record<string, unknown>,
  ): Promise<Result<Mail, MailError>>;
  createRaw(
    to: string,
    content: EmailContent,
  ): Promise<Result<Mail, MailError>>;
  deliver(
    mailId: MailId,
    content: EmailContent,
    from?: string,
  ): Promise<Result<void, MailError>>;
  get(mailId: MailId): Promise<Result<Mail, MailError>>;
  getByOpenToken(openToken: string): Promise<Result<Mail, MailError>>;
  list(options?: MailListOptions): Promise<Result<Pagination<Mail>, MailError>>;
  remove(mailId: MailId): Promise<Result<void, MailError>>;
}

function generateTrackingToken(): string {
  const bytes = new Uint8Array(TRACKING_TOKEN_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(
    bytes,
    (b) => TRACKING_TOKEN_ALPHABET[b % TRACKING_TOKEN_ALPHABET.length],
  ).join("");
}

export class MailSenderSmtp extends Repository<MailError> implements MailSenderService {
  readonly #transport: nodemailer.Transporter;

  constructor(
    private readonly account: string,
    private readonly config: SmtpAccountConfig,
  ) {
    super();
    this.#transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
    });
  }

  protected override get backendError(): MailError {
    return MailError.Backend;
  }

  create(
    to: string,
    templateName: string,
    data: Record<string, unknown>,
  ): Promise<Result<Mail, MailError>> {
    return this.guard(async () => {
      const template = await database
        .internal_t__email_templates()
        .where((f) => f.name.eq(templateName))
        .getOne();
      if (!template) return new Failure(MailError.TemplateNotFound);

      const row = await this.#insert(to, template.email_template_id, data);
      return row ? new Ok(this.#domain(row)) : new Failure(MailError.Backend);
    });
  }

  createRaw(
    to: string,
    content: EmailContent,
  ): Promise<Result<Mail, MailError>> {
    return this.guard(async () => {
      const row = await this.#insert(
        to,
        null,
        content as unknown as Record<string, unknown>,
      );
      return row ? new Ok(this.#domain(row)) : new Failure(MailError.Backend);
    });
  }

  deliver(
    mailId: MailId,
    content: EmailContent,
    from?: string,
  ): Promise<Result<void, MailError>> {
    return this.guard(async () => {
      const found = await this.get(mailId);
      if (!found.ok) return new Failure(found.error);

      const sent = await this.#transmit(found.data, content, from);

      await database
        .internal_t__mails()
        .where((f) => f.mail_id.eq(mailId))
        .update({
          subject: content.subject,
          status: sent ? MailStatus.Sent : MailStatus.Failed,
        });

      return sent ? okay : new Failure(MailError.SmtpFailed);
    });
  }

  get(mailId: MailId): Promise<Result<Mail, MailError>> {
    return this.guard(async () => {
      const row = await database
        .internal_t__mails()
        .where((f) => f.mail_id.eq(mailId))
        .getOne();

      return row ? new Ok(this.#domain(row)) : new Failure(MailError.NotFound);
    });
  }

  getByOpenToken(openToken: string): Promise<Result<Mail, MailError>> {
    return this.guard(async () => {
      const row = await database
        .internal_t__mails()
        .where((f) => f.tracking_token.eq(openToken))
        .getOne();

      return row ? new Ok(this.#domain(row)) : new Failure(MailError.NotFound);
    });
  }

  list(
    options?: MailListOptions,
  ): Promise<Result<Pagination<Mail>, MailError>> {
    return this.guard(async () => {
      const offset = options?.offset ?? 0;
      const size = options?.size ?? DEFAULT_PAGE_SIZE;

      let query = database
        .internal_t__mails()
        .select((s) => ({
          mail_id: s.mail_id,
          recipient: s.recipient,
          subject: s.subject,
          email_template_id: s.email_template_id,
          data: s.data,
          status: s.status,
          account: s.account,
          tracking_token: s.tracking_token,
          created_at: s.created_at,
          updated_at: s.updated_at,
        }))
        .order("created_at", { ascending: false });
      if (options?.recipient !== undefined) {
        const recipient = options.recipient;
        query = query.where((f) => f.recipient.eq(recipient));
      }

      const rows = await query.range(offset, offset + size).get();
      return new Ok(
        Pagination.of(
          rows.map((row) => this.#domain(row)),
          offset,
          size,
        ),
      );
    });
  }

  remove(mailId: MailId): Promise<Result<void, MailError>> {
    return this.guard(async () => {
      const ok = await database
        .internal_t__mails()
        .where((f) => f.mail_id.eq(mailId))
        .delete();

      return ok ? okay : new Failure(MailError.Backend);
    });
  }

  #insert(
    to: string,
    emailTemplateId: EmailTemplateId | null,
    data: Record<string, unknown>,
  ): Promise<InternalTMailsRow | null> {
    return database.internal_t__mails().insertOne({
      recipient: to,
      email_template_id: emailTemplateId,
      data,
      status: MailStatus.Pending,
      account: this.account,
      tracking_token: generateTrackingToken(),
    });
  }

  async #transmit(
    mail: Mail,
    content: EmailContent,
    from?: string,
  ): Promise<boolean> {
    const html = content.html
      ? `${content.html}<img src="${Env.APP_URL}/v1/app/mail/open/${mail.openToken}" width="1" height="1" alt="" style="display:none" />`
      : content.html;

    try {
      await this.#transport.sendMail({
        from: from ?? `${Env.APP_NAME} <${this.config.user}>`,
        to: mail.recipient,
        subject: content.subject,
        html,
        text: content.text,
        attachments: content.attachments,
      });
      return true;
    } catch (e) {
      console.error("[mail.deliver] SMTP send failed", {
        mail_id: mail.id,
        error: e instanceof Error ? e.message : String(e),
      });
      return false;
    }
  }

  #domain(row: MailRow): Mail {
    return {
      id: row.mail_id,
      recipient: row.recipient,
      subject: row.subject,
      emailTemplateId: row.email_template_id,
      data: row.data,
      status: row.status as MailStatus,
      smtpAccount: row.account,
      openToken: row.tracking_token,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
