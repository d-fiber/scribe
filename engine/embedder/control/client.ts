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

import type { Future } from "@scribe/alchemy";
import { type Fetcher, PROTOCOL_VERSION, UnaryClient } from "@scribe/sdk";
import type { Manifest } from "@scribe/sdk/gen/scribe/protocol/manifest_pb.ts";
import { Registration } from "@scribe/sdk/gen/scribe/protocol/manifest_pb.ts";
import type { Invocation, Reply } from "@scribe/sdk/gen/scribe/protocol/invocation_pb.ts";
import { Worker as WorkerService } from "@scribe/sdk/gen/scribe/protocol/invocation_pb.ts";
import { QueueDispatch } from "@scribe/sdk/gen/scribe/packages/foundation/protocol/queue_pb.ts";
import { HookDispatch } from "@scribe/sdk/gen/scribe/packages/foundation/protocol/hook_pb.ts";
import { CronDispatch } from "@scribe/sdk/gen/scribe/packages/foundation/protocol/cron_pb.ts";
import type { LogEntry } from "@scribe/sdk/gen/scribe/protocol/logs_pb.ts";
import { LogDispatch } from "@scribe/sdk/gen/scribe/protocol/logs_pb.ts";

/**
 * The host side of the wire, as one replica holds it.
 *
 * @remarks
 * Every call it makes names {@link WorkerClient.callbackUrl} beside the token, because a capability
 * grant lives in the memory of the replica that issued it. Announcing the address once at the
 * handshake is not enough: every replica handshakes with the same worker, which remembers one
 * address, so the last one to introduce itself would receive the callbacks owed to all of them and
 * refuse every token but its own as unknown.
 */
export class WorkerClient {
  /**
   * @param endpoint - Where this host reaches the worker.
   * @param callbackUrl - Where the worker reaches this replica, and the only address at which the
   * tokens this client carries can be redeemed.
   * @param fetcher - What sends the call, defaulting to the platform's own when left out.
   */
  constructor(
    readonly endpoint: string,
    readonly callbackUrl: string,
    readonly fetcher?: Fetcher,
  ) {}

  /**
   * Asks the worker to describe itself: the handshake call that returns its manifest.
   *
   * @remarks
   * Sends this host's protocol version and callback address alongside `capabilityToken`, so the
   * worker knows both what it is talking to and where to redeem the token later.
   */
  describe(capabilityToken: string): Future<Manifest> {
    return this.#channel(capabilityToken, "").call(Registration.method.describe, {
      hostProtocolVersion: PROTOCOL_VERSION,
      hostEndpoint: this.callbackUrl,
      capabilityToken,
    });
  }

  /** Sends `invocation` to the worker and answers its reply: the call behind every procedure dispatch. */
  invoke(invocation: Invocation): Future<Reply> {
    return this.#channel(invocation.capabilityToken, invocation.traceId).call(
      WorkerService.method.invoke,
      invocation,
    );
  }

  /** Hands `messages` to the worker for `queueId`, each carrying its own delivery attempt count. */
  dispatchQueue(
    queueId: string,
    capabilityToken: string,
    traceId: string,
    messages: readonly { messageId: string; payload: Uint8Array; attempt: number }[],
  ) {
    return this.#channel(capabilityToken, traceId).call(QueueDispatch.method.handle, {
      queueId,
      traceId,
      capabilityToken,
      messages: messages.map((message) => ({
        messageId: message.messageId,
        payload: { value: message.payload },
        attempt: message.attempt,
        enqueuedAt: BigInt(Date.now()),
      })),
    });
  }

  /** Hands the worker one `event` fired by `hookId`, with `payload` as the trigger's raw bytes. */
  dispatchHook(
    hookId: string,
    event: string,
    capabilityToken: string,
    traceId: string,
    payload: Uint8Array,
  ) {
    return this.#channel(capabilityToken, traceId).call(HookDispatch.method.handle, {
      hookId,
      event,
      traceId,
      capabilityToken,
      payload: { value: payload },
      emittedAt: BigInt(Date.now()),
    });
  }

  /** Fires the scheduled run of `cronId` on the worker, carrying when it was due to run. */
  triggerCron(cronId: string, capabilityToken: string, traceId: string, scheduledAt: number) {
    return this.#channel(capabilityToken, traceId).call(CronDispatch.method.trigger, {
      cronId,
      traceId,
      capabilityToken,
      scheduledAt: BigInt(scheduledAt),
      firedAt: BigInt(Date.now()),
    });
  }

  /**
   * Hands a node's log entries to the `_logs.ts` that claimed them.
   *
   * The reverse of {@link shipLogs}: these entries were raised here and are on
   * their way to project code. No capability token travels with them, because
   * a sink is handed data and is not entitled to call anything back on the
   * strength of having received it.
   */
  deliverLogs(node: string | null, entries: readonly LogEntry[]) {
    return this.#channel("", "").call(LogDispatch.method.handle, {
      node: node ?? "",
      entries: [...entries],
    });
  }

  #channel(capabilityToken: string, traceId: string): UnaryClient {
    return new UnaryClient(
      this.endpoint,
      () => ({ capabilityToken, traceId, hostEndpoint: this.callbackUrl }),
      this.fetcher,
    );
  }
}
