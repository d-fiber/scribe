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

import type { InternalTRemoteConfigStatisticsRow } from "@scribe/host/dependencies/database/rest/gen/rows.ts";
import { rest } from "@scribe/host/dependencies/database/rest/rest.ts";
import type { RemoteConfigAudience } from "@scribe/core/contracts/enums.ts";
import { type Pagination, pagination } from "@scribe/core/contracts/pagination.ts";
import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import type { RemoteConfigId, RemoteConfigPaginationOptions } from "../config/config.ts";
import { Repository } from "../core/repository.ts";
import { remoteConfigStatisticsQueue } from "./_queue.ts";

const DEFAULT_PAGE_SIZE = 30;

export type RemoteConfigStatisticId = number;

export enum RemoteConfigOutcome {
  Served = "served",
  Unchanged = "unchanged",
}

export interface RemoteConfigStatistic {
  readonly id: RemoteConfigStatisticId;
  readonly remoteConfigId: RemoteConfigId;
  readonly userId: string | null;
  readonly audience: RemoteConfigAudience;
  readonly outcome: RemoteConfigOutcome;
  readonly createdAt: number;
}

export interface RecordRemoteConfigStatisticInput {
  readonly remoteConfigId: RemoteConfigId;
  readonly audience: RemoteConfigAudience;
  readonly outcome: RemoteConfigOutcome;
  readonly userId?: string;
}

export enum RemoteConfigStatisticsError {
  NotFound = "not_found",
  Backend = "backend",
}

export interface RemoteConfigStatisticsService {
  get(
    id: RemoteConfigStatisticId,
  ): Promise<Result<RemoteConfigStatistic, RemoteConfigStatisticsError>>;
  pagination(
    remoteConfigId: RemoteConfigId,
    options?: RemoteConfigPaginationOptions,
  ): Promise<
    Result<Pagination<RemoteConfigStatistic>, RemoteConfigStatisticsError>
  >;
  record(
    input: RecordRemoteConfigStatisticInput,
  ): Promise<Result<void, RemoteConfigStatisticsError>>;
  recordMany(
    inputs: readonly RecordRemoteConfigStatisticInput[],
  ): Promise<Result<void, RemoteConfigStatisticsError>>;
  remove(
    id: RemoteConfigStatisticId,
  ): Promise<Result<void, RemoteConfigStatisticsError>>;
}

export class RemoteConfigStatisticsRepository extends Repository<RemoteConfigStatisticsError>
  implements RemoteConfigStatisticsService {
  protected override get backendError(): RemoteConfigStatisticsError {
    return RemoteConfigStatisticsError.Backend;
  }

  get(
    id: RemoteConfigStatisticId,
  ): Promise<Result<RemoteConfigStatistic, RemoteConfigStatisticsError>> {
    return this.guard(async () => {
      const row = await rest
        .internal_t__remote_config_statistics()
        .where((f) => f.statistic_id.eq(id))
        .getOne();

      return row ? new OK(this.#domain(row)) : new Failure(RemoteConfigStatisticsError.NotFound);
    });
  }

  pagination(
    remoteConfigId: RemoteConfigId,
    options?: RemoteConfigPaginationOptions,
  ): Promise<
    Result<Pagination<RemoteConfigStatistic>, RemoteConfigStatisticsError>
  > {
    return this.guard(async () => {
      const offset = options?.offset ?? 0;
      const size = options?.size ?? DEFAULT_PAGE_SIZE;

      const rows = await rest
        .internal_t__remote_config_statistics()
        .where((f) => f.remote_config_id.eq(remoteConfigId))
        .order("created_at", { ascending: false })
        .range(offset, offset + size)
        .get();

      const items = rows.map((row) => this.#domain(row));
      return new OK(pagination(items, offset, size));
    });
  }

  record(
    input: RecordRemoteConfigStatisticInput,
  ): Promise<Result<void, RemoteConfigStatisticsError>> {
    return this.recordMany([input]);
  }

  recordMany(
    inputs: readonly RecordRemoteConfigStatisticInput[],
  ): Promise<Result<void, RemoteConfigStatisticsError>> {
    return this.guard(async () => {
      if (inputs.length === 0) return new OK();

      await remoteConfigStatisticsQueue.pushMany(inputs);
      return new OK();
    });
  }

  remove(
    id: RemoteConfigStatisticId,
  ): Promise<Result<void, RemoteConfigStatisticsError>> {
    return this.guard(async () => {
      const ok = await rest
        .internal_t__remote_config_statistics()
        .where((f) => f.statistic_id.eq(id))
        .delete();

      return ok ? new OK() : new Failure(RemoteConfigStatisticsError.Backend);
    });
  }

  #domain(row: InternalTRemoteConfigStatisticsRow): RemoteConfigStatistic {
    return {
      id: row.statistic_id,
      remoteConfigId: row.remote_config_id,
      userId: row.user_id,
      audience: row.audience,
      outcome: row.outcome as RemoteConfigOutcome,
      createdAt: row.created_at,
    };
  }
}
