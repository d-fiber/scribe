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

import { CampaignAudience } from "@scribe/core/contracts/enums.ts";
import { FOUNDATION_SMTP_ACCOUNTS } from "@scribe/host/dependencies/features/messagings/mail/mail.ts";
import { clients } from "@scribe/host/dependencies/clients.ts";
import {
  fetchAdminCandidates,
  fetchLastSignInAt,
  fetchUserCandidates,
} from "@scribe/host/dependencies/features/messagings/campaigns/candidates.ts";
import {
  isSet,
  matchesCampaignFilters,
  parseCampaignFilters,
} from "@scribe/host/dependencies/features/messagings/campaigns/filters.ts";
import { Required } from "@scribe/core/kernel/validation/schema.ts";
import { ApiContext, ServiceEndpoint } from "@scribe/core/kernel/endpoint/service.ts";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

// Fire-and-forget target of run_due_email_campaigns() (scribe/host/core/db/init/
// 05_features/01_messaging/01_mails/04_campaigns.sql): the SQL cron only
// finds due campaigns and dispatches this per campaign, all audience
// resolution/filtering now lives here (see campaigns/filters.ts for why).
export async function runCampaign(campaignId: number): Promise<void> {
  const found = await clients.features.messagings.mail.campaigns.get(campaignId);
  if (!found.ok) return;

  const campaign = found.data;

  const template = await clients.features.messagings.mail.templates.getById(
    campaign.emailTemplateId,
  );
  if (!template.ok) return;
  const templateName = template.data.name;

  const filters = parseCampaignFilters(campaign.filters);
  const data = { ...(campaign.data ?? {}) };

  if (campaign.audience === CampaignAudience.ADMIN) {
    let candidates = await fetchAdminCandidates(filters);
    if (isSet(filters.inactiveDays)) {
      const lastSignInAt = await fetchLastSignInAt(
        candidates.map((c) => c.adminId),
      );
      candidates = candidates.map((c) => ({
        ...c,
        candidate: {
          ...c.candidate,
          lastSignInAt: lastSignInAt.get(c.adminId) ?? null,
        },
      }));
    }

    for (const c of candidates) {
      if (!matchesCampaignFilters(c.candidate, filters)) continue;

      const sender = await clients.features.messagings.mail.for(FOUNDATION_SMTP_ACCOUNTS.account);
      if (!sender.ok) continue;

      await sender.data.create(c.email, templateName, {
        ...data,
        adminId: c.adminId,
      });
    }
    return;
  }

  let candidates = await fetchUserCandidates(filters);
  if (isSet(filters.inactiveDays)) {
    const lastSignInAt = await fetchLastSignInAt(
      candidates.map((c) => c.userId),
    );
    candidates = candidates.map((c) => ({
      ...c,
      candidate: {
        ...c.candidate,
        lastSignInAt: lastSignInAt.get(c.userId) ?? null,
      },
    }));
  }

  for (const c of candidates) {
    if (!c.email) continue;
    if (!matchesCampaignFilters(c.candidate, filters)) continue;

    const sender = await clients.features.messagings.mail.for(FOUNDATION_SMTP_ACCOUNTS.account);
    if (!sender.ok) continue;

    await sender.data.create(c.email, templateName, {
      ...data,
      userId: c.userId,
    });
  }
}

export class CampaignRunEndpoint extends ServiceEndpoint {
  protected run(ctx: ApiContext): Response {
    const body = ctx.body({ campaign_id: Required(Number) });
    if (!body) return this.response.badRequest();

    EdgeRuntime.waitUntil(
      runCampaign(body.campaign_id).catch((error) => {
        console.error("[campaign-run]", error);
      }),
    );

    return this.response.ok();
  }
}
