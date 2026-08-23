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

import { contains, equals, expect } from "../../../src/test/mod.ts";
import { HtmlPage } from "../../../src/api/route/mod.ts";

const PAGE = "<!doctype html><title>Reset</title>";

function policyOf(response: Response): string {
  return response.headers.get("Content-Security-Policy") ?? "";
}

Deno.test("a rendered page says it is html and forbids being stored", () => {
  const response = HtmlPage.render(PAGE);

  expect(response.headers.get("Content-Type"), equals("text/html; charset=utf-8"));
  expect(response.headers.get("Cache-Control"), equals("no-store, no-cache, must-revalidate"));
  expect(response.headers.get("Referrer-Policy"), equals("no-referrer"));
  expect(response.headers.get("X-Content-Type-Options"), equals("nosniff"));
  expect(response.headers.get("X-Frame-Options"), equals("DENY"));
});

Deno.test("a rendered page answers 200 and the html it was given", async () => {
  const response = HtmlPage.render(PAGE);

  expect(response.status, equals(200));
  expect(await response.text(), equals(PAGE));
});

Deno.test("a rendered page keeps the status it was given", () => {
  expect(HtmlPage.render(PAGE, 404).status, equals(404));
  expect(HtmlPage.renderForm(PAGE, 400).status, equals(400));
  expect(HtmlPage.renderInterstitial(PAGE, 410).status, equals(410));
});

Deno.test("every page loads nothing from anywhere but itself", () => {
  for (const response of [HtmlPage.render(PAGE), HtmlPage.renderForm(PAGE), HtmlPage.renderInterstitial(PAGE)]) {
    const policy = policyOf(response);

    expect(policy, contains("default-src 'none'"), "the page may load from an origin nobody named");
    expect(policy, contains("base-uri 'none'"));
    expect(policy, contains("frame-ancestors 'none'"));
    expect(policy, contains("img-src 'self' data:"));
  }
});

Deno.test("a sealed page may neither post a form nor open a request", () => {
  const policy = policyOf(HtmlPage.render(PAGE));

  expect(policy, contains("form-action 'none'"));
  expect(policy, contains("connect-src 'none'"), "connect-src is left to default-src instead of being written out");
});

Deno.test("a form page may post to itself and nothing more", () => {
  const policy = policyOf(HtmlPage.renderForm(PAGE));

  expect(policy, contains("form-action 'self'"));
  expect(policy, contains("connect-src 'none'"), "a form page may also reach an origin with a request");
});

Deno.test("an interstitial may report to itself and post no form", () => {
  const policy = policyOf(HtmlPage.renderInterstitial(PAGE));

  expect(policy, contains("connect-src 'self'"), "the beacon of an interstitial is refused silently");
  expect(policy, contains("form-action 'none'"), "an interstitial may also submit a form");
});
