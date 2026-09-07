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
import { equals, expect, isA, isFalse, isTrue, Scribe, throwsA } from "@scribe/alchemy/test";
import { HttpResponse } from "@scribe/alchemy/http";

Scribe.test("a status under 100 is refused, since a status code is always three digits", () => {
  expect(() => new HttpResponse("", 99), throwsA(isA(Error)));
});

Scribe.test("a status of exactly 100 is accepted", () => {
  const response = new HttpResponse("", 100);
  expect(response.statusCode, equals(100));
});

Scribe.test("ok is false at 199, true at 200, true at 299 and false at 300", () => {
  expect(new HttpResponse("", 199).ok, isFalse, "199 was read as a success");
  expect(new HttpResponse("", 200).ok, isTrue, "200 was not read as a success");
  expect(new HttpResponse("", 299).ok, isTrue, "299 was not read as a success");
  expect(new HttpResponse("", 300).ok, isFalse, "300 was read as a success");
});

Scribe.test("request, reasonPhrase, isRedirect and persistentConnection default sensibly when left out", () => {
  const response = new HttpResponse("", 200);

  expect(response.request, equals(null));
  expect(response.reasonPhrase, equals(null));
  expect(response.isRedirect, isFalse);
  expect(response.persistentConnection, isTrue);
});

Scribe.test("headers default to an empty Headers rather than null", () => {
  const response = new HttpResponse("", 200);
  expect([...response.headers].length, equals(0));
});
