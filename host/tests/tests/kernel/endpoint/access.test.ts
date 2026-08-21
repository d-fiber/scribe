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

import { Time } from "@scribe/core/contracts/common/time.ts";
import { ApiContext, ApiEndpoint, Caller } from "@scribe/core/kernel/endpoint/api.ts";
import { callEndpoint } from "@scribe/core/testing/kernel/endpoint.ts";
import { installRateLimiterMock } from "@scribe/foundation/tests/testing/valkery.ts";
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
