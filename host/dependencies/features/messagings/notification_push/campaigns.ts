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

import type { InternalTPushCampaignsRow } from "@scribe/host/packages/foundation/database/rest/gen/rows.ts";
import { rest } from "@scribe/host/packages/foundation/database/rest/rest.ts";
import type { DeviceOs, Localization } from "@scribe/core/contracts/enums.ts";
import { type Pagination, pagination } from "@scribe/core/contracts/pagination.ts";
import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import type { CronTimezone } from "@scribe/core/runtime/event_driven/cron/timezone.ts";
import { Cron } from "croner";
import { DEFAULT_PAGE_SIZE, type ListOptions } from "./core/list.ts";
import { Repository } from "./core/repository.ts";
import type { PushTemplateId } from "./templates.ts";

type PushCampaignRow = Pick<
  InternalTPushCampaignsRow,
  | "push_campaign_id"
  | "push_template_id"
  | "filters"
  | "is_active"
  | "next_run_at"
  | "last_run_at"
  | "created_at"
  | "updated_at"
  | "schedule_kind"
  | "scheduled_at"
  | "cron_expression"
  | "schedule_timezone"
>;

export interface PushCampaignFilters {
  readonly deviceOs?: DeviceOs | null;
  readonly appVersion?: string | null;
  readonly appVersionMin?: string | null;
  readonly appVersionMax?: string | null;
  readonly country?: string | null;
  readonly localization?: Localization | null;
  readonly isEmailVerified?: boolean | null;
  readonly isPhoneVerified?: boolean | null;
  readonly createdAfter?: number | null;
  readonly createdBefore?: number | null;
  readonly inactiveDays?: number | null;
}

export type PushCampaignId = number;

export interface OnceSchedule {
  readonly kind: "once";
  readonly at: number;
}

export interface CronSchedule {
  readonly kind: "cron";
  readonly expression: string;
  readonly timezone: CronTimezone;
}

export type PushCampaignSchedule = OnceSchedule | CronSchedule;

export interface PushCampaign {
  readonly id: PushCampaignId;
  readonly pushTemplateId: PushTemplateId;
  readonly schedule: PushCampaignSchedule;
  readonly filters: Record<string, unknown> | null;
  readonly isActive: boolean;
  readonly nextRunAt: number | null;
  readonly lastRunAt: number | null;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface CreatePushCampaignInput {
  readonly pushTemplateId: PushTemplateId;
  readonly schedule: PushCampaignSchedule;
  readonly filters?: PushCampaignFilters;
  readonly extraFilters?: Record<string, unknown>;
  readonly isActive?: boolean;
}

export type UpdatePushCampaignInput = Partial<CreatePushCampaignInput>;

export interface PushCampaignListOptions extends ListOptions {
  readonly activeOnly?: boolean;
}

export enum PushCampaignError {
  NotFound = "not_found",
  InvalidSchedule = "invalid_schedule",
  Backend = "backend",
}

export interface PushCampaignService {
  get(id: PushCampaignId): Promise<Result<PushCampaign, PushCampaignError>>;
  list(
    options?: PushCampaignListOptions,
  ): Promise<Result<Pagination<PushCampaign>, PushCampaignError>>;
  due(now?: number): Promise<Result<PushCampaign[], PushCampaignError>>;
  create(input: CreatePushCampaignInput): Promise<Result<PushCampaign, PushCampaignError>>;
  update(
    id: PushCampaignId,
    input: UpdatePushCampaignInput,
  ): Promise<Result<void, PushCampaignError>>;
  setActive(id: PushCampaignId, isActive: boolean): Promise<Result<void, PushCampaignError>>;
  markRan(id: PushCampaignId, ranAt: number): Promise<Result<void, PushCampaignError>>;
  remove(id: PushCampaignId): Promise<Result<void, PushCampaignError>>;
}

export function isValidSchedule(schedule: PushCampaignSchedule): boolean {
  if (schedule.kind === "once") {
    return Number.isSafeInteger(schedule.at) && schedule.at > 0;
  }

  try {
    return new Cron(schedule.expression, { timezone: schedule.timezone }).nextRun() !== null;
  } catch {
    return false;
  }
}

function toFiltersJson(
  filters: PushCampaignFilters | undefined,
): Record<string, unknown> | null {
  if (!filters) return null;
  return {
    device_os: filters.deviceOs ?? null,
    app_version: filters.appVersion ?? null,
    app_version_min: filters.appVersionMin ?? null,
    app_version_max: filters.appVersionMax ?? null,
    country: filters.country ?? null,
    localization: filters.localization ?? null,
    is_email_verified: filters.isEmailVerified ?? null,
    is_phone_verified: filters.isPhoneVerified ?? null,
    created_after: filters.createdAfter ?? null,
    created_before: filters.createdBefore ?? null,
    inactive_days: filters.inactiveDays ?? null,
  };
}

function buildFilters(
  filters: PushCampaignFilters | undefined,
  extraFilters: Record<string, unknown> | undefined,
  existing: Record<string, unknown> | null,
): Record<string, unknown> | null {
  const base = filters !== undefined ? toFiltersJson(filters) : existing;
  if (extraFilters === undefined) return base;
  return { ...(base ?? {}), ...extraFilters };
}

export class PushCampaignRepository extends Repository<PushCampaignError> implements PushCampaignService {
  protected override get backendError(): PushCampaignError {
    return PushCampaignError.Backend;
  }

  get(id: PushCampaignId): Promise<Result<PushCampaign, PushCampaignError>> {
    return this.guard(async () => {
      const row = await this.#row(id);
      return row ? new OK(this.#domain(row)) : new Failure(PushCampaignError.NotFound);
    });
  }

  list(
    options?: PushCampaignListOptions,
  ): Promise<Result<Pagination<PushCampaign>, PushCampaignError>> {
    return this.guard(async () => {
      const offset = options?.offset ?? 0;
      const size = options?.size ?? DEFAULT_PAGE_SIZE;

      let query = rest
        .internal_t__push_campaigns()
        .select((s) => ({
          push_campaign_id: s.push_campaign_id,
          push_template_id: s.push_template_id,
          filters: s.filters,
          is_active: s.is_active,
          next_run_at: s.next_run_at,
          last_run_at: s.last_run_at,
          created_at: s.created_at,
          updated_at: s.updated_at,
          schedule_kind: s.schedule_kind,
          scheduled_at: s.scheduled_at,
          cron_expression: s.cron_expression,
          schedule_timezone: s.schedule_timezone,
        }))
        .order("push_campaign_id", { ascending: false });
      if (options?.activeOnly) query = query.where((f) => f.is_active.eq(true));

      const rows = await query.range(offset, offset + size).get();
      return new OK(
        pagination(
          rows.map((row) => this.#domain(row)),
          offset,
          size,
        ),
      );
    });
  }

  due(now: number = Date.now()): Promise<Result<PushCampaign[], PushCampaignError>> {
    return this.guard(async () => {
      const rows = await rest
        .internal_t__push_campaigns()
        .select((s) => ({
          push_campaign_id: s.push_campaign_id,
          push_template_id: s.push_template_id,
          filters: s.filters,
          is_active: s.is_active,
          next_run_at: s.next_run_at,
          last_run_at: s.last_run_at,
          created_at: s.created_at,
          updated_at: s.updated_at,
          schedule_kind: s.schedule_kind,
          scheduled_at: s.scheduled_at,
          cron_expression: s.cron_expression,
          schedule_timezone: s.schedule_timezone,
        }))
        .where((f) => [f.is_active.eq(true), f.next_run_at.lte(now)])
        .order("next_run_at", { ascending: true })
        .get();

      return new OK(rows.map((row) => this.#domain(row)));
    });
  }

  create(input: CreatePushCampaignInput): Promise<Result<PushCampaign, PushCampaignError>> {
    return this.guard(async () => {
      if (!isValidSchedule(input.schedule)) {
        return new Failure(PushCampaignError.InvalidSchedule);
      }

      const row = await rest.internal_t__push_campaigns().insertOne({
        push_template_id: input.pushTemplateId,
        ...this.#scheduleColumns(input.schedule),
        filters: buildFilters(input.filters, input.extraFilters, null),
        is_active: input.isActive ?? true,
      });

      return row ? new OK(this.#domain(row)) : new Failure(PushCampaignError.Backend);
    });
  }

  update(
    id: PushCampaignId,
    input: UpdatePushCampaignInput,
  ): Promise<Result<void, PushCampaignError>> {
    return this.guard(async () => {
      if (input.schedule !== undefined && !isValidSchedule(input.schedule)) {
        return new Failure(PushCampaignError.InvalidSchedule);
      }

      const existing = await this.#row(id);
      if (!existing) return new Failure(PushCampaignError.NotFound);

      const ok = await rest
        .internal_t__push_campaigns()
        .where((f) => f.push_campaign_id.eq(id))
        .update(this.#patch(input, existing));

      return ok ? new OK() : new Failure(PushCampaignError.Backend);
    });
  }

  setActive(id: PushCampaignId, isActive: boolean): Promise<Result<void, PushCampaignError>> {
    return this.guard(async () => {
      const existing = await this.#row(id);
      if (!existing) return new Failure(PushCampaignError.NotFound);

      const ok = await rest
        .internal_t__push_campaigns()
        .where((f) => f.push_campaign_id.eq(id))
        .update({ is_active: isActive });

      return ok ? new OK() : new Failure(PushCampaignError.Backend);
    });
  }

  markRan(id: PushCampaignId, ranAt: number): Promise<Result<void, PushCampaignError>> {
    return this.guard(async () => {
      const { data, error } = await rest.rpc("mark_push_campaign_ran", {
        p_campaign_id: id,
        p_ran_at: ranAt,
      });
      if (error) throw error;

      return data ? new OK() : new Failure(PushCampaignError.NotFound);
    });
  }

  remove(id: PushCampaignId): Promise<Result<void, PushCampaignError>> {
    return this.guard(async () => {
      const removed = await rest
        .internal_t__push_campaigns()
        .where((f) => f.push_campaign_id.eq(id))
        .deleteOne((s) => ({ push_campaign_id: s.push_campaign_id }));

      return removed ? new OK() : new Failure(PushCampaignError.NotFound);
    });
  }

  #row(id: PushCampaignId): Promise<InternalTPushCampaignsRow | null> {
    return rest
      .internal_t__push_campaigns()
      .where((f) => f.push_campaign_id.eq(id))
      .getOne();
  }

  #scheduleColumns(schedule: PushCampaignSchedule): Record<string, unknown> {
    return schedule.kind === "once"
      ? {
        schedule_kind: "once",
        scheduled_at: schedule.at,
        cron_expression: null,
        schedule_timezone: "UTC",
      }
      : {
        schedule_kind: "cron",
        scheduled_at: null,
        cron_expression: schedule.expression,
        schedule_timezone: schedule.timezone,
      };
  }

  #patch(
    input: UpdatePushCampaignInput,
    existing: InternalTPushCampaignsRow,
  ): Record<string, unknown> {
    return {
      ...(input.pushTemplateId !== undefined && { push_template_id: input.pushTemplateId }),
      ...(input.schedule !== undefined && this.#scheduleColumns(input.schedule)),
      ...((input.filters !== undefined || input.extraFilters !== undefined) && {
        filters: buildFilters(input.filters, input.extraFilters, existing.filters),
      }),
      ...(input.isActive !== undefined && { is_active: input.isActive }),
    };
  }

  #schedule(row: PushCampaignRow): PushCampaignSchedule {
    return row.schedule_kind === "once" ? { kind: "once", at: row.scheduled_at as number } : {
      kind: "cron",
      expression: row.cron_expression as string,
      timezone: row.schedule_timezone as CronTimezone,
    };
  }

  #domain(row: PushCampaignRow): PushCampaign {
    return {
      id: row.push_campaign_id,
      pushTemplateId: row.push_template_id,
      schedule: this.#schedule(row),
      filters: row.filters,
      isActive: row.is_active,
      nextRunAt: row.next_run_at,
      lastRunAt: row.last_run_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
