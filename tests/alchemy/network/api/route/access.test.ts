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
import { equals, expect, isFalse, isTrue, Scribe } from "@scribe/alchemy/test";
import { CALLERS, callersOf, isCaller, isRouteMethod, ROUTE_METHODS } from "@scribe/alchemy/route";

Scribe.test("isCaller accepts every one of the four ways a call is proved", () => {
  for (const caller of CALLERS) {
    expect(isCaller(caller), isTrue, `${caller} is one of CALLERS`);
  }
});

Scribe.test("isCaller refuses a value CALLERS does not name", () => {
  expect(isCaller("admin"), isFalse, "a value outside CALLERS was accepted");
  expect(isCaller(""), isFalse, "an empty value was accepted");
  expect(isCaller("Anonymous"), isFalse, "a value differing only by case was accepted");
});

Scribe.test("isRouteMethod accepts every one of the five verbs", () => {
  for (const method of ROUTE_METHODS) {
    expect(isRouteMethod(method), isTrue, `${method} is one of ROUTE_METHODS`);
  }
});

Scribe.test("isRouteMethod refuses a value ROUTE_METHODS does not name", () => {
  expect(isRouteMethod("head"), isFalse, "a value outside ROUTE_METHODS was accepted");
  expect(isRouteMethod("GET"), isFalse, "an uppercase verb was accepted");
});

Scribe.test("callersOf wraps a single caller into a one-element list", () => {
  expect(callersOf("authenticated"), equals(["authenticated"]));
});

Scribe.test("callersOf hands a list back exactly as given", () => {
  expect(callersOf(["authenticated", "service"]), equals(["authenticated", "service"]));
});

Scribe.test("callersOf answers an empty list for an empty list, not a one-element list of nothing", () => {
  expect(callersOf([]), equals([]));
});
