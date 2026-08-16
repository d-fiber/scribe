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

import type { InternalTEmailCampaignsRow } from "@scribe/host/dependencies/database/rest/gen/rows.ts";
import { rest } from "@scribe/host/dependencies/database/rest/rest.ts";
import {
  CampaignAudience,
  type DeviceOs,
  type Localization,
} from "@scribe/core/contracts/enums.ts";
import { type Pagination, pagination } from "@scribe/core/contracts/pagination.ts";
import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import type { CronTimezone } from "@scribe/core/runtime/event_driven/cron/timezone.ts";
import { Cron } from "croner";
import { DEFAULT_PAGE_SIZE, type ListOptions } from "./core/list.ts";
import { Repository } from "./core/repository.ts";
import type { EmailTemplateId } from "./templates.ts";

type EmailCampaignRow = Pick<
  InternalTEmailCampaignsRow,
  | "email_campaign_id"
  | "email_template_id"
  | "audience"
  | "filters"
  | "data"
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

export interface EmailCampaignFilters {
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

export type EmailCampaignId = number;

export interface OnceSchedule {
  readonly kind: "once";
  readonly at: number;
}

export interface CronSchedule {
  readonly kind: "cron";
  readonly expression: string;
  readonly timezone: CronTimezone;
}

export type EmailCampaignSchedule = OnceSchedule | CronSchedule;

export interface EmailCampaign {
  readonly id: EmailCampaignId;
  readonly emailTemplateId: EmailTemplateId;
  readonly audience: CampaignAudience;
  readonly schedule: EmailCampaignSchedule;
  readonly filters: Record<string, unknown> | null;
  readonly data: Record<string, unknown> | null;
  readonly isActive: boolean;
  readonly nextRunAt: number | null;
  readonly lastRunAt: number | null;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface CreateEmailCampaignInput {
  readonly emailTemplateId: EmailTemplateId;
  readonly schedule: EmailCampaignSchedule;
  readonly audience?: CampaignAudience;
  readonly filters?: EmailCampaignFilters;
  readonly extraFilters?: Record<string, unknown>;
  readonly data?: Record<string, unknown>;
  readonly isActive?: boolean;
}

export type UpdateEmailCampaignInput = Partial<CreateEmailCampaignInput>;

export interface CampaignListOptions extends ListOptions {
  readonly activeOnly?: boolean;
}

export enum EmailCampaignError {
  NotFound = "not_found",
  InvalidSchedule = "invalid_schedule",
  Backend = "backend",
}

export interface EmailCampaignService {
  get(id: EmailCampaignId): Promise<Result<EmailCampaign, EmailCampaignError>>;
  list(
    options?: CampaignListOptions,
  ): Promise<Result<Pagination<EmailCampaign>, EmailCampaignError>>;
  due(now?: number): Promise<Result<EmailCampaign[], EmailCampaignError>>;
  create(
    input: CreateEmailCampaignInput,
  ): Promise<Result<EmailCampaign, EmailCampaignError>>;
  update(
    id: EmailCampaignId,
    input: UpdateEmailCampaignInput,
  ): Promise<Result<void, EmailCampaignError>>;
  setActive(
    id: EmailCampaignId,
    isActive: boolean,
  ): Promise<Result<void, EmailCampaignError>>;
  markRan(
    id: EmailCampaignId,
    ranAt: number,
  ): Promise<Result<void, EmailCampaignError>>;
  remove(id: EmailCampaignId): Promise<Result<void, EmailCampaignError>>;
}

export function nextRunOf(
  schedule: EmailCampaignSchedule,
  after: number,
): number | null {
  if (schedule.kind === "once") return schedule.at > after ? schedule.at : null;

  const next = new Cron(schedule.expression, {
    timezone: schedule.timezone,
  }).nextRun(new Date(after));
  return next ? next.getTime() : null;
}

function isValidSchedule(schedule: EmailCampaignSchedule): boolean {
  if (schedule.kind === "once")
    return Number.isSafeInteger(schedule.at) && schedule.at > 0;

  try {
    return (
      new Cron(schedule.expression, {
        timezone: schedule.timezone,
      }).nextRun() !== null
    );
  } catch {
    return false;
  }
}

function toFiltersJson(
  filters: EmailCampaignFilters | undefined,
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
  filters: EmailCampaignFilters | undefined,
  extraFilters: Record<string, unknown> | undefined,
  existing: Record<string, unknown> | null,
): Record<string, unknown> | null {
  const base = filters !== undefined ? toFiltersJson(filters) : existing;
  if (extraFilters === undefined) return base;
  return { ...(base ?? {}), ...extraFilters };
}

export class EmailCampaignRepository
  extends Repository<EmailCampaignError>
  implements EmailCampaignService
{
  protected override get backendError(): EmailCampaignError {
    return EmailCampaignError.Backend;
  }

  get(id: EmailCampaignId): Promise<Result<EmailCampaign, EmailCampaignError>> {
    return this.guard(async () => {
      const row = await this.#row(id);
      return row
        ? new OK(this.#domain(row))
        : new Failure(EmailCampaignError.NotFound);
    });
  }

  list(
    options?: CampaignListOptions,
  ): Promise<Result<Pagination<EmailCampaign>, EmailCampaignError>> {
    return this.guard(async () => {
      const offset = options?.offset ?? 0;
      const size = options?.size ?? DEFAULT_PAGE_SIZE;

      let query = rest
        .internal_t__email_campaigns()
        .select((s) => ({
          email_campaign_id: s.email_campaign_id,
          email_template_id: s.email_template_id,
          audience: s.audience,
          filters: s.filters,
          data: s.data,
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
        .order("email_campaign_id", { ascending: false });
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

  due(
    now: number = Date.now(),
  ): Promise<Result<EmailCampaign[], EmailCampaignError>> {
    return this.guard(async () => {
      const rows = await rest
        .internal_t__email_campaigns()
        .select((s) => ({
          email_campaign_id: s.email_campaign_id,
          email_template_id: s.email_template_id,
          audience: s.audience,
          filters: s.filters,
          data: s.data,
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

  create(
    input: CreateEmailCampaignInput,
  ): Promise<Result<EmailCampaign, EmailCampaignError>> {
    return this.guard(async () => {
      if (!isValidSchedule(input.schedule)) {
        return new Failure(EmailCampaignError.InvalidSchedule);
      }

      const row = await rest.internal_t__email_campaigns().insertOne({
        email_template_id: input.emailTemplateId,
        audience: input.audience ?? CampaignAudience.USER,
        ...this.#scheduleColumns(input.schedule),
        next_run_at: nextRunOf(input.schedule, Date.now()),
        filters: buildFilters(input.filters, input.extraFilters, null),
        data: input.data ?? null,
        is_active: input.isActive ?? true,
      });

      return row
        ? new OK(this.#domain(row))
        : new Failure(EmailCampaignError.Backend);
    });
  }

  update(
    id: EmailCampaignId,
    input: UpdateEmailCampaignInput,
  ): Promise<Result<void, EmailCampaignError>> {
    return this.guard(async () => {
      if (input.schedule !== undefined && !isValidSchedule(input.schedule)) {
        return new Failure(EmailCampaignError.InvalidSchedule);
      }

      const existing = await this.#row(id);
      if (!existing) return new Failure(EmailCampaignError.NotFound);

      const ok = await rest
        .internal_t__email_campaigns()
        .where((f) => f.email_campaign_id.eq(id))
        .update(this.#patch(input, existing));

      return ok ? new OK() : new Failure(EmailCampaignError.Backend);
    });
  }

  setActive(
    id: EmailCampaignId,
    isActive: boolean,
  ): Promise<Result<void, EmailCampaignError>> {
    return this.guard(async () => {
      const existing = await this.#row(id);
      if (!existing) return new Failure(EmailCampaignError.NotFound);

      const ok = await rest
        .internal_t__email_campaigns()
        .where((f) => f.email_campaign_id.eq(id))
        .update({ is_active: isActive });

      return ok ? new OK() : new Failure(EmailCampaignError.Backend);
    });
  }

  markRan(
    id: EmailCampaignId,
    ranAt: number,
  ): Promise<Result<void, EmailCampaignError>> {
    return this.guard(async () => {
      const existing = await this.#row(id);
      if (!existing) return new Failure(EmailCampaignError.NotFound);

      const next = nextRunOf(this.#schedule(existing), ranAt);

      const ok = await rest
        .internal_t__email_campaigns()
        .where((f) => f.email_campaign_id.eq(id))
        .update({
          last_run_at: ranAt,
          next_run_at: next,
          is_active: next !== null,
        });

      return ok ? new OK() : new Failure(EmailCampaignError.Backend);
    });
  }

  remove(id: EmailCampaignId): Promise<Result<void, EmailCampaignError>> {
    return this.guard(async () => {
      const removed = await rest
        .internal_t__email_campaigns()
        .where((f) => f.email_campaign_id.eq(id))
        .deleteOne((s) => ({ email_campaign_id: s.email_campaign_id }));

      return removed ? new OK() : new Failure(EmailCampaignError.NotFound);
    });
  }

  #row(id: EmailCampaignId): Promise<InternalTEmailCampaignsRow | null> {
    return rest
      .internal_t__email_campaigns()
      .where((f) => f.email_campaign_id.eq(id))
      .getOne();
  }

  #scheduleColumns(schedule: EmailCampaignSchedule): Record<string, unknown> {
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
    input: UpdateEmailCampaignInput,
    existing: InternalTEmailCampaignsRow,
  ): Record<string, unknown> {
    const schedule = input.schedule;

    return {
      ...(input.emailTemplateId !== undefined && {
        email_template_id: input.emailTemplateId,
      }),
      ...(input.audience !== undefined && { audience: input.audience }),
      ...(schedule !== undefined && {
        ...this.#scheduleColumns(schedule),
        next_run_at: nextRunOf(schedule, Date.now()),
      }),
      ...((input.filters !== undefined || input.extraFilters !== undefined) && {
        filters: buildFilters(
          input.filters,
          input.extraFilters,
          existing.filters,
        ),
      }),
      ...(input.data !== undefined && { data: input.data }),
      ...(input.isActive !== undefined && { is_active: input.isActive }),
    };
  }

  #schedule(row: EmailCampaignRow): EmailCampaignSchedule {
    return row.schedule_kind === "once"
      ? { kind: "once", at: row.scheduled_at as number }
      : {
          kind: "cron",
          expression: row.cron_expression as string,
          timezone: row.schedule_timezone as CronTimezone,
        };
  }

  #domain(row: EmailCampaignRow): EmailCampaign {
    return {
      id: row.email_campaign_id,
      emailTemplateId: row.email_template_id,
      audience: row.audience,
      schedule: this.#schedule(row),
      filters: row.filters,
      data: row.data,
      isActive: row.is_active,
      nextRunAt: row.next_run_at,
      lastRunAt: row.last_run_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
