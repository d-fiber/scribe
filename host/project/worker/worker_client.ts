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

import { type Fetcher, PROTOCOL_VERSION, UnaryClient } from "@scribe/sdk";
import type { Manifest } from "@scribe/sdk/gen/scribe/protocol/manifest_pb.ts";
import { Registration } from "@scribe/sdk/gen/scribe/protocol/manifest_pb.ts";
import type { Invocation, Reply } from "@scribe/sdk/gen/scribe/protocol/invocation_pb.ts";
import { Worker as WorkerService } from "@scribe/sdk/gen/scribe/protocol/invocation_pb.ts";
import { QueueDispatch } from "@scribe/sdk/gen/scribe/host/packages/foundation/protocol/queue/queue_pb.ts";
import { HookDispatch } from "@scribe/sdk/gen/scribe/host/packages/foundation/protocol/hook/hook_pb.ts";
import { CronDispatch } from "@scribe/sdk/gen/scribe/host/packages/foundation/protocol/cron/cron_pb.ts";
import type { LogEntry } from "@scribe/sdk/gen/scribe/protocol/logs_pb.ts";
import { LogDispatch } from "@scribe/sdk/gen/scribe/protocol/logs_pb.ts";

export class WorkerClient {
  constructor(
    readonly endpoint: string,
    readonly fetcher?: Fetcher,
  ) {}

  describe(callbackUrl: string, capabilityToken: string): Promise<Manifest> {
    return this.#channel(capabilityToken, "").call(Registration.method.describe, {
      hostProtocolVersion: PROTOCOL_VERSION,
      hostEndpoint: callbackUrl,
      capabilityToken,
    });
  }

  invoke(invocation: Invocation): Promise<Reply> {
    return this.#channel(invocation.capabilityToken, invocation.traceId).call(
      WorkerService.method.invoke,
      invocation,
    );
  }

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
   * Hands a node's log entries to the `_log.ts` that claimed them.
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
      () => ({ capabilityToken, traceId }),
      this.fetcher,
    );
  }
}
