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

import { create } from "@bufbuild/protobuf";
import { FailureSchema } from "../../gen/scribe/protocol/common_pb.ts";
import { type Invocation, type Reply, ReplySchema } from "../../gen/scribe/protocol/invocation_pb.ts";
import {
  type Batch,
  type BatchOutcome,
  BatchOutcomeSchema,
} from "../../gen/scribe/packages/foundation/protocol/queue_pb.ts";
import {
  type Event,
  type HandleResult,
  HandleResultSchema,
} from "../../gen/scribe/packages/foundation/protocol/hook_pb.ts";
import {
  type CronOutcome,
  CronOutcomeSchema,
  type CronTrigger,
} from "../../gen/scribe/packages/foundation/protocol/cron_pb.ts";
import { type LogDelivery, type LogDeliveryAck, LogDeliveryAckSchema } from "../../gen/scribe/protocol/logs_pb.ts";
import { decodeJson, encodeJson } from "../contracts/json.ts";
import { loggedEntry } from "../observability/log_sink.ts";
import type { QueueMessage } from "../manifest/events.ts";
import type { WorkerDefinition } from "../manifest/worker.ts";
import { describeCause } from "../transport/failure.ts";
import { InvocationContext } from "./context.ts";
import { CallScope } from "./scope.ts";

// deno-lint-ignore require-await -- async turns a synchronous throw into a rejected promise, which every caller relies on.
export async function invoke(worker: WorkerDefinition, invocation: Invocation): Promise<Reply> {
  const mounted = worker.routeFor(invocation.routeId);
  if (!mounted) {
    return failedReply(
      invocation.invocationId,
      "unknown_route",
      `${invocation.routeId} is not declared by this worker.`,
    );
  }

  return CallScope.run(scopeOf(invocation, mounted.node), async () => {
    try {
      const response = await mounted.route.handler(new InvocationContext(invocation));
      return await replyFrom(invocation.invocationId, response);
    } catch (cause) {
      return failedReply(invocation.invocationId, "handler_failed", describeCause(cause));
    }
  });
}

/**
 * Hands a delivery to the sink that claimed it.
 *
 * The ack is unconditional, and so is the catch around the sink: the entries
 * describe exchanges that are already answered, so nothing useful is left to
 * tell the host. A sink that throws would otherwise make the host retry a batch
 * of logs, and a sink that fails on every batch would retry forever.
 *
 * A delivery for a node with no sink is not an error either. The host learns
 * which nodes have one from the manifest, so the only way to get here is a
 * worker that was replaced by one declaring fewer sinks while the host still
 * held the old manifest.
 */
export async function deliverLogs(
  worker: WorkerDefinition,
  delivery: LogDelivery,
): Promise<LogDeliveryAck> {
  const node = delivery.node === "" ? null : delivery.node;
  const sink = worker.sinks.resolve(node);

  if (sink !== null && delivery.entries.length > 0) {
    try {
      await sink.receive(delivery.entries.map(loggedEntry));
    } catch (cause) {
      console.error(
        `[worker] the log sink of ${node ?? "the project root"} threw:`,
        describeCause(cause),
      );
    }
  }

  return create(LogDeliveryAckSchema, {});
}

// deno-lint-ignore require-await -- async turns a synchronous throw into a rejected promise, which every caller relies on.
export async function handleBatch(worker: WorkerDefinition, batch: Batch): Promise<BatchOutcome> {
  const queue = worker.queueFor(batch.queueId);
  if (!queue) {
    return create(BatchOutcomeSchema, {
      outcomes: batch.messages.map((message) => ({
        messageId: message.messageId,
        acknowledged: false,
        error: create(FailureSchema, {
          code: "unknown_queue",
          message: `${batch.queueId} is not declared by this worker.`,
        }),
      })),
    });
  }

  const messages: QueueMessage<unknown>[] = batch.messages.map((message) => ({
    messageId: message.messageId,
    payload: decodeJson(message.payload),
    attempt: message.attempt,
    enqueuedAt: Number(message.enqueuedAt),
  }));

  return CallScope.run(
    {
      capabilityToken: batch.capabilityToken,
      traceId: batch.traceId,
      invocationId: batch.queueId,
      node: "",
    },
    async () => {
      try {
        const acknowledged = new Set(await queue.handler(messages as never));
        return create(BatchOutcomeSchema, {
          outcomes: messages.map((message) => ({
            messageId: message.messageId,
            acknowledged: acknowledged.has(message.messageId),
          })),
        });
      } catch (cause) {
        return create(BatchOutcomeSchema, {
          outcomes: messages.map((message) => ({
            messageId: message.messageId,
            acknowledged: false,
            error: create(FailureSchema, {
              code: "handler_failed",
              message: describeCause(cause),
            }),
          })),
        });
      }
    },
  );
}

// deno-lint-ignore require-await -- async turns a synchronous throw into a rejected promise, which every caller relies on.
export async function handleEvent(worker: WorkerDefinition, event: Event): Promise<HandleResult> {
  const hook = worker.hookFor(event.hookId);
  if (!hook) {
    return create(HandleResultSchema, {
      error: create(FailureSchema, {
        code: "unknown_hook",
        message: `${event.hookId} is not declared by this worker.`,
      }),
    });
  }

  return CallScope.run(
    {
      capabilityToken: event.capabilityToken,
      traceId: event.traceId,
      invocationId: event.hookId,
      node: "",
    },
    async () => {
      try {
        const outcome = await hook.handler(decodeJson(event.payload));
        return create(HandleResultSchema, {
          halted: outcome?.halted ?? false,
          mutation: outcome?.mutation === undefined ? undefined : encodeJson(outcome.mutation),
        });
      } catch (cause) {
        return create(HandleResultSchema, {
          error: create(FailureSchema, {
            code: "handler_failed",
            message: describeCause(cause),
          }),
        });
      }
    },
  );
}

// deno-lint-ignore require-await -- async turns a synchronous throw into a rejected promise, which every caller relies on.
export async function triggerCron(
  worker: WorkerDefinition,
  trigger: CronTrigger,
): Promise<CronOutcome> {
  const cron = worker.cronFor(trigger.cronId);
  if (!cron) {
    return create(CronOutcomeSchema, {
      error: create(FailureSchema, {
        code: "unknown_cron",
        message: `${trigger.cronId} is not declared by this worker.`,
      }),
    });
  }

  return CallScope.run(
    {
      capabilityToken: trigger.capabilityToken,
      traceId: trigger.traceId,
      invocationId: trigger.cronId,
      node: "",
    },
    async () => {
      try {
        await cron.handler();
        return create(CronOutcomeSchema, { completed: true });
      } catch (cause) {
        return create(CronOutcomeSchema, {
          error: create(FailureSchema, {
            code: "handler_failed",
            message: describeCause(cause),
          }),
        });
      }
    },
  );
}

function scopeOf(invocation: Invocation, node: string) {
  return {
    capabilityToken: invocation.capabilityToken,
    traceId: invocation.traceId,
    invocationId: invocation.invocationId,
    node,
  };
}

async function replyFrom(invocationId: string, response: Response): Promise<Reply> {
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return create(ReplySchema, {
    invocationId,
    status: response.status,
    headers,
    body: new Uint8Array(await response.arrayBuffer()),
  });
}

function failedReply(invocationId: string, code: string, message: string): Reply {
  return create(ReplySchema, {
    invocationId,
    status: 500,
    failure: create(FailureSchema, { code, message }),
  });
}
