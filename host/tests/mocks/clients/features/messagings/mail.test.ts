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

import { okay } from "@scribe/alchemy";
import { clients } from "@scribe/host/dependencies/clients.ts";
import { assertEquals, assertThrows } from "@std/assert";
import { createMailMock, installMailMock } from "@scribe/host/tests/mocks/dependencies/features/messagings/mail.ts";

Deno.test("mail automock: unconfigured call throws", () => {
  const mock = createMailMock();
  assertThrows(() => mock.target.account.deliver(1, { subject: "x", text: "y" }));
});

Deno.test(
  "mail automock: when() configures a per-account sender method",
  async () => {
    const mock = createMailMock();
    mock.when("account.deliver", () => Promise.resolve(okay));

    const res = await mock.target.account.deliver(1, {
      subject: "x",
      text: "y",
    });
    assertEquals(res.ok, true);
  },
);

Deno.test(
  "installMailMock: intercepts an injected sub-service on the real client",
  async () => {
    const original = clients.features.messagings.mail.statistics;
    const mock = installMailMock();
    mock.when("statistics.record", () => Promise.resolve(okay));

    const res = await clients.features.messagings.mail.statistics.record({
      mailId: 1,
    });
    assertEquals(res.ok, true);
    assertEquals(mock.calls("statistics.record"), [[{ mailId: 1 }]]);

    mock.restore();
    assertEquals(clients.features.messagings.mail.statistics, original);
  },
);
