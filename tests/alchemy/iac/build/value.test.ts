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
import { env, resolveValue, resource, setting, sizingToken, template } from "@scribe/alchemy";

Scribe.test("env reads a shell environment variable by name", () => {
  expect(env("POSTGRES_PASSWORD"), equals({ kind: "env", name: "POSTGRES_PASSWORD" }));
});

Scribe.test("setting reads a project-tuned key by name", () => {
  expect(setting("bucketName"), equals({ kind: "setting", key: "bucketName" }));
});

Scribe.test("sizingToken names a token the sizing rules compute at render time", () => {
  expect(sizingToken("storage_cpu_shares"), equals({ kind: "sizingToken", name: "storage_cpu_shares" }));
});

Scribe.test("resource reads a contract field off a placed resource, by name", () => {
  expect(resource("objects", "endpoint"), equals({ kind: "resource", name: "objects", field: "endpoint" }));
});

Scribe.test("template carries raw text verbatim, markers included", () => {
  expect(
    template("postgresql://user:${POSTGRES_PASSWORD}@db:5432/postgres"),
    equals({ kind: "template", raw: "postgresql://user:${POSTGRES_PASSWORD}@db:5432/postgres" }),
  );
});

Scribe.test("resolveValue wraps a plain string as a literal", () => {
  expect(resolveValue("unless-stopped"), equals({ kind: "literal", value: "unless-stopped" }));
});

Scribe.test("resolveValue leaves an already-typed value untouched", () => {
  const already = env("S3_ENDPOINT");
  expect(resolveValue(already), equals(already));
});
