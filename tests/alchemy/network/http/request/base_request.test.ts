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
import { HttpRequest } from "@scribe/alchemy/http";

Scribe.test("finalize seals the request, so a later write to redirect is refused", () => {
  const request = new HttpRequest("GET", "https://example.test/one");
  request.finalize();

  expect(() => {
    request.redirect = "manual";
  }, throwsA(isA(Error)));
});

Scribe.test("finalize seals the request, so a later write to maxRedirects is refused", () => {
  const request = new HttpRequest("GET", "https://example.test/one");
  request.finalize();

  expect(() => {
    request.maxRedirects = 1;
  }, throwsA(isA(Error)));
});

Scribe.test("finalize seals the request, so a later write to persistentConnection is refused", () => {
  const request = new HttpRequest("GET", "https://example.test/one");
  request.finalize();

  expect(() => {
    request.persistentConnection = false;
  }, throwsA(isA(Error)));
});

Scribe.test("finalize seals the request, so a later write to timeoutMs is refused", () => {
  const request = new HttpRequest("GET", "https://example.test/one");
  request.finalize();

  expect(() => {
    request.timeoutMs = 500;
  }, throwsA(isA(Error)));
});

Scribe.test("finalized is false before finalize and true after", () => {
  const request = new HttpRequest("GET", "https://example.test/one");

  expect(request.finalized, isFalse, "a fresh request claimed to be finalized");
  request.finalize();
  expect(request.finalized, isTrue, "a finalized request did not say so");
});

Scribe.test("followRedirects reads and writes through redirect, follow meaning true and manual meaning false", () => {
  const request = new HttpRequest("GET", "https://example.test/one");

  expect(request.followRedirects, isTrue, "a request did not default to following redirects");

  request.followRedirects = false;
  expect(request.redirect, equals("manual"), "turning followRedirects off did not set redirect to manual");

  request.followRedirects = true;
  expect(request.redirect, equals("follow"), "turning followRedirects on did not set redirect to follow");
});

Scribe.test("redirect defaults to follow, and maxRedirects to five", () => {
  const request = new HttpRequest("GET", "https://example.test/one");

  expect(request.redirect, equals("follow"));
  expect(request.maxRedirects, equals(5));
});

Scribe.test("the method is upper-cased regardless of how it was given", () => {
  const request = new HttpRequest("get", "https://example.test/one");
  expect(request.method, equals("GET"));
});

Scribe.test("toString answers the method and the address, nothing else", () => {
  const request = new HttpRequest("post", "https://example.test/orders");
  expect(request.toString(), equals("POST https://example.test/orders"));
});
