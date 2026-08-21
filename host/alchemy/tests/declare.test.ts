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

import { assert, assertEquals, assertFalse, assertThrows } from "@std/assert";
import { DuplicateDeclarationError, Registry, Slot } from "../mod.ts";

Deno.test("a registry hands back what was declared under a name", () => {
  const audiences = new Registry<string>("audience");

  assertEquals(audiences.declare("editors", "the editors"), "the editors", "declaring answered something else");
  assertEquals(audiences.named("editors"), "the editors", "the registry lost what it was given");
});

Deno.test("a name declared twice is refused where it is written", () => {
  const audiences = new Registry<string>("audience");
  audiences.declare("editors", "first");

  assertThrows(
    () => audiences.declare("editors", "second"),
    DuplicateDeclarationError,
    'audience "editors" is declared twice',
  );
});

Deno.test("the kind is named in the refusal, so the reader knows which registry spoke", () => {
  const configs = new Registry<number>("remote config");
  configs.declare("timeout", 1);

  assertThrows(() => configs.declare("timeout", 2), DuplicateDeclarationError, 'remote config "timeout"');
});

Deno.test("a name nobody declared answers nothing rather than throwing", () => {
  const audiences = new Registry<string>("audience");

  assertEquals(audiences.named("editors"), null, "an undeclared name answered something");
  assertFalse(audiences.holds("editors"), "an undeclared name is claimed to be held");
});

Deno.test("a registry hands back everything in the order it was declared", () => {
  const links = new Registry<string>("link");
  links.declare("invite", "a");
  links.declare("share", "b");

  assertEquals(links.all(), ["a", "b"], "the declarations came back in another order");
  assertEquals(links.names(), ["invite", "share"], "the names came back in another order");
  assertEquals(links.size, 2, "the registry miscounted what it holds");
});

Deno.test("forgetting empties the registry, which only a test has any business doing", () => {
  const links = new Registry<string>("link");
  links.declare("invite", "a");
  links.forget();

  assertEquals(links.size, 0, "the registry kept a declaration after being emptied");
  links.declare("invite", "b");
  assertEquals(links.named("invite"), "b", "a name freed by forgetting is still refused");
});

Deno.test("a slot and a registry are the two halves of the same idea", () => {
  const transport = new Slot<string>("RealtimeTransports");
  const channels = new Registry<string>("channel");

  transport.use("event log");
  channels.declare("rows", "the rows channel");

  assert(transport.configured, "the slot forgot it was filled");
  assertEquals(channels.size, 1, "the registry forgot its declaration");
});
