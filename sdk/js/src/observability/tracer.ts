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

import {
  Observability,
  SpanKind,
} from "../../gen/scribe/host/dependencies/features/observability/protocol/observability_pb.ts";
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
