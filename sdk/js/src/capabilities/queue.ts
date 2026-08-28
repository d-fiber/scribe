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
import { TimeSchema } from "../../gen/scribe/protocol/common_pb.ts";
import { Queue } from "../../gen/scribe/packages/foundation/protocol/queue_pb.ts";
import { encodeJson } from "../contracts/json.ts";
import type { Time } from "../contracts/time.ts";
import { host } from "./channel.ts";
import { raiseOn } from "./error.ts";

/** The host's queues, as the worker that produces the work reaches them. */
export interface QueueCapability {
  /**
   * Pushes `payloads` onto the queue `queueId`, and answers the identifier given to each message.
   *
   * Every payload travels as JSON. Without `delay` the host makes the messages available at once,
   * and with it they stay invisible to a consumer for that long.
   *
   * @throws {CapabilityError} When the host refused the push.
   */
  push(queueId: string, payloads: readonly unknown[], delay?: Time): Promise<readonly string[]>;
}

export const queue: QueueCapability = {
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
