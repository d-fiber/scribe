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

import { Time } from "@scribe/core/contracts/common/time.ts";
import { ApiContext, ApiEndpoint, Caller } from "@scribe/core/kernel/endpoint/api.ts";
import { callEndpoint } from "@scribe/core/testing/kernel/endpoint.ts";
import { installRateLimiterMock } from "@scribe/foundation/testing/valkery.ts";
import { assertEquals } from "@std/assert";

class UnsignedWebhookEndpoint extends ApiEndpoint {
  protected access(): Caller {
    return Caller.Webhook;
  }

  protected rateLimit() {
    return {
      limit: 10,
      window: Time.minutes(1),
      penalty: Time.minutes(1),
    };
  }

  protected run(_ctx: ApiContext): Response {
    return this.response.ok({ data: { reached: true } });
  }
}

class OpenEndpoint extends ApiEndpoint {
  protected access(): Caller {
    return Caller.Anonymous;
  }

  protected rateLimit() {
    return {
      limit: 10,
      window: Time.minutes(1),
      penalty: Time.minutes(1),
    };
  }

  protected run(_ctx: ApiContext): Response {
    return this.response.ok({ data: { reached: true } });
  }
}

Deno.test("declaring Caller.Webhook does not by itself open an endpoint", async () => {
  const limiter = installRateLimiterMock();
  try {
    const result = await callEndpoint(() => UnsignedWebhookEndpoint.handle());

    assertEquals(
      result.status,
      401,
      "only WebhookEndpoint, which checks the signature, may satisfy Caller.Webhook",
    );
  } finally {
    limiter.restore();
  }
});

Deno.test("Caller.Anonymous stays open, it declares no proof at all", async () => {
  const limiter = installRateLimiterMock();
  try {
    const result = await callEndpoint(() => OpenEndpoint.handle());
    assertEquals(result.status, 200);
  } finally {
    limiter.restore();
  }
});
