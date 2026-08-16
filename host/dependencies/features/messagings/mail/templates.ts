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

import type { InternalTEmailTemplatesRow } from "@scribe/host/dependencies/database/rest/gen/rows.ts";
import { rest } from "@scribe/host/dependencies/database/rest/rest.ts";
import { type Pagination, pagination } from "@scribe/core/contracts/pagination.ts";
import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import { DEFAULT_PAGE_SIZE, type ListOptions } from "./core/list.ts";
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
  list(options?: ListOptions): Promise<Result<Pagination<EmailTemplate>, EmailTemplateError>>;
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
      const row = await rest
        .internal_t__email_templates()
        .where((f) => f.email_template_id.eq(id))
        .getOne();

      return row ? new OK(this.#domain(row)) : new Failure(EmailTemplateError.NotFound);
    });
  }

  getByName(name: string): Promise<Result<EmailTemplate, EmailTemplateError>> {
    return this.guard(async () => {
      const row = await rest
        .internal_t__email_templates()
        .where((f) => f.name.eq(name))
        .getOne();

      return row ? new OK(this.#domain(row)) : new Failure(EmailTemplateError.NotFound);
    });
  }

  list(options?: ListOptions): Promise<Result<Pagination<EmailTemplate>, EmailTemplateError>> {
    return this.guard(async () => {
      const offset = options?.offset ?? 0;
      const size = options?.size ?? DEFAULT_PAGE_SIZE;

      const rows = await rest
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

      return new OK(pagination(rows.map((row) => this.#domain(row)), offset, size));
    });
  }

  create(input: CreateEmailTemplateInput): Promise<Result<EmailTemplate, EmailTemplateError>> {
    return this.guard(async () => {
      const row = await rest.internal_t__email_templates().insertOne({
        name: input.name,
        subject: input.subject,
        html: input.html ?? null,
        text: input.text,
      });

      return row ? new OK(this.#domain(row)) : new Failure(EmailTemplateError.Backend);
    });
  }

  update(
    id: EmailTemplateId,
    input: UpdateEmailTemplateInput,
  ): Promise<Result<void, EmailTemplateError>> {
    return this.guard(async () => {
      const ok = await rest
        .internal_t__email_templates()
        .where((f) => f.email_template_id.eq(id))
        .update(this.#patch(input));

      return ok ? new OK() : new Failure(EmailTemplateError.Backend);
    });
  }

  remove(id: EmailTemplateId): Promise<Result<void, EmailTemplateError>> {
    return this.guard(async () => {
      const ok = await rest
        .internal_t__email_templates()
        .where((f) => f.email_template_id.eq(id))
        .delete();

      return ok ? new OK() : new Failure(EmailTemplateError.Backend);
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
