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
import {
  type PushRequest,
  type PushResult,
  PushResultSchema,
} from "@scribe/sdk/gen/scribe/host/packages/foundation/protocol/queue/queue_pb.ts";
import {
  type EmitResult,
  EmitResultSchema,
  type Event,
} from "@scribe/sdk/gen/scribe/host/packages/foundation/protocol/hook/hook_pb.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { hookRegistry } from "@scribe/foundation/src/hook/mod.ts";
import { QueueProducer } from "@scribe/foundation/src/queue/core/producer.ts";
import { queueRegistry } from "@scribe/foundation/src/queue/mod.ts";
import { decodeJson } from "../json.ts";

function describe(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

export async function queuePush(request: PushRequest): Promise<PushResult> {
  const registered = queueRegistry.get(request.queueId);
  if (!registered) {
    return create(PushResultSchema, {
      error: {
        code: "unknown_queue",
        message: `${request.queueId} is not declared by the host.`,
      },
    });
  }

  const producer = new QueueProducer<unknown>(registered);
  const delay = Number(request.delay?.millis ?? 0n);

  try {
    const messageIds = await Promise.all(
      request.payloads.map((payload) =>
        producer.push(decodeJson(payload), delay > 0 ? { delay: Time.ms(delay) } : {})
      ),
    );
    return create(PushResultSchema, { messageIds });
  } catch (cause) {
    return create(PushResultSchema, {
      error: { code: "push_failed", message: describe(cause) },
    });
  }
}

export async function hookEmit(event: Event): Promise<EmitResult> {
  const hook = hookRegistry.get(event.event);
  if (!hook) {
    return create(EmitResultSchema, {
      error: {
        code: "unknown_hook",
        message: `${event.event} is not declared by the host.`,
      },
    });
  }

  try {
    await hook.run(decodeJson(event.payload) as never);
    return create(EmitResultSchema, { handled: hook.handlers() });
  } catch (cause) {
    return create(EmitResultSchema, {
      error: { code: "emit_failed", message: describe(cause) },
    });
  }
}
