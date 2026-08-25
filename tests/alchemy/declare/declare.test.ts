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

import { contains, equals, expect, having, isA, isFalse, isTrue, throwsA } from "@scribe/alchemy/test";
import { DuplicateDeclarationError, Registry, Slot } from "@scribe/alchemy";

Deno.test("a registry hands back what was declared under a name", () => {
  const audiences = new Registry<string>("audience");

  expect(audiences.declare("editors", "the editors"), equals("the editors"), "declaring answered something else");
  expect(audiences.named("editors"), equals("the editors"), "the registry lost what it was given");
});

Deno.test("a name declared twice is refused where it is written", () => {
  const audiences = new Registry<string>("audience");
  audiences.declare("editors", "first");

  expect(
    () => audiences.declare("editors", "second"),
    throwsA(having(
      isA(DuplicateDeclarationError),
      (raised) => raised.message,
      "message",
      contains('audience "editors" is declared twice'),
    )),
  );
});

Deno.test("the kind is named in the refusal, so the reader knows which registry spoke", () => {
  const configs = new Registry<number>("remote config");
  configs.declare("timeout", 1);

  expect(
    () => configs.declare("timeout", 2),
    throwsA(having(
      isA(DuplicateDeclarationError),
      (raised) => raised.message,
      "message",
      contains('remote config "timeout"'),
    )),
  );
});

Deno.test("a name nobody declared answers nothing rather than throwing", () => {
  const audiences = new Registry<string>("audience");

  expect(audiences.named("editors"), equals(null), "an undeclared name answered something");
  expect(audiences.holds("editors"), isFalse, "an undeclared name is claimed to be held");
});

Deno.test("a registry hands back everything in the order it was declared", () => {
  const links = new Registry<string>("link");
  links.declare("invite", "a");
  links.declare("share", "b");

  expect(links.all(), equals(["a", "b"]), "the declarations came back in another order");
  expect(links.names(), equals(["invite", "share"]), "the names came back in another order");
  expect(links.size, equals(2), "the registry miscounted what it holds");
});

Deno.test("forgetting empties the registry, which only a test has any business doing", () => {
  const links = new Registry<string>("link");
  links.declare("invite", "a");
  links.forget();

  expect(links.size, equals(0), "the registry kept a declaration after being emptied");
  links.declare("invite", "b");
  expect(links.named("invite"), equals("b"), "a name freed by forgetting is still refused");
});

Deno.test("a slot and a registry are the two halves of the same idea", () => {
  const transport = new Slot<string>("RealtimeTransports");
  const channels = new Registry<string>("channel");

  transport.use("event log");
  channels.declare("rows", "the rows channel");

  expect(transport.configured, isTrue, "the slot forgot it was filled");
  expect(channels.size, equals(1), "the registry forgot its declaration");
});
