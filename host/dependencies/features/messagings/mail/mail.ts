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

import { Ok, type Result } from "@scribe/alchemy";
import { Failure } from "@scribe/alchemy";
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
    if (name === FOUNDATION_SMTP_ACCOUNTS.account) return new Ok(this.account);
    if (name === FOUNDATION_SMTP_ACCOUNTS.noreply) return new Ok(this.noreply);

    const cached = this.#senders.get(name);
    if (cached) return new Ok(cached);

    const found = await this.accounts.credentials(name);
    if (!found.ok) return new Failure(MailError.AccountNotFound);

    const credentials = found.data;
    return new Ok(this.#sender(name, {
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
