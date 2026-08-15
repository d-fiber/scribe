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

import { clients } from "@scribe/host/dependencies/clients.ts";
import type { UpdatePushCampaignInput } from "@scribe/host/dependencies/features/messagings/notification_push/push.ts";
import { ApiContext } from "@scribe/core/kernel/endpoint/api.ts";
import {
  AdminPushIdEndpoint,
  filtersMessage,
  filtersOrNull,
  isInvalidSchedule,
  isNotFound,
  objectOrNull,
  positiveIntOrNull,
  scheduleMessage,
  scheduleOrNull,
  WRITE_RATE_LIMIT,
} from "./_shared.ts";

export class AdminPushCampaignUpdateEndpoint extends AdminPushIdEndpoint {
  protected rateLimit() {
    return WRITE_RATE_LIMIT;
  }

  protected async run(ctx: ApiContext): Promise<Response> {
    if (!this.validId()) return this.invalidId();

    const body = objectOrNull(ctx.raw());
    if (!body) return this.invalidBody();

    const patch: Record<string, unknown> = {};

    if (body.push_template_id !== undefined) {
      const pushTemplateId = positiveIntOrNull(body.push_template_id);
      if (pushTemplateId === null) {
        return this.invalidField("push_template_id", "a positive integer");
      }

      const template = await clients.features.messagings.notificationPush.templates.getById(
        pushTemplateId,
      );
      if (!template.ok) {
        return this.response.unprocessable({
          code: "template_not_found",
          message: "`push_template_id` does not match an existing push template.",
        });
      }
      patch.pushTemplateId = pushTemplateId;
    }

    if (body.schedule !== undefined) {
      const schedule = scheduleOrNull(body.schedule);
      if (!schedule) return this.invalidField("schedule", scheduleMessage());
      patch.schedule = schedule;
    }

    if (body.filters !== undefined) {
      const filters = filtersOrNull(body.filters);
      if (!filters) return this.invalidField("filters", filtersMessage());
      patch.filters = filters;
    }

    if (body.extra_filters !== undefined) {
      const extraFilters = objectOrNull(body.extra_filters);
      if (!extraFilters) return this.invalidField("extra_filters", "a JSON object");
      patch.extraFilters = extraFilters;
    }

    if (body.is_active !== undefined) {
      if (typeof body.is_active !== "boolean") return this.invalidField("is_active", "a boolean");
      patch.isActive = body.is_active;
    }

    if (Object.keys(patch).length === 0) return this.emptyPatch();

    const result = await clients.features.messagings.notificationPush.campaigns.update(
      this.id,
      patch as UpdatePushCampaignInput,
    );
    if (!result.ok) {
      return isInvalidSchedule(result.error)
        ? this.invalidField("schedule", scheduleMessage())
        : this.notFoundOr(isNotFound(result.error));
    }

    return this.response.ok();
  }
}
