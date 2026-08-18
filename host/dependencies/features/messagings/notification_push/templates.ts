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

import type { InternalTPushTemplatesRow } from "@scribe/host/packages/foundation/database/rest/gen/rows.ts";
import { rest } from "@scribe/host/packages/foundation/database/rest/rest.ts";
import { type Pagination, pagination } from "@scribe/core/contracts/pagination.ts";
import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import { DEFAULT_PAGE_SIZE, type ListOptions } from "./core/list.ts";
import { Repository } from "./core/repository.ts";

type PushTemplateRow = Pick<
  InternalTPushTemplatesRow,
  | "push_template_id"
  | "name"
  | "title"
  | "body"
  | "data"
>;

export type PushTemplateId = number;

export interface PushTemplate {
  readonly id: PushTemplateId;
  readonly name: string;
  readonly title: string;
  readonly body: string;
  readonly data: Record<string, unknown> | null;
}

export interface CreatePushTemplateInput {
  readonly name: string;
  readonly title: string;
  readonly body: string;
  readonly data?: Record<string, unknown>;
}

export type UpdatePushTemplateInput = Partial<CreatePushTemplateInput>;

export enum PushTemplateError {
  NotFound = "not_found",
  Backend = "backend",
}

export interface PushTemplateService {
  getById(id: PushTemplateId): Promise<Result<PushTemplate, PushTemplateError>>;
  getByName(name: string): Promise<Result<PushTemplate, PushTemplateError>>;
  list(options?: ListOptions): Promise<Result<Pagination<PushTemplate>, PushTemplateError>>;
  create(input: CreatePushTemplateInput): Promise<Result<PushTemplate, PushTemplateError>>;
  update(
    id: PushTemplateId,
    input: UpdatePushTemplateInput,
  ): Promise<Result<void, PushTemplateError>>;
  remove(id: PushTemplateId): Promise<Result<void, PushTemplateError>>;
}

export class PushTemplateRepository extends Repository<PushTemplateError> implements PushTemplateService {
  protected override get backendError(): PushTemplateError {
    return PushTemplateError.Backend;
  }

  getById(id: PushTemplateId): Promise<Result<PushTemplate, PushTemplateError>> {
    return this.guard(async () => {
      const row = await this.#row(id);
      return row ? new OK(this.#domain(row)) : new Failure(PushTemplateError.NotFound);
    });
  }

  getByName(name: string): Promise<Result<PushTemplate, PushTemplateError>> {
    return this.guard(async () => {
      const row = await rest
        .internal_t__push_templates()
        .where((f) => f.name.eq(name))
        .getOne();

      return row ? new OK(this.#domain(row)) : new Failure(PushTemplateError.NotFound);
    });
  }

  list(options?: ListOptions): Promise<Result<Pagination<PushTemplate>, PushTemplateError>> {
    return this.guard(async () => {
      const offset = options?.offset ?? 0;
      const size = options?.size ?? DEFAULT_PAGE_SIZE;

      const rows = await rest
        .internal_t__push_templates()
        .select((s) => ({
          push_template_id: s.push_template_id,
          name: s.name,
          title: s.title,
          body: s.body,
          data: s.data,
        }))
        .order("push_template_id", { ascending: false })
        .range(offset, offset + size)
        .get();

      return new OK(
        pagination(
          rows.map((row) => this.#domain(row)),
          offset,
          size,
        ),
      );
    });
  }

  create(input: CreatePushTemplateInput): Promise<Result<PushTemplate, PushTemplateError>> {
    return this.guard(async () => {
      const row = await rest.internal_t__push_templates().insertOne({
        name: input.name,
        title: input.title,
        body: input.body,
        data: input.data ?? null,
      });

      return row ? new OK(this.#domain(row)) : new Failure(PushTemplateError.Backend);
    });
  }

  update(
    id: PushTemplateId,
    input: UpdatePushTemplateInput,
  ): Promise<Result<void, PushTemplateError>> {
    return this.guard(async () => {
      const existing = await this.#row(id);
      if (!existing) return new Failure(PushTemplateError.NotFound);

      const ok = await rest
        .internal_t__push_templates()
        .where((f) => f.push_template_id.eq(id))
        .update(this.#patch(input));

      return ok ? new OK() : new Failure(PushTemplateError.Backend);
    });
  }

  remove(id: PushTemplateId): Promise<Result<void, PushTemplateError>> {
    return this.guard(async () => {
      const removed = await rest
        .internal_t__push_templates()
        .where((f) => f.push_template_id.eq(id))
        .deleteOne((s) => ({ push_template_id: s.push_template_id }));

      return removed ? new OK() : new Failure(PushTemplateError.NotFound);
    });
  }

  #row(id: PushTemplateId): Promise<InternalTPushTemplatesRow | null> {
    return rest
      .internal_t__push_templates()
      .where((f) => f.push_template_id.eq(id))
      .getOne();
  }

  #patch(input: UpdatePushTemplateInput): Partial<InternalTPushTemplatesRow> {
    return {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.title !== undefined && { title: input.title }),
      ...(input.body !== undefined && { body: input.body }),
      ...(input.data !== undefined && { data: input.data }),
    };
  }

  #domain(row: PushTemplateRow): PushTemplate {
    return {
      id: row.push_template_id,
      name: row.name,
      title: row.title,
      body: row.body,
      data: row.data,
    };
  }
}
