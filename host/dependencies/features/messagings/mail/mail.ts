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

import { OK, type Result } from "@scribe/core/contracts/result.ts";
import { Failure } from "@scribe/core/contracts/result.ts";
import { Env } from "@scribe/host/env.ts";
import { FOUNDATION_SMTP_ACCOUNTS, SmtpAccountRepository, type SmtpAccountService } from "./accounts.ts";
import { EmailCampaignRepository, type EmailCampaignService } from "./campaigns.ts";
import { MailError, type MailSenderService, MailSenderSmtp, type SmtpAccountConfig } from "./send.ts";
import { MailStatisticRepository, type MailStatisticService } from "./statistics.ts";
import { EmailTemplateRepository, type EmailTemplateService } from "./templates.ts";

export * from "./accounts.ts";
export * from "./campaigns.ts";
export * from "./core/list.ts";
export * from "./send.ts";
export * from "./statistics.ts";
export * from "./templates.ts";

export class MailClient {
  readonly #senders = new Map<string, MailSenderService>();

  constructor(
    readonly statistics: MailStatisticService = new MailStatisticRepository(),
    readonly templates: EmailTemplateService = new EmailTemplateRepository(),
    readonly campaigns: EmailCampaignService = new EmailCampaignRepository(),
    readonly accounts: SmtpAccountService = new SmtpAccountRepository(),
  ) {}

  get account(): MailSenderService {
    return this.#sender(FOUNDATION_SMTP_ACCOUNTS.account, {
      host: Env.SMTP_ACCOUNT_HOST,
      port: Env.SMTP_ACCOUNT_PORT,
      user: Env.SMTP_ACCOUNT_USER,
      pass: Env.SMTP_ACCOUNT_PASS,
    });
  }

  get noreply(): MailSenderService {
    return this.#sender(FOUNDATION_SMTP_ACCOUNTS.noreply, {
      host: Env.SMTP_NOREPLY_HOST,
      port: Env.SMTP_NOREPLY_PORT,
      user: Env.SMTP_NOREPLY_USER,
      pass: Env.SMTP_NOREPLY_PASS,
    });
  }

  async for(name: string): Promise<Result<MailSenderService, MailError>> {
    if (name === FOUNDATION_SMTP_ACCOUNTS.account) return new OK(this.account);
    if (name === FOUNDATION_SMTP_ACCOUNTS.noreply) return new OK(this.noreply);

    const cached = this.#senders.get(name);
    if (cached) return new OK(cached);

    const found = await this.accounts.credentials(name);
    if (!found.ok) return new Failure(MailError.AccountNotFound);

    const credentials = found.data;
    return new OK(this.#sender(name, {
      host: credentials.host,
      port: credentials.port,
      user: credentials.username,
      pass: credentials.password,
    }));
  }

  #sender(name: string, config: SmtpAccountConfig): MailSenderService {
    const existing = this.#senders.get(name);
    if (existing) return existing;

    const created = new MailSenderSmtp(name, config);
    this.#senders.set(name, created);
    return created;
  }
}
