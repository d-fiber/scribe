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

import type { InternalTPushTemplatesRow } from "@scribe/foundation/lib/src/database/gen/rows.ts";
import { database } from "@scribe/foundation/lib/src/database/database.ts";
import { Pagination } from "@scribe/alchemy";
import { Failure, Ok, okay, type Result } from "@scribe/alchemy";
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
      return row ? new Ok(this.#domain(row)) : new Failure(PushTemplateError.NotFound);
    });
  }

  getByName(name: string): Promise<Result<PushTemplate, PushTemplateError>> {
    return this.guard(async () => {
      const row = await database
        .internal_t__push_templates()
        .where((f) => f.name.eq(name))
        .getOne();

      return row ? new Ok(this.#domain(row)) : new Failure(PushTemplateError.NotFound);
    });
  }

  list(options?: ListOptions): Promise<Result<Pagination<PushTemplate>, PushTemplateError>> {
    return this.guard(async () => {
      const offset = options?.offset ?? 0;
      const size = options?.size ?? DEFAULT_PAGE_SIZE;

      const rows = await database
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

      return new Ok(
        Pagination.of(
          rows.map((row) => this.#domain(row)),
          offset,
          size,
        ),
      );
    });
  }

  create(input: CreatePushTemplateInput): Promise<Result<PushTemplate, PushTemplateError>> {
    return this.guard(async () => {
      const row = await database.internal_t__push_templates().insertOne({
        name: input.name,
        title: input.title,
        body: input.body,
        data: input.data ?? null,
      });

      return row ? new Ok(this.#domain(row)) : new Failure(PushTemplateError.Backend);
    });
  }

  update(
    id: PushTemplateId,
    input: UpdatePushTemplateInput,
  ): Promise<Result<void, PushTemplateError>> {
    return this.guard(async () => {
      const existing = await this.#row(id);
      if (!existing) return new Failure(PushTemplateError.NotFound);

      const ok = await database
        .internal_t__push_templates()
        .where((f) => f.push_template_id.eq(id))
        .update(this.#patch(input));

      return ok ? okay : new Failure(PushTemplateError.Backend);
    });
  }

  remove(id: PushTemplateId): Promise<Result<void, PushTemplateError>> {
    return this.guard(async () => {
      const removed = await database
        .internal_t__push_templates()
        .where((f) => f.push_template_id.eq(id))
        .deleteOne((s) => ({ push_template_id: s.push_template_id }));

      return removed ? okay : new Failure(PushTemplateError.NotFound);
    });
  }

  #row(id: PushTemplateId): Promise<InternalTPushTemplatesRow | null> {
    return database
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
