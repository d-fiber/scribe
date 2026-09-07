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
import { equals, expect, hasLength, Scribe } from "@scribe/alchemy/test";
import { declaredGrants, forgetGrants, Grant } from "@scribe/alchemy";

Scribe.test("the same grant declared twice does not throw, unlike every other schema declaration", () => {
  forgetGrants();
  const first = Grant().privileges(["usage"]).on((o) => o.schema("public")).to(["authenticated"]);
  const second = Grant().privileges(["usage"]).on((o) => o.schema("public")).to(["authenticated"]);

  first.declareInto("provisioning");
  second.declareInto("provisioning");

  expect(declaredGrants("provisioning"), hasLength(2));
});

Scribe.test("privileges and on can be given in either order, and both close on to", () => {
  forgetGrants();
  const privilegesFirst = Grant().privileges(["select"]).on((o) => o.sequence("bookings_id_seq")).to(["authenticated"])
    .declareInto("init");
  const onFirst = Grant().on((o) => o.sequence("bookings_id_seq")).privileges(["select"]).to(["authenticated"])
    .declareInto("init");

  expect(privilegesFirst.options, equals(onFirst.options));
});

Scribe.test("declaredGrants filters by the moment it was declared for", () => {
  forgetGrants();
  Grant().privileges(["usage"]).on((o) => o.schema("public")).to(["authenticated"]).declareInto("init");
  Grant().privileges(["connect"]).on((o) => o.database("postgres")).to(["authenticated"]).declareInto("provisioning");

  const init = declaredGrants("init");
  const provisioning = declaredGrants("provisioning");

  expect(init, hasLength(1));
  expect(provisioning, hasLength(1));
  expect(init[0].options.on, equals({ kind: "schema", name: "public" }));
  expect(provisioning[0].options.on, equals({ kind: "database", name: "postgres" }));
});

Scribe.test("withGrantOption is reflected on the declared grant", () => {
  forgetGrants();
  const declared = Grant().privileges(["usage"]).on((o) => o.schema("public")).withGrantOption().to(["authenticated"])
    .declareInto("init");

  expect(declared.options.withGrantOption, equals(true));
});

Scribe.test("GrantObjectFactory carries no table method, since a table grant belongs on Table's own .grants", () => {
  forgetGrants();
  const declared = Grant().privileges(["execute"]).on((o) => o.function("recompute_score")).to(["authenticated"])
    .declareInto("init");

  expect(declared.options.on, equals({ kind: "function", name: "recompute_score" }));
});

Scribe.test("forgetGrants empties every moment at once", () => {
  forgetGrants();
  Grant().privileges(["usage"]).on((o) => o.schema("public")).to(["authenticated"]).declareInto("init");

  forgetGrants();

  expect(declaredGrants("init"), equals([]));
});
