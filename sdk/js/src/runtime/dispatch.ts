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

import { create } from "@bufbuild/protobuf";
import { FailureSchema } from "../../gen/scribe/protocol/common_pb.ts";
import {
  type Invocation,
  type Reply,
  ReplySchema,
} from "../../gen/scribe/protocol/invocation_pb.ts";
import {
  type Batch,
  type BatchOutcome,
  BatchOutcomeSchema,
} from "../../gen/scribe/host/core/runtime/event_driven/queue/protocol/queue_pb.ts";
import {
  type Event,
  type HandleResult,
  HandleResultSchema,
} from "../../gen/scribe/host/core/runtime/event_driven/hook/protocol/hook_pb.ts";
import {
  type CronOutcome,
  CronOutcomeSchema,
  type CronTrigger,
} from "../../gen/scribe/host/core/runtime/event_driven/cron/protocol/cron_pb.ts";
import { decodeJson, encodeJson } from "../contracts/json.ts";
import type { QueueMessage } from "../manifest/events.ts";
import type { WorkerDefinition } from "../manifest/worker.ts";
import { describeCause } from "../transport/failure.ts";
import { InvocationContext } from "./context.ts";
import { CallScope } from "./scope.ts";

export async function invoke(worker: WorkerDefinition, invocation: Invocation): Promise<Reply> {
  const mounted = worker.routeFor(invocation.routeId);
  if (!mounted) {
    return failedReply(
      invocation.invocationId,
      "unknown_route",
      `${invocation.routeId} is not declared by this worker.`,
    );
  }

  return CallScope.run(scopeOf(invocation), async () => {
    try {
      const response = await mounted.route.handler(new InvocationContext(invocation));
      return await replyFrom(invocation.invocationId, response);
    } catch (cause) {
      return failedReply(invocation.invocationId, "handler_failed", describeCause(cause));
    }
  });
}

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
    { capabilityToken: batch.capabilityToken, traceId: batch.traceId, invocationId: batch.queueId },
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

function scopeOf(invocation: Invocation) {
  return {
    capabilityToken: invocation.capabilityToken,
    traceId: invocation.traceId,
    invocationId: invocation.invocationId,
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
