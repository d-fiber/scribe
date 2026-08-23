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

import type { Duration } from "../../value/duration.ts";

/**
 * What an endpoint declares about how often it may be called.
 *
 * @remarks
 * It is a declaration and not a limiter. What counts the calls and refuses them is the port,
 * `RateLimiters`, and the two are kept apart on purpose: an endpoint says what it wants, and what
 * enforces it is filled by the host and replaced in a test.
 *
 * The penalty is what separates this from a plain quota. A caller that goes over is not simply
 * refused until the window turns: it is held out for `penalty`, and holding out again doubles it
 * up to `maxPenalty`. So somebody hammering an endpoint is slowed down further each time, while
 * somebody who went over once waits the short time and carries on.
 */
export interface RateLimit {
  /** How many calls are allowed inside one window. */
  limit: number;

  /** How long a window lasts before the count starts again. */
  window: Duration;

  /** How long a caller that went over is held out, the first time. */
  penalty: Duration;

  /** The longest a caller is ever held out, however many times it went over. */
  maxPenalty?: Duration;
}
