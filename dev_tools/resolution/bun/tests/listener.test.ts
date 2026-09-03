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
import { equals, expect, expectLater, isNotNull, isTrue, Scribe, throwsA } from "@scribe/alchemy/test";
import type { BoundListener, RemotePeer } from "@scribe/runtime/scholium/listener.ts";
import { LocalListener } from "@scribe/runtime/scholium/bun/listener.ts";

async function withListener(
  handler: (request: Request, peer: RemotePeer) => Response,
  run: (bound: BoundListener) => Promise<void>,
): Promise<void> {
  const bound = new LocalListener().serve(handler, { port: 0, hostname: "127.0.0.1" });

  try {
    await run(bound);
  } finally {
    await bound.shutdown();
  }
}

Scribe.test("a bound listener picks a real port and answers a real request on it", async () => {
  await withListener(
    () => new Response("hello"),
    async (bound) => {
      expect(bound.port > 0, isTrue, "an ephemeral bind must resolve to the port the platform chose");

      const response = await fetch(`http://127.0.0.1:${bound.port}/`);
      expect(await response.text(), equals("hello"));
    },
  );
});

Scribe.test("the handler sees what the caller sent", async () => {
  let seenMethod = "";
  let seenPathname = "";

  await withListener(
    (request) => {
      seenMethod = request.method;
      seenPathname = new URL(request.url).pathname;
      return new Response(null, { status: 204 });
    },
    async (bound) => {
      await fetch(`http://127.0.0.1:${bound.port}/probe`, { method: "POST", body: "x" });
    },
  );

  expect(seenMethod, equals("POST"));
  expect(seenPathname, equals("/probe"));
});

Scribe.test("a connection over TCP names its peer's hostname", async () => {
  let seenHostname: string | null = "unset";

  await withListener(
    (_request, given) => {
      seenHostname = given.hostname;
      return new Response(null, { status: 204 });
    },
    async (bound) => {
      await fetch(`http://127.0.0.1:${bound.port}/`);
    },
  );

  expect(seenHostname, equals("127.0.0.1"));
});

Scribe.test("a listener that shut down refuses the next connection", async () => {
  const bound = new LocalListener().serve(() => new Response("up"), { port: 0, hostname: "127.0.0.1" });
  await bound.shutdown();

  await expectLater(() => fetch(`http://127.0.0.1:${bound.port}/`), throwsA(isNotNull));
});
