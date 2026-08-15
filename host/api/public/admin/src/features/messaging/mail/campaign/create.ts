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
import { ApiContext } from "@scribe/core/kernel/endpoint/api.ts";
import {
  AdminMailEndpoint,
  audienceMessage,
  audienceOrNull,
  filtersMessage,
  filtersOrNull,
  isInvalidSchedule,
  objectOrNull,
  payload,
  positiveIntOrNull,
  scheduleMessage,
  scheduleOrNull,
  WRITE_RATE_LIMIT,
} from "./_shared.ts";

export class AdminEmailCampaignCreateEndpoint extends AdminMailEndpoint {
  protected rateLimit() {
    return WRITE_RATE_LIMIT;
  }

  protected async run(ctx: ApiContext): Promise<Response> {
    const body = objectOrNull(ctx.raw());
    if (!body) return this.invalidBody();

    const emailTemplateId = positiveIntOrNull(body.email_template_id);
    if (emailTemplateId === null) {
      return this.invalidField("email_template_id", "a positive integer");
    }

    const schedule = scheduleOrNull(body.schedule);
    if (!schedule) return this.invalidField("schedule", scheduleMessage());

    const audience = audienceOrNull(body.audience);
    if (body.audience !== undefined && !audience) {
      return this.invalidField("audience", audienceMessage());
    }

    const filters = body.filters === undefined ? null : filtersOrNull(body.filters);
    if (body.filters !== undefined && !filters) {
      return this.invalidField("filters", filtersMessage());
    }

    const extraFilters = body.extra_filters === undefined ? null : objectOrNull(body.extra_filters);
    if (body.extra_filters !== undefined && !extraFilters) {
      return this.invalidField("extra_filters", "a JSON object");
    }

    const data = body.data === undefined ? null : objectOrNull(body.data);
    if (body.data !== undefined && !data) {
      return this.invalidField("data", "a JSON object");
    }

    if (body.is_active !== undefined && typeof body.is_active !== "boolean") {
      return this.invalidField("is_active", "a boolean");
    }

    const template = await clients.features.messagings.mail.templates.getById(emailTemplateId);
    if (!template.ok) {
      return this.response.unprocessable({
        code: "template_not_found",
        message: "`email_template_id` does not match an existing email template.",
      });
    }

    const result = await clients.features.messagings.mail.campaigns.create({
      emailTemplateId,
      schedule,
      ...(audience ? { audience } : {}),
      ...(filters ? { filters } : {}),
      ...(extraFilters ? { extraFilters } : {}),
      ...(data ? { data } : {}),
      ...(typeof body.is_active === "boolean" ? { isActive: body.is_active } : {}),
    });
    if (!result.ok) {
      return isInvalidSchedule(result.error)
        ? this.invalidField("schedule", scheduleMessage())
        : this.response.unexpected();
    }

    return this.response.created({ data: payload(result.data) });
  }
}
