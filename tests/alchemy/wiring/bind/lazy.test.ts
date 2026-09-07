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

import "@scribe/scholium/runner.ts";
import { equals, expect, isFalse, isNotNull, isTrue, Scribe, throwsA } from "@scribe/alchemy/test";
import { Lazy } from "@scribe/alchemy";

Scribe.test("get computes the value on the first call", () => {
  const lazy = new Lazy(() => "opened");
  expect(lazy.get(), equals("opened"));
});

Scribe.test("get calls open exactly once, however many times it is called", () => {
  let opens = 0;
  const lazy = new Lazy(() => {
    opens++;
    return opens;
  });

  lazy.get();
  lazy.get();
  const third = lazy.get();

  expect(opens, equals(1), "open ran more than once");
  expect(third, equals(1), "a later call answered a value later than the first");
});

Scribe.test("resolved is false before the first get, and true after", () => {
  const lazy = new Lazy(() => "opened");

  expect(lazy.resolved, isFalse, "resolved was true before anything asked for the value");
  lazy.get();
  expect(lazy.resolved, isTrue, "resolved stayed false after the value was computed");
});

Scribe.test("an open that raises leaves resolved false, and the next get tries again", () => {
  let attempts = 0;
  const lazy = new Lazy(() => {
    attempts++;
    if (attempts === 1) throw new Error("not ready yet");
    return "opened on retry";
  });

  expect(() => lazy.get(), throwsA(isNotNull));
  expect(lazy.resolved, isFalse, "a failed open was still counted as resolved");

  expect(lazy.get(), equals("opened on retry"));
  expect(lazy.resolved, isTrue);
});
