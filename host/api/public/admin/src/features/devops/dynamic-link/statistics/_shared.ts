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

import {
  type DynamicLinkStatistic,
  DynamicLinkStatisticsError,
} from "@scribe/host/dependencies/features/devops/dynamic-links/dynamic-links.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { ApiEndpoint, Caller } from "@scribe/core/kernel/endpoint/api.ts";
import { idOrNull, invalidIdMessage } from "../_shared.ts";

export const READ_RATE_LIMIT = {
  limit: 60,
  window: Time.minutes(1),
  penalty: Time.minutes(1),
  maxPenalty: Time.minutes(10),
};

export function payload(statistic: DynamicLinkStatistic) {
  return {
    id: statistic.id,
    dynamic_link_id: statistic.dynamicLinkId,
    user_id: statistic.userId,
    device_id: statistic.deviceId,
    ip_address: statistic.ipAddress,
    user_agent: statistic.userAgent,
    referer: statistic.referer,
    outcome: statistic.outcome,
    platform: statistic.platform,
    created_at: statistic.createdAt,
  };
}

export abstract class AdminDynamicLinkStatisticsEndpoint extends ApiEndpoint {
  protected access(): Caller {
    return Caller.Admin;
  }

  protected notFoundOrUnexpected(error: DynamicLinkStatisticsError): Response {
    return error === DynamicLinkStatisticsError.NotFound ? this.response.notFound() : this.response.unexpected();
  }
}

export abstract class AdminDynamicLinkStatisticEndpoint extends AdminDynamicLinkStatisticsEndpoint {
  protected readonly id: number | null;

  constructor(rawId: string) {
    super();
    this.id = idOrNull(rawId);
  }

  protected invalidId(): Response {
    return this.response.badRequest({
      code: "invalid_id",
      message: invalidIdMessage(),
    });
  }
}
