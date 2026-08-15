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

import { Realtime } from "../../gen/scribe/host/dependencies/database/realtime/protocol/realtime_pb.ts";
import { type EventScope, encodeEventScope } from "../contracts/access.ts";
import { encodeJson } from "../contracts/json.ts";
import { host } from "./channel.ts";
import { raiseOn } from "./error.ts";

const CAPABILITY = "realtime";

export interface BroadcastTarget {
  readonly scope: EventScope;
  readonly ids?: readonly string[];
  readonly topic?: string;
}

export const realtime = {
  async broadcast(
    entity: string,
    event: string,
    target: BroadcastTarget,
    payload: unknown,
  ): Promise<number> {
    const result = await host.client().call(Realtime.method.broadcast, {
      entity,
      event,
      target: {
        scope: encodeEventScope(target.scope),
        ids: [...(target.ids ?? [])],
        topic: target.topic ?? "",
      },
      payload: encodeJson(payload),
    });
    raiseOn(CAPABILITY, result.error);
    return result.delivered;
  },

  async joinTopic(topic: string, memberIds: readonly string[]): Promise<void> {
    const result = await host.client().call(Realtime.method.joinTopic, {
      topic,
      memberIds: [...memberIds],
    });
    raiseOn(CAPABILITY, result.error);
  },

  async leaveTopic(topic: string, memberIds: readonly string[]): Promise<void> {
    const result = await host.client().call(Realtime.method.leaveTopic, {
      topic,
      memberIds: [...memberIds],
    });
    raiseOn(CAPABILITY, result.error);
  },
};
