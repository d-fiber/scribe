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

import { Registry } from "../declare/registry.ts";
import { resolveValue } from "./value.ts";
import type { DeployValue, ValueLike } from "./value.ts";
import type { UnmodifiableList } from "../value/list.ts";

/**
 * A minimal OpenTofu document, typed at the level `tofu` itself is structured at and no deeper.
 *
 * @remarks
 * `resource`, `provider` and the rest are typed only as objects: what a `resource.aws_s3_bucket`
 * block holds is decided by the `aws` provider's own schema, and closing that here would mean
 * redeclaring every provider's resource catalogue. This closes the one thing that is universal to
 * every `.tf.json` — its six possible top-level blocks — the same boundary `schema/`'s
 * `SqlFunction.body` draws around a function's raw Postgres.
 */
export interface TerraformDocument {
  /** The `terraform` block: required providers and their versions. */
  readonly terraform?: Readonly<Record<string, unknown>>;

  /** The `provider` block: how each provider this document uses is configured. */
  readonly provider?: Readonly<Record<string, unknown>>;

  /** The `resource` block: what this document creates. */
  readonly resource?: Readonly<Record<string, unknown>>;

  /** The `data` block: what this document reads without creating. */
  readonly data?: Readonly<Record<string, unknown>>;

  /** The `output` block: what `deploy` reads back once `apply` has run. */
  readonly output?: Readonly<Record<string, unknown>>;

  /** The `variable` block. Left empty in practice: nothing feeds a recipe's variables today, see {@link Terraform}. */
  readonly variable?: Readonly<Record<string, unknown>>;
}

/** A recipe class that answers a resource's contract immediately, creating nothing. */
export interface OutputsClass {
  readonly kind: "outputs";

  /** The contract's keys, each answered with a value. */
  readonly outputs: Readonly<Record<string, DeployValue>>;
}

/** A recipe class that provisions its answer through OpenTofu. */
export interface TerraformClass {
  readonly kind: "terraform";

  /** The document `tofu apply` runs, whose `output` block answers the resource's contract. */
  readonly document: TerraformDocument;

  /**
   * The values this document's placeholders take, alongside `{{name}}`, which a deployment fills
   * in for free, and beyond what a project's own `params:` supplies.
   *
   * @remarks
   * This is what `<recipe>.params.json` holds today: a class's own defaults for the placeholders
   * it declares, read as the value a fournisseur accepts when nothing overrides it, and read by
   * `tool/recipes.sh` to prove the class parses under the real provider before anyone deploys it.
   */
  readonly params: Readonly<Record<string, unknown>>;
}

/** Answers a resource's contract with `outputs`, immediately, without provisioning anything. */
export function Outputs(
  outputs: Readonly<Record<string, ValueLike>>,
): OutputsClass {
  const resolved: Record<string, DeployValue> = {};
  for (const [key, value] of Object.entries(outputs)) {
    resolved[key] = resolveValue(value);
  }
  return { kind: "outputs", outputs: resolved };
}

/** Answers a resource's contract by running `document` through OpenTofu, defaulted by `params`. */
export function Terraform(
  document: TerraformDocument,
  params: Readonly<Record<string, unknown>>,
): TerraformClass {
  return { kind: "terraform", document, params };
}

/** What `Recipe` takes: the contract every class answers, and one class per way of answering it. */
export interface RecipeOptions {
  /** The keys every class of this recipe must answer, in the order a reader sees them documented. */
  readonly contract: UnmodifiableList<string>;

  /** One class per way a project can satisfy this resource type, by the name a target names it with. */
  readonly classes: Readonly<Record<string, OutputsClass | TerraformClass>>;
}

/** A recipe exactly as `Recipe` declared it. */
export interface DeclaredRecipe {
  /** The resource type this recipe answers for, `bucket`, `postgres` — the kind a `requires:` entry names. */
  readonly type: string;

  /** The contract and the classes it was declared with. */
  readonly options: RecipeOptions;
}

/** Every recipe this package has declared, by the type it took. */
const declared = new Registry<DeclaredRecipe>("recipe");

/**
 * Declares a resource type named `type`, described by `options`, without reaching anything.
 *
 * @remarks
 * A resource type belongs to whichever package first answers it: `deployProblems` on the
 * `scribe_tools` side already refuses two packages naming the same `deploy/recipes/<type>/`, and
 * this is the vocabulary that fills that directory in rather than a hand-written
 * `contract.yaml` and one file per class.
 *
 * @throws {DuplicateDeclarationError} When `type` has already been declared, raised where the
 * second declaration is written.
 *
 * @example
 * ```ts ignore
 * Recipe("bucket", {
 *   contract: ["backend", "name", "endpoint", "region", "access_key", "secret_key"],
 *   classes: {
 *     container: Outputs({ backend: "file", name: "stub", endpoint: "", region: "", access_key: "", secret_key: "" }),
 *     external: Outputs({
 *       backend: "s3",
 *       name: env("S3_BUCKET"),
 *       endpoint: env("S3_ENDPOINT"),
 *       region: env("S3_REGION"),
 *       access_key: env("S3_ACCESS_KEY"),
 *       secret_key: env("S3_SECRET_KEY"),
 *     }),
 *   },
 * });
 * ```
 */
export function Recipe(type: string, options: RecipeOptions): DeclaredRecipe {
  return declared.declare(type, { type, options });
}

/** Every recipe this package has declared, in the order it declared them. */
export function declaredRecipes(): UnmodifiableList<DeclaredRecipe> {
  return declared.all();
}

/** Forgets every declared recipe, which is what a test does between cases. */
export function forgetRecipes(): void {
  declared.forget();
}
