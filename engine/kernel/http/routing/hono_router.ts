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

import { Hono } from "hono";
import { TrieRouter } from "hono/router/trie-router";

/**
 * A Hono built on the router the framework picks, rather than the one it defaults to.
 *
 * @remarks
 * Hono's default is `SmartRouter`, which chooses `RegExpRouter` whenever the route
 * table allows it. That router compiles every route into one regular expression,
 * lazily, inside the first `match` the process serves. Three things follow from
 * that, and the third is why this file exists.
 *
 * A match costs roughly a hundred instructions per mounted route, because the
 * matching group is found by scanning them. At five thousand parameterised routes
 * that is around forty microseconds against about one for a trie.
 *
 * The compile is paid on the first request rather than at boot, and it grows
 * faster than the table: about a second at five thousand routes, three and a half
 * at ten thousand. Every cold isolate pays it, on the first user it answers.
 *
 * And between twelve and fourteen thousand parameterised routes V8 refuses the
 * expression outright, `SyntaxError: Regular expression too large`. No flag lifts
 * it, `SmartRouter` catches only `UnsupportedPathError` and rethrows the rest, and
 * it happens after the process booted and answered a health check on a static
 * path. A trie has no such ceiling and is flat across the whole range.
 *
 * What it costs is about two hundred nanoseconds a request below fifty routes,
 * where the expression is still small enough to win. A framework is not tuned for
 * fifty routes.
 */
export function honoRouter(): Hono {
  return new Hono({ router: new TrieRouter() });
}
