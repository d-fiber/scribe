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

import { Time } from "@scribe/core/contracts/common/time.ts";
import { ApiContext, RateLimiter } from "@scribe/core/kernel/endpoint/api.ts";
import { ServiceEndpoint } from "@scribe/core/kernel/endpoint/service.ts";
import { queueStatus } from "@scribe/host/packages/foundation/event_driven/queue/core/status.ts";
import { queueRunner } from "@scribe/host/packages/foundation/event_driven/queue/runner/queue_runner.ts";

const _RATE_LIMIT: RateLimiter = {
  limit: 1000,
  window: Time.minutes(1),
  penalty: Time.minutes(1),
  maxPenalty: Time.minutes(1),
};

export class QueueDrainEndpoint extends ServiceEndpoint {
  protected override rateLimit(): RateLimiter {
    return _RATE_LIMIT;
  }

  protected async run(_ctx: ApiContext): Promise<Response> {
    return this.response.ok({ data: await queueRunner.run() });
  }
}

export class QueueDrainOneEndpoint extends ServiceEndpoint {
  readonly #name: string;

  constructor(name: string) {
    super();
    this.#name = name;
  }

  protected override rateLimit(): RateLimiter {
    return _RATE_LIMIT;
  }

  protected async run(_ctx: ApiContext): Promise<Response> {
    const result = await queueRunner.runOne(this.#name);
    if (result === null) {
      return this.response.notFound({
        code: "unknown_queue",
        message: `No queue named "${this.#name}" is declared.`,
      });
    }
    return this.response.ok({ data: result });
  }
}

export class QueueStatusEndpoint extends ServiceEndpoint {
  protected override rateLimit(): RateLimiter {
    return _RATE_LIMIT;
  }

  protected async run(_ctx: ApiContext): Promise<Response> {
    return this.response.ok({ data: await queueStatus.all() });
  }
}
