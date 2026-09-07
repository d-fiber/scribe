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
import { equals, expect, Scribe } from "@scribe/alchemy/test";
import { ClientException } from "@scribe/alchemy/http";

Scribe.test("toString names the message alone when no uri is given", () => {
  const raised = new ClientException("the connection was refused");
  expect(raised.toString(), equals("ClientException: the connection was refused"));
});

Scribe.test("toString names the message and the uri when one is given", () => {
  const raised = new ClientException("the connection was refused", new URL("https://example.test/one"));
  expect(raised.toString(), equals("ClientException: the connection was refused, uri=https://example.test/one"));
});

Scribe.test("uri answers null when none was given", () => {
  const raised = new ClientException("failed");
  expect(raised.uri, equals(null));
});

Scribe.test("the name is set to ClientException, so it reads that way in a stack trace", () => {
  const raised = new ClientException("failed");
  expect(raised.name, equals("ClientException"));
});

Scribe.test("a cause given in options is carried the way a plain Error carries it", () => {
  const cause = new Error("underlying");
  const raised = new ClientException("failed", null, { cause });
  expect(raised.cause, equals(cause));
});
