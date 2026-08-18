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
import { TimeSchema } from "../../gen/scribe/protocol/common_pb.ts";
import { Queue } from "../../gen/scribe/host/packages/foundation/protocol/queue/queue_pb.ts";
import { Hook } from "../../gen/scribe/host/packages/foundation/protocol/hook/hook_pb.ts";
import { encodeJson } from "../contracts/json.ts";
import type { Time } from "../contracts/time.ts";
import { CallScope } from "../runtime/scope.ts";
import { host } from "./channel.ts";
import { raiseOn } from "./error.ts";

export const queue = {
  async push(
    queueId: string,
    payloads: readonly unknown[],
    delay?: Time,
  ): Promise<readonly string[]> {
    const result = await host.client().call(Queue.method.push, {
      queueId,
      payloads: payloads.map(encodeJson),
      delay: delay ? create(TimeSchema, { millis: BigInt(delay.ms) }) : undefined,
    });
    raiseOn("queue", result.error);
    return result.messageIds;
  },
};

export const hooks = {
  async emit(event: string, payload: unknown): Promise<number> {
    const result = await host.client().call(Hook.method.emit, {
      event,
      payload: encodeJson(payload),
      traceId: CallScope.current().traceId,
      emittedAt: BigInt(Date.now()),
    });
    raiseOn("hook", result.error);
    return result.handled;
  },
};
