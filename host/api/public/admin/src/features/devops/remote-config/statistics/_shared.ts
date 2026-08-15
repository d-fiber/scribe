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
  type RemoteConfigStatistic,
  RemoteConfigStatisticsError,
} from "@scribe/host/dependencies/features/devops/remote-configs/remote-configs.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { ApiEndpoint, Caller } from "@scribe/core/kernel/endpoint/api.ts";

export const READ_RATE_LIMIT = {
  limit: 60,
  window: Time.minutes(1),
  penalty: Time.minutes(1),
  maxPenalty: Time.minutes(10),
};

export function payload(statistic: RemoteConfigStatistic) {
  return {
    id: statistic.id,
    remote_config_id: statistic.remoteConfigId,
    user_id: statistic.userId,
    audience: statistic.audience,
    outcome: statistic.outcome,
    created_at: statistic.createdAt,
  };
}

export abstract class AdminRemoteConfigStatisticsEndpoint extends ApiEndpoint {
  protected access(): Caller {
    return Caller.Admin;
  }

  protected notFoundOrUnexpected(error: RemoteConfigStatisticsError): Response {
    return error === RemoteConfigStatisticsError.NotFound ? this.response.notFound() : this.response.unexpected();
  }
}

export abstract class AdminRemoteConfigStatisticEndpoint extends AdminRemoteConfigStatisticsEndpoint {
  protected readonly id: number;

  constructor(rawId: string) {
    super();
    this.id = Math.floor(Number(rawId));
  }

  protected validId(): boolean {
    return Number.isSafeInteger(this.id) && this.id > 0;
  }

  protected invalidId(): Response {
    return this.response.badRequest({
      code: "invalid_id",
      message: "A statistic id must be a positive integer.",
    });
  }
}
