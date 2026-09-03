// Copyright (C) 2026 Fiber
//
// This Source Code Form is subject to the terms of the Mozilla Public License,
// v. 2.0. If a copy of the MPL was not distributed with this file, You can
// obtain one at https://mozilla.org/MPL/2.0/.
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
// - Combine it with files under any other licence, proprietary ones included,
//   and licence that larger work on your own terms.
//
// What you must do in return:
// - Keep this notice on every file you received it on.
// - Publish, under these same terms, the source of every file covered by them
//   that you distribute, including the ones you changed, so that whoever
//   receives your version can obtain that source.
// - Leave Fiber out of it: the name "Fiber", its branding, its logos and its
//   trademarks may not be used to endorse or promote what you build, and this
//   licence grants no right to them.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY
// OR CONDITION OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
// WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
// NON-INFRINGEMENT. IN NO EVENT SHALL FIBER BE LIABLE FOR ANY DIRECT, INDIRECT,
// INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING BUT NOT
// LIMITED TO LOSS OF USE, DATA, PROFITS, OR BUSINESS INTERRUPTION) ARISING OUT
// OF OR RELATED TO THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY
// KIND OF LEGAL CLAIM.
//
// This header is a summary written for convenience. Where it differs from the
// LICENSE file, the LICENSE file governs.

import { Duration } from "@scribe/alchemy";
import type { Future } from "@scribe/alchemy";
import type { RateLimit } from "@scribe/alchemy/route";
import { ApiContext, ApiEndpoint } from "@scribe/kernel/endpoint/api.ts";
import type { Caller } from "@scribe/alchemy/route";
import { inflightBodyBytes } from "@scribe/kernel/http/serve/body_admission.ts";
import { Processes } from "@scribe/runtime/scholium/process.ts";
import { queueStatus } from "@scribe/foundation/queue";

const _RATE_LIMIT: RateLimit = {
  limit: 600,
  window: Duration.minutes(1),
  penalty: Duration.minutes(1),
  maxPenalty: Duration.minutes(1),
};

/**
 * What one replica of the host is holding, as the dashboard reads it.
 *
 * @remarks
 * Named "one replica" rather than "the deployment" on purpose: a deployment usually runs several
 * replicas, and this endpoint is called against each of them in turn, so a figure here is a fact
 * about the process answering, memory and in-flight bytes especially, never a sum across the fleet.
 */
export interface CodexGauges {
  /** Seconds this replica has been serving, which resets when it restarts. */
  readonly uptimeSeconds: number;

  /**
   * Bytes of request body admitted and not yet released, across every request
   * this replica is answering.
   *
   * It is the number the body admission ceiling is compared against, so a value
   * that sits near `API_MAX_INFLIGHT_BODY_MB` is what refuses the next upload.
   */
  readonly inflightBodyBytes: number;

  /** Resident memory of this replica, in bytes, as the runtime reports it. */
  readonly residentBytes: number;

  /**
   * One entry per declared queue, with what it holds and what it failed on.
   *
   * The shape is the queue package's own, so the dashboard reads the same
   * numbers the drain endpoint answers rather than a second count of them.
   */
  readonly queues: unknown;
}

/**
 * Answers the gauges of the replica that receives the call.
 *
 * @remarks
 * There is one process per replica and no shared counter behind these numbers,
 * so a stack running four api containers answers four different bodies. That is
 * deliberate: a sum would hide the replica that is about to refuse a body while
 * the other three are idle.
 *
 * The caller has to prove the service role, which the gateway grants from the
 * admin key it asked for. That is a second lock rather than the same one twice:
 * the gateway decides who reaches the host, and this decides who the host
 * answers, so a call that arrives on the app network without the gateway is
 * refused here.
 */
export class CodexMetricsEndpoint extends ApiEndpoint {
  /** Requires the service caller role, which the gateway grants only from the admin key. */
  protected override access(): Caller {
    return "service";
  }

  /** 600 calls a minute, with a one-minute penalty. */
  protected override rateLimit(): RateLimit {
    return _RATE_LIMIT;
  }

  /** Answers the current gauges of this replica. */
  protected async run(_ctx: ApiContext): Future<Response> {
    const gauges: CodexGauges = {
      uptimeSeconds: Math.round(performance.now() / 1000),
      inflightBodyBytes: inflightBodyBytes(),
      residentBytes: Processes.get().residentMemoryBytes(),
      queues: await queueStatus.all(),
    };

    return this.response.ok({ data: gauges });
  }
}
