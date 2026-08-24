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

import {
  Observability,
  SpanKind,
} from "../../gen/scribe/engine/dependencies/features/observability/protocol/observability_pb.ts";
import { host } from "../capabilities/channel.ts";
import { encodeJson } from "../contracts/json.ts";
import { CallScope } from "../runtime/scope.ts";
import { describeCause } from "../transport/failure.ts";

function spanId(): string {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 16);
}

export const trace = {
  async span<T>(
    name: string,
    handler: () => Promise<T> | T,
    attributes: unknown = {},
  ): Promise<T> {
    const startedAt = Date.now();
    const scope = CallScope.current();

    try {
      const outcome = await handler();
      await ship(name, scope.traceId, startedAt, attributes, null);
      return outcome;
    } catch (cause) {
      await ship(name, scope.traceId, startedAt, attributes, describeCause(cause));
      throw cause;
    }
  },
};

async function ship(
  name: string,
  traceId: string,
  startedAt: number,
  attributes: unknown,
  failure: string | null,
): Promise<void> {
  if (!host.connected()) return;

  try {
    await host.client().call(Observability.method.ship, {
      spans: [
        {
          traceId,
          spanId: spanId(),
          name,
          kind: SpanKind.INTERNAL,
          startedAt: BigInt(startedAt),
          endedAt: BigInt(Date.now()),
          attributes: encodeJson(attributes),
          error: failure ? { code: "span_failed", message: failure } : undefined,
        },
      ],
    });
  } catch {
    return;
  }
}
