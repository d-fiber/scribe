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

import "@scribe/runtime/scholium/runner.ts";
import { Scribe } from "@scribe/alchemy/test";
import { assertEquals, assertFalse } from "@std/assert";
import type { WorkerSettings } from "@scribe/contracts/settings.ts";
import { workerSettings } from "@scribe/runtime/support/settings/worker.ts";
import { workerEnabled } from "@scribe/embedder/enabled.ts";

const DEPLOYMENT: WorkerSettings = {
  endpoint: null,
  callbackUrl: null,
  callbackPort: 4747,
  callbackHostname: "0.0.0.0",
  handshakeAttempts: 10,
  handshakeDelayMs: 1_000,
  publicNodes: [],
};

function asking<T>(endpoint: string | null, body: () => T): T {
  const held = workerSettings.configured ? workerSettings.get() : null;
  workerSettings.use({ ...DEPLOYMENT, endpoint });
  try {
    return body();
  } finally {
    if (held !== null) workerSettings.use(held);
  }
}

Scribe.test("a deployment that names no worker endpoint runs none", () => {
  assertFalse(asking(null, workerEnabled), "the host would have opened a worker nobody asked for");
});

Scribe.test("a deployment that names one runs it", () => {
  assertEquals(asking("http://worker.test:4747", workerEnabled), true);
});
