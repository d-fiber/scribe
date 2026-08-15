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

import { clients } from "@scribe/host/dependencies/clients.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { rateLimiter } from "@scribe/core/runtime/redis/rate_limiter/mod.ts";
import { request } from "@scribe/core/runtime/http/request.ts";
import type { Context } from "hono";

const _PIXEL = Uint8Array.from(
  atob("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="),
  (c) => c.charCodeAt(0),
);

function pixel(): Response {
  return new Response(_PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store",
    },
  });
}

export async function trackMailOpen(c: Context): Promise<Response> {
  const token = c.req.param("token");
  if (!token) return pixel();

  const rate = await rateLimiter.check({
    key: "mail:open",
    limit: 60,
    window: Time.minutes(1),
    penalty: Time.minutes(5),
    maxPenalty: Time.hours(1),
  });
  if (!rate.ok) return pixel();

  const found = await clients.features.messagings.mail.noreply.getByOpenToken(token);

  if (found.ok) {
    await clients.features.messagings.mail.statistics.record({
      mailId: found.data.id,
      ipAddress: request.ip(),
      userAgent: request.userAgent(),
    });
  }

  return pixel();
}
