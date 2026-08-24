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

import { contains, equals, expect, isA } from "@scribe/engine/alchemy/test/mod.ts";
import { Refusal, REFUSAL_KINDS, renderError, ScribeError } from "@scribe/engine/alchemy/mod.ts";

Deno.test("each way in carries the kind that matches what it says", () => {
  expect(Refusal.missing("nothing here").kind, equals("missing"));
  expect(Refusal.denied("not for you").kind, equals("denied"));
  expect(Refusal.conflict("already there").kind, equals("conflict"));
  expect(Refusal.invalid("bad shape").kind, equals("invalid"));
  expect(Refusal.unavailable("no answer").kind, equals("unavailable"));
});

Deno.test("a refusal is raised on purpose, so it prints as its sentence and keeps no trace", () => {
  const rendered = renderError(Refusal.missing('no audience is declared under "editors".'));

  expect(rendered, contains('no audience is declared under "editors".'));
  expect(rendered.includes("refusal.test.ts"), equals(false));
});

Deno.test("a refusal descends from the base every deliberate raise shares", () => {
  expect(Refusal.denied("not for you"), isA(ScribeError));
});

Deno.test("the cause travels with the refusal that wraps it", () => {
  const underneath = new Error("the socket closed");
  const raised = Refusal.unavailable("the index is not answering.", { cause: underneath });

  expect(raised.cause, equals(underneath));
});

Deno.test("every kind is listed, so a host mapping them can be made to cover all five", () => {
  const mapped: Record<string, number> = {};
  for (const kind of REFUSAL_KINDS) mapped[kind] = 1;

  expect(Object.keys(mapped).length, equals(5));
  expect(REFUSAL_KINDS.includes("missing"), equals(true));
});
