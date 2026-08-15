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

import type {
  PushCampaign,
  PushCampaignFilters,
  PushCampaignSchedule,
} from "@scribe/host/dependencies/features/messagings/notification_push/push.ts";
import { PushCampaignError } from "@scribe/host/dependencies/features/messagings/notification_push/push.ts";
import { DeviceOs, enumValues, Localization } from "@scribe/core/contracts/enums.ts";
import { CronTimezone } from "@scribe/core/runtime/event_driven/cron/timezone.ts";
import { objectOrNull, positiveIntOrNull, trimmedOrNull } from "../_shared.ts";

export {
  AdminPushEndpoint,
  AdminPushIdEndpoint,
  objectOrNull,
  page,
  positiveIntOrNull,
  READ_RATE_LIMIT,
  trimmedOrNull,
  WRITE_RATE_LIMIT,
} from "../_shared.ts";

export function isNotFound(error: PushCampaignError): boolean {
  return error === PushCampaignError.NotFound;
}

export function isInvalidSchedule(error: PushCampaignError): boolean {
  return error === PushCampaignError.InvalidSchedule;
}

export function payload(campaign: PushCampaign) {
  return {
    id: campaign.id,
    push_template_id: campaign.pushTemplateId,
    schedule: scheduleJson(campaign.schedule),
    filters: campaign.filters,
    is_active: campaign.isActive,
    next_run_at: campaign.nextRunAt,
    last_run_at: campaign.lastRunAt,
    created_at: campaign.createdAt,
    updated_at: campaign.updatedAt,
  };
}

function scheduleJson(schedule: PushCampaignSchedule) {
  return schedule.kind === "once"
    ? { kind: schedule.kind, at: schedule.at }
    : { kind: schedule.kind, expression: schedule.expression, timezone: schedule.timezone };
}

export function scheduleMessage(): string {
  return 'an object `{ kind: "once", at }` (ms epoch) or `{ kind: "cron", expression, timezone }`';
}

export function scheduleOrNull(value: unknown): PushCampaignSchedule | null {
  const raw = objectOrNull(value);
  if (!raw) return null;

  if (raw.kind === "once") {
    const at = positiveIntOrNull(raw.at);
    return at === null ? null : { kind: "once", at };
  }

  if (raw.kind === "cron") {
    const expression = trimmedOrNull(raw.expression);
    const timezone = enumValues(CronTimezone).includes(raw.timezone as CronTimezone)
      ? (raw.timezone as CronTimezone)
      : null;
    return expression && timezone ? { kind: "cron", expression, timezone } : null;
  }

  return null;
}

type FilterReader = (value: unknown) => unknown;

const FILTER_READERS: Record<string, FilterReader> = {
  device_os: (value) => enumMember(value, DeviceOs),
  app_version: nonEmptyString,
  app_version_min: nonEmptyString,
  app_version_max: nonEmptyString,
  country: nonEmptyString,
  localization: (value) => enumMember(value, Localization),
  is_email_verified: boolean,
  is_phone_verified: boolean,
  created_after: positiveInteger,
  created_before: positiveInteger,
  inactive_days: positiveInteger,
};

const FILTER_KEYS: Record<string, keyof PushCampaignFilters> = {
  device_os: "deviceOs",
  app_version: "appVersion",
  app_version_min: "appVersionMin",
  app_version_max: "appVersionMax",
  country: "country",
  localization: "localization",
  is_email_verified: "isEmailVerified",
  is_phone_verified: "isPhoneVerified",
  created_after: "createdAfter",
  created_before: "createdBefore",
  inactive_days: "inactiveDays",
};

function enumMember<T extends object>(value: unknown, source: T): unknown {
  return enumValues(source).includes(value as T[keyof T]) ? value : null;
}

function nonEmptyString(value: unknown): unknown {
  return trimmedOrNull(value);
}

function boolean(value: unknown): unknown {
  return typeof value === "boolean" ? value : null;
}

function positiveInteger(value: unknown): unknown {
  return positiveIntOrNull(value);
}

export function filtersMessage(): string {
  return `an object whose keys are among ${Object.keys(FILTER_READERS).join(", ")}`;
}

export function filtersOrNull(value: unknown): PushCampaignFilters | null {
  const raw = objectOrNull(value);
  if (!raw) return null;

  const filters: Record<string, unknown> = {};

  for (const [key, given] of Object.entries(raw)) {
    const read = FILTER_READERS[key];
    if (!read) return null;
    if (given === null) continue;

    const parsed = read(given);
    if (parsed === null) return null;
    filters[FILTER_KEYS[key]] = parsed;
  }

  return filters as PushCampaignFilters;
}
