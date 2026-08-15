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

import { runCampaign } from "@scribe/host/api/internal/messaging/email/src/campaign-run.ts";
import { clients } from "@scribe/host/dependencies/clients.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { defineCron } from "@scribe/core/runtime/event_driven/cron/core/define.ts";
import { every } from "@scribe/core/runtime/event_driven/cron/schedule.ts";

export const emailCampaignsCron = defineCron(
  { name: "email-campaigns", schedule: every(Time.minutes(1)) },
  async () => {
    const due = await clients.features.messagings.mail.campaigns.due();
    if (!due.ok) {
      console.error("[email-campaigns] could not read due campaigns", due.error);
      return;
    }

    for (const campaign of due.data) {
      const ranAt = Date.now();
      try {
        await runCampaign(campaign.id);
      } catch (error) {
        console.error(`[email-campaigns] campaign ${campaign.id} failed`, error);
        continue;
      }

      const marked = await clients.features.messagings.mail.campaigns.markRan(campaign.id, ranAt);
      if (!marked.ok) {
        console.error(`[email-campaigns] campaign ${campaign.id} ran but could not be marked`, marked.error);
      }
    }
  },
);
