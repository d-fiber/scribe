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
import type { DeclaredGrant, SchemaNode } from "@scribe/alchemy";
import { declaredGrants, forgetSchemas, Grant, Schema, SchemaInit, SchemaProvisioning } from "@scribe/alchemy";

function grantOf(node: SchemaNode): DeclaredGrant {
  if (node.bucket !== "grant") throw new Error(`expected a grant node, got "${node.bucket}"`);
  return node.value;
}

Scribe.test("the same grant declared twice does not throw, unlike every other schema bucket", () => {
  forgetSchemas();

  @Schema()
  class GrantSameTwice {
    @SchemaProvisioning()
    first(): SchemaNode {
      return Grant().privileges(["usage"]).on((o) => o.schema("public")).to(["authenticated"]);
    }

    @SchemaProvisioning()
    second(): SchemaNode {
      return Grant().privileges(["usage"]).on((o) => o.schema("public")).to(["authenticated"]);
    }
  }
  void GrantSameTwice;

  expect(declaredGrants("provisioning"), hasLength(2));
});

Scribe.test("privileges and on can be given in either order, and both close on to", () => {
  const privilegesFirst = grantOf(
    Grant().privileges(["select"]).on((o) => o.sequence("bookings_id_seq")).to(["authenticated"]),
  );
  const onFirst = grantOf(
    Grant().on((o) => o.sequence("bookings_id_seq")).privileges(["select"]).to(["authenticated"]),
  );

  expect(privilegesFirst.options, equals(onFirst.options));
});

Scribe.test("declaredGrants filters by the moment it was declared for", () => {
  forgetSchemas();

  @Schema()
  class GrantMoments {
    @SchemaInit()
    schemaUsage(): SchemaNode {
      return Grant().privileges(["usage"]).on((o) => o.schema("public")).to(["authenticated"]);
    }

    @SchemaProvisioning()
    databaseConnect(): SchemaNode {
      return Grant().privileges(["connect"]).on((o) => o.database("postgres")).to(["authenticated"]);
    }
  }
  void GrantMoments;

  const init = declaredGrants("init");
  const provisioning = declaredGrants("provisioning");

  expect(init, hasLength(1));
  expect(provisioning, hasLength(1));
  expect(init[0].options.on, equals({ kind: "schema", name: "public" }));
  expect(provisioning[0].options.on, equals({ kind: "database", name: "postgres" }));
});

Scribe.test("withGrantOption is reflected on the declared grant", () => {
  const declared = grantOf(
    Grant().privileges(["usage"]).on((o) => o.schema("public")).withGrantOption().to(["authenticated"]),
  );

  expect(declared.options.withGrantOption, equals(true));
});

Scribe.test("GrantObjectFactory carries no table method, since a table grant belongs on Table's own .grants", () => {
  const declared = grantOf(
    Grant().privileges(["execute"]).on((o) => o.function("recompute_score")).to(["authenticated"]),
  );

  expect(declared.options.on, equals({ kind: "function", name: "recompute_score" }));
});
