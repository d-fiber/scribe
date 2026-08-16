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

import type { InternalTDynamicLinkStatisticsRow } from "@scribe/host/dependencies/database/rest/gen/rows.ts";
import { rest } from "@scribe/host/dependencies/database/rest/rest.ts";
import type { DeviceOs } from "@scribe/core/contracts/enums.ts";
import { type Pagination, pagination } from "@scribe/core/contracts/pagination.ts";
import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import { Repository } from "../core/repository.ts";
import type {
  DynamicLinkId,
  DynamicLinkPaginationOptions,
} from "../link/link.ts";
import { dynamicLinkStatisticsQueue } from "./_queue.ts";

type DynamicLinkStatisticRow = Pick<
  InternalTDynamicLinkStatisticsRow,
  | "statistic_id"
  | "short_link_id"
  | "user_id"
  | "device_id"
  | "ip_address"
  | "user_agent"
  | "referer"
  | "outcome"
  | "platform"
  | "created_at"
>;

const DEFAULT_PAGE_SIZE = 30;

export type DynamicLinkStatisticId = number;

export enum DynamicLinkOutcome {
  Served = "served",
  Redirected = "redirected",
  OpenedApp = "opened_app",
  StoreFallback = "store_fallback",
  Crawler = "crawler",
}

export interface DynamicLinkStatistic {
  readonly id: DynamicLinkStatisticId;
  readonly dynamicLinkId: DynamicLinkId;
  readonly userId: string | null;
  readonly deviceId: string | null;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly referer: string | null;
  readonly outcome: DynamicLinkOutcome;
  readonly platform: DeviceOs | null;
  readonly createdAt: number;
}

export interface RecordStatisticInput {
  readonly dynamicLinkId: DynamicLinkId;
  readonly outcome: DynamicLinkOutcome;
  readonly platform?: DeviceOs;
  readonly userId?: string;
  readonly deviceId?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly referer?: string;
}

export enum DynamicLinkStatisticsError {
  NotFound = "not_found",
  Backend = "backend",
}

export interface DynamicLinkStatisticsService {
  get(
    id: DynamicLinkStatisticId,
  ): Promise<Result<DynamicLinkStatistic, DynamicLinkStatisticsError>>;
  pagination(
    dynamicLinkId: DynamicLinkId,
    options?: DynamicLinkPaginationOptions,
  ): Promise<
    Result<Pagination<DynamicLinkStatistic>, DynamicLinkStatisticsError>
  >;
  record(
    input: RecordStatisticInput,
  ): Promise<Result<void, DynamicLinkStatisticsError>>;
  remove(
    id: DynamicLinkStatisticId,
  ): Promise<Result<void, DynamicLinkStatisticsError>>;
}

export class DynamicLinkStatisticsRepository
  extends Repository<DynamicLinkStatisticsError>
  implements DynamicLinkStatisticsService
{
  protected override get backendError(): DynamicLinkStatisticsError {
    return DynamicLinkStatisticsError.Backend;
  }

  get(
    id: DynamicLinkStatisticId,
  ): Promise<Result<DynamicLinkStatistic, DynamicLinkStatisticsError>> {
    return this.guard(async () => {
      const row = await rest
        .internal_t__dynamic_link_statistics()
        .where((f) => f.statistic_id.eq(id))
        .getOne();

      return row
        ? new OK(this.#domain(row))
        : new Failure(DynamicLinkStatisticsError.NotFound);
    });
  }

  pagination(
    dynamicLinkId: DynamicLinkId,
    options?: DynamicLinkPaginationOptions,
  ): Promise<
    Result<Pagination<DynamicLinkStatistic>, DynamicLinkStatisticsError>
  > {
    return this.guard(async () => {
      const offset = options?.offset ?? 0;
      const size = options?.size ?? DEFAULT_PAGE_SIZE;

      const rows = await rest
        .internal_t__dynamic_link_statistics()
        .select((s) => ({
          statistic_id: s.statistic_id,
          short_link_id: s.short_link_id,
          user_id: s.user_id,
          device_id: s.device_id,
          ip_address: s.ip_address,
          user_agent: s.user_agent,
          referer: s.referer,
          outcome: s.outcome,
          platform: s.platform,
          created_at: s.created_at,
        }))
        .where((f) => f.short_link_id.eq(dynamicLinkId))
        .order("created_at", { ascending: false })
        .range(offset, offset + size)
        .get();

      const items = rows.map((row) => this.#domain(row));
      return new OK(pagination(items, offset, size));
    });
  }

  record(
    input: RecordStatisticInput,
  ): Promise<Result<void, DynamicLinkStatisticsError>> {
    return this.guard(async () => {
      await dynamicLinkStatisticsQueue.push(input);
      return new OK();
    });
  }

  remove(
    id: DynamicLinkStatisticId,
  ): Promise<Result<void, DynamicLinkStatisticsError>> {
    return this.guard(async () => {
      const ok = await rest
        .internal_t__dynamic_link_statistics()
        .where((f) => f.statistic_id.eq(id))
        .delete();

      return ok ? new OK() : new Failure(DynamicLinkStatisticsError.Backend);
    });
  }

  #domain(row: DynamicLinkStatisticRow): DynamicLinkStatistic {
    return {
      id: row.statistic_id,
      dynamicLinkId: row.short_link_id,
      userId: row.user_id,
      deviceId: row.device_id,
      ipAddress: (row.ip_address as string | null) ?? null,
      userAgent: row.user_agent,
      referer: row.referer,
      outcome: row.outcome as DynamicLinkOutcome,
      platform: row.platform,
      createdAt: row.created_at,
    };
  }
}
