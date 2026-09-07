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
import { equals, expect, isA, Scribe, throwsA } from "@scribe/alchemy/test";
import { declaredRecipes, DuplicateDeclarationError, env, forgetRecipes, Recipe } from "@scribe/alchemy";

Scribe.test("an outputs class resolves its values, and defaults brings and capabilities to empty", () => {
  forgetRecipes();

  const declared = Recipe("recipe_outputs_default").contract(["endpoint"]).classes((c) => ({
    stub: c.outputs({ endpoint: "http://localhost" }),
  }));

  expect(
    declared.options.classes.stub,
    equals({
      kind: "outputs",
      outputs: { endpoint: { kind: "literal", value: "http://localhost" } },
      brings: [],
      capabilities: [],
    }),
  );
});

Scribe.test("an outputs class carries brings and capabilities once set, and resolves a typed value", () => {
  forgetRecipes();

  const declared = Recipe("recipe_outputs_full").contract(["endpoint"]).classes((c) => ({
    external: c.outputs({ endpoint: env("S3_ENDPOINT") }).brings(["db"]).capabilities(["pg_cron"]),
  }));

  expect(
    declared.options.classes.external,
    equals({
      kind: "outputs",
      outputs: { endpoint: { kind: "env", name: "S3_ENDPOINT" } },
      brings: ["db"],
      capabilities: ["pg_cron"],
    }),
  );
});

Scribe.test("a terraform class carries its document, its params and its capabilities, brings absent", () => {
  forgetRecipes();

  const document = { resource: { aws_s3_bucket: { main: {} } } };
  const declared = Recipe("recipe_terraform").contract(["bucket"]).classes((c) => ({
    real: c.terraform(document, { region: "us-east-1" }).capabilities(["create_role"]),
  }));

  expect(
    declared.options.classes.real,
    equals({
      kind: "terraform",
      document,
      params: { region: "us-east-1" },
      capabilities: ["create_role"],
    }),
  );
  expect(
    "brings" in declared.options.classes.real,
    equals(false),
    "a terraform class carried a brings it never declared",
  );
});

Scribe.test("the contract is carried through exactly as declared", () => {
  forgetRecipes();

  const declared = Recipe("recipe_contract").contract(["host", "port", "database"]).classes((c) => ({
    stub: c.outputs({ host: "db", port: "5432", database: "postgres" }),
  }));

  expect(declared.options.contract, equals(["host", "port", "database"]));
});

Scribe.test("a resource type declared twice is refused", () => {
  forgetRecipes();

  Recipe("recipe_duplicate").contract(["a"]).classes((c) => ({ stub: c.outputs({ a: "x" }) }));

  expect(
    () => Recipe("recipe_duplicate").contract(["a"]).classes((c) => ({ stub: c.outputs({ a: "y" }) })),
    throwsA(isA(DuplicateDeclarationError)),
  );
});

Scribe.test("declaredRecipes lists every declared recipe, in declaration order", () => {
  forgetRecipes();

  Recipe("recipe_order_a").contract(["a"]).classes((c) => ({ stub: c.outputs({ a: "x" }) }));
  Recipe("recipe_order_b").contract(["a"]).classes((c) => ({ stub: c.outputs({ a: "x" }) }));

  expect(declaredRecipes().map((recipe) => recipe.type), equals(["recipe_order_a", "recipe_order_b"]));
});

Scribe.test("forgetRecipes empties the registry, so a type it held may be declared again", () => {
  forgetRecipes();
  Recipe("recipe_forget").contract(["a"]).classes((c) => ({ stub: c.outputs({ a: "x" }) }));
  forgetRecipes();

  const redeclared = Recipe("recipe_forget").contract(["a"]).classes((c) => ({ stub: c.outputs({ a: "x" }) }));
  expect(redeclared.type, equals("recipe_forget"), "the type freed by forgetting was still refused");
});
