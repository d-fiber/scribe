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
import type { Bootstrapper } from "@scribe/shell/common/bootstrapper.ts";
import { BootSequence } from "@scribe/shell/common/boot_sequence.ts";
import { assertEquals, assertRejects } from "@std/assert";

function recorder(trace: string[], name: string, fails = false): Bootstrapper {
  return {
    name,
    boot() {
      trace.push(`boot:${name}`);
      if (fails) throw new Error(`${name} exploded`);
    },
    shutdown() {
      trace.push(`shutdown:${name}`);
    },
  };
}

Scribe.test("BootSequence boots in declaration order", async () => {
  const trace: string[] = [];
  await new BootSequence("test", [
    recorder(trace, "a"),
    recorder(trace, "b"),
    recorder(trace, "c"),
  ]).boot();

  assertEquals(trace, ["boot:a", "boot:b", "boot:c"]);
});

Scribe.test("BootSequence shuts down in reverse order", async () => {
  const trace: string[] = [];
  const sequence = new BootSequence("test", [
    recorder(trace, "a"),
    recorder(trace, "b"),
  ]);

  await sequence.boot();
  trace.length = 0;
  await sequence.shutdown();

  assertEquals(trace, ["shutdown:b", "shutdown:a"]);
});

Scribe.test("BootSequence rolls back what already booted when one fails", async () => {
  const trace: string[] = [];
  const sequence = new BootSequence("test", [
    recorder(trace, "a"),
    recorder(trace, "b", true),
    recorder(trace, "c"),
  ]);

  await assertRejects(() => sequence.boot(), Error, "b exploded");

  assertEquals(trace, ["boot:a", "boot:b", "shutdown:a"]);
});

Scribe.test("BootSequence shutdown is idempotent", async () => {
  const trace: string[] = [];
  const sequence = new BootSequence("test", [recorder(trace, "a")]);

  await sequence.boot();
  await sequence.shutdown();
  await sequence.shutdown();

  assertEquals(trace, ["boot:a", "shutdown:a"]);
});

Scribe.test("BootSequence tolerates a bootstrapper without shutdown", async () => {
  const trace: string[] = [];
  const sequence = new BootSequence("test", [
    { name: "bare", boot: () => void trace.push("boot:bare") },
  ]);

  await sequence.boot();
  await sequence.shutdown();

  assertEquals(trace, ["boot:bare"]);
});
