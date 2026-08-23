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

import type { InternalTEmailTemplatesRow } from "@scribe/foundation/lib/src/database/gen/rows.ts";
import { database } from "@scribe/foundation/lib/src/database/database.ts";
import { Pagination } from "@scribe/alchemy";
import { Failure, Ok, okay, type Result } from "@scribe/alchemy";
import type { PageRequest } from "@scribe/alchemy";
import { DEFAULT_PAGE_SIZE } from "./core/list.ts";
import { Repository } from "./core/repository.ts";

type EmailTemplateRow = Pick<
  InternalTEmailTemplatesRow,
  | "email_template_id"
  | "name"
  | "subject"
  | "html"
  | "text"
>;

export type EmailTemplateId = number;

export interface EmailTemplate {
  readonly id: EmailTemplateId;
  readonly name: string;
  readonly subject: string | null;
  readonly html: string | null;
  readonly text: string | null;
}

export interface CreateEmailTemplateInput {
  readonly name: string;
  readonly subject: string;
  readonly html?: string;
  readonly text: string;
}

export type UpdateEmailTemplateInput = Partial<CreateEmailTemplateInput>;

export enum EmailTemplateError {
  NotFound = "not_found",
  Backend = "backend",
}

export interface EmailTemplateService {
  getById(id: EmailTemplateId): Promise<Result<EmailTemplate, EmailTemplateError>>;
  getByName(name: string): Promise<Result<EmailTemplate, EmailTemplateError>>;
  list(options?: PageRequest): Promise<Result<Pagination<EmailTemplate>, EmailTemplateError>>;
  create(input: CreateEmailTemplateInput): Promise<Result<EmailTemplate, EmailTemplateError>>;
  update(
    id: EmailTemplateId,
    input: UpdateEmailTemplateInput,
  ): Promise<Result<void, EmailTemplateError>>;
  remove(id: EmailTemplateId): Promise<Result<void, EmailTemplateError>>;
}

export class EmailTemplateRepository extends Repository<EmailTemplateError> implements EmailTemplateService {
  protected override get backendError(): EmailTemplateError {
    return EmailTemplateError.Backend;
  }

  getById(id: EmailTemplateId): Promise<Result<EmailTemplate, EmailTemplateError>> {
    return this.guard(async () => {
      const row = await database
        .internal_t__email_templates()
        .where((f) => f.email_template_id.eq(id))
        .getOne();

      return row ? new Ok(this.#domain(row)) : new Failure(EmailTemplateError.NotFound);
    });
  }

  getByName(name: string): Promise<Result<EmailTemplate, EmailTemplateError>> {
    return this.guard(async () => {
      const row = await database
        .internal_t__email_templates()
        .where((f) => f.name.eq(name))
        .getOne();

      return row ? new Ok(this.#domain(row)) : new Failure(EmailTemplateError.NotFound);
    });
  }

  list(options?: PageRequest): Promise<Result<Pagination<EmailTemplate>, EmailTemplateError>> {
    return this.guard(async () => {
      const offset = options?.offset ?? 0;
      const size = options?.size ?? DEFAULT_PAGE_SIZE;

      const rows = await database
        .internal_t__email_templates()
        .select((s) => ({
          email_template_id: s.email_template_id,
          name: s.name,
          subject: s.subject,
          html: s.html,
          text: s.text,
        }))
        .order("email_template_id", { ascending: false })
        .range(offset, offset + size)
        .get();

      return new Ok(Pagination.of(rows.map((row) => this.#domain(row)), offset, size));
    });
  }

  create(input: CreateEmailTemplateInput): Promise<Result<EmailTemplate, EmailTemplateError>> {
    return this.guard(async () => {
      const row = await database.internal_t__email_templates().insertOne({
        name: input.name,
        subject: input.subject,
        html: input.html ?? null,
        text: input.text,
      });

      return row ? new Ok(this.#domain(row)) : new Failure(EmailTemplateError.Backend);
    });
  }

  update(
    id: EmailTemplateId,
    input: UpdateEmailTemplateInput,
  ): Promise<Result<void, EmailTemplateError>> {
    return this.guard(async () => {
      const ok = await database
        .internal_t__email_templates()
        .where((f) => f.email_template_id.eq(id))
        .update(this.#patch(input));

      return ok ? okay : new Failure(EmailTemplateError.Backend);
    });
  }

  remove(id: EmailTemplateId): Promise<Result<void, EmailTemplateError>> {
    return this.guard(async () => {
      const ok = await database
        .internal_t__email_templates()
        .where((f) => f.email_template_id.eq(id))
        .delete();

      return ok ? okay : new Failure(EmailTemplateError.Backend);
    });
  }

  #patch(input: UpdateEmailTemplateInput): Partial<InternalTEmailTemplatesRow> {
    return {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.subject !== undefined && { subject: input.subject }),
      ...(input.html !== undefined && { html: input.html }),
      ...(input.text !== undefined && { text: input.text }),
    };
  }

  #domain(row: EmailTemplateRow): EmailTemplate {
    return {
      id: row.email_template_id,
      name: row.name,
      subject: row.subject,
      html: row.html,
      text: row.text,
    };
  }
}
