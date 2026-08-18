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

import type { InternalTMailStatisticsRow } from "@scribe/foundation/src/database/gen/rows.ts";
import { database } from "@scribe/foundation/src/database/database.ts";
import { type Pagination, pagination } from "@scribe/core/contracts/pagination.ts";
import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import { DEFAULT_PAGE_SIZE, type ListOptions } from "./core/list.ts";
import { Repository } from "./core/repository.ts";
import type { MailId } from "./send.ts";

type MailStatisticRow = Pick<
  InternalTMailStatisticsRow,
  | "statistic_id"
  | "mail_id"
  | "ip_address"
  | "user_agent"
  | "created_at"
>;

export type MailStatisticId = number;

export interface MailStatistic {
  readonly id: MailStatisticId;
  readonly mailId: MailId;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly createdAt: number;
}

export interface RecordMailStatisticInput {
  readonly mailId: MailId;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export enum MailStatisticError {
  NotFound = "not_found",
  Backend = "backend",
}

export interface MailStatisticService {
  get(id: MailStatisticId): Promise<Result<MailStatistic, MailStatisticError>>;
  list(
    mailId: MailId,
    options?: ListOptions,
  ): Promise<Result<Pagination<MailStatistic>, MailStatisticError>>;
  record(
    input: RecordMailStatisticInput,
  ): Promise<Result<void, MailStatisticError>>;
  remove(id: MailStatisticId): Promise<Result<void, MailStatisticError>>;
}

export class MailStatisticRepository extends Repository<MailStatisticError> implements MailStatisticService {
  protected override get backendError(): MailStatisticError {
    return MailStatisticError.Backend;
  }

  get(id: MailStatisticId): Promise<Result<MailStatistic, MailStatisticError>> {
    return this.guard(async () => {
      const row = await database
        .internal_t__mail_statistics()
        .where((f) => f.statistic_id.eq(id))
        .getOne();

      return row ? new OK(this.#domain(row)) : new Failure(MailStatisticError.NotFound);
    });
  }

  list(
    mailId: MailId,
    options?: ListOptions,
  ): Promise<Result<Pagination<MailStatistic>, MailStatisticError>> {
    return this.guard(async () => {
      const offset = options?.offset ?? 0;
      const size = options?.size ?? DEFAULT_PAGE_SIZE;

      const rows = await database
        .internal_t__mail_statistics()
        .select((s) => ({
          statistic_id: s.statistic_id,
          mail_id: s.mail_id,
          ip_address: s.ip_address,
          user_agent: s.user_agent,
          created_at: s.created_at,
        }))
        .where((f) => f.mail_id.eq(mailId))
        .order("created_at", { ascending: false })
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

  record(
    input: RecordMailStatisticInput,
  ): Promise<Result<void, MailStatisticError>> {
    return this.guard(async () => {
      const row = await database.internal_t__mail_statistics().insertOne({
        mail_id: input.mailId,
        ip_address: input.ipAddress ?? null,
        user_agent: input.userAgent ?? null,
      });

      return row ? new OK() : new Failure(MailStatisticError.Backend);
    });
  }

  remove(id: MailStatisticId): Promise<Result<void, MailStatisticError>> {
    return this.guard(async () => {
      const ok = await database
        .internal_t__mail_statistics()
        .where((f) => f.statistic_id.eq(id))
        .delete();

      return ok ? new OK() : new Failure(MailStatisticError.Backend);
    });
  }

  #domain(row: MailStatisticRow): MailStatistic {
    return {
      id: row.statistic_id,
      mailId: row.mail_id,
      ipAddress: (row.ip_address as string | null) ?? null,
      userAgent: row.user_agent,
      createdAt: row.created_at,
    };
  }
}
