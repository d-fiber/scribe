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

import { equals, expect } from "@scribe/alchemy/test";
import { Duration, ExponentialBackoff } from "@scribe/alchemy";

Deno.test("ExponentialBackoff doubles from the base and stops at the ceiling", () => {
  const backoff = new ExponentialBackoff(Duration.milliseconds(1_000), Duration.milliseconds(30_000));

  expect(backoff.delayFor(1).inMilliseconds, equals(1_000));
  expect(backoff.delayFor(2).inMilliseconds, equals(2_000));
  expect(backoff.delayFor(3).inMilliseconds, equals(4_000));
  expect(backoff.delayFor(6).inMilliseconds, equals(30_000));
  expect(backoff.delayFor(50).inMilliseconds, equals(30_000));
});

Deno.test("ExponentialBackoff never returns more than the ceiling, even at attempt 1", () => {
  const backoff = new ExponentialBackoff(Duration.milliseconds(5_000), Duration.milliseconds(1_000));

  expect(backoff.delayFor(1).inMilliseconds, equals(1_000));
});

Deno.test("ExponentialBackoff treats attempt 0 and negatives as the first attempt", () => {
  const backoff = new ExponentialBackoff(Duration.milliseconds(500), Duration.milliseconds(10_000));

  expect(backoff.delayFor(0).inMilliseconds, equals(500));
  expect(backoff.delayFor(-3).inMilliseconds, equals(500));
});

Deno.test("ExponentialBackoff honours a custom factor", () => {
  const backoff = new ExponentialBackoff(Duration.milliseconds(100), Duration.milliseconds(100_000), 3);

  expect(backoff.delayFor(2).inMilliseconds, equals(300));
  expect(backoff.delayFor(3).inMilliseconds, equals(900));
});
