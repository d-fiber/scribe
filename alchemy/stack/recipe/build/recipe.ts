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

import { Registry } from "../../../wiring/declare/registry.ts";
import type { UnmodifiableList } from "../../../primitives/value/list.ts";
import type { DeployValue, ValueLike } from "../../common/value.ts";
import { resolveValue } from "../../common/value.ts";

/**
 * A minimal OpenTofu document, typed at the level `tofu` itself is structured at and no deeper.
 *
 * @remarks
 * `resource`, `provider` and the rest are typed only as objects: what a `resource.aws_s3_bucket`
 * block holds is decided by the `aws` provider's own schema, and closing that here would mean
 * redeclaring every provider's resource catalogue. This closes the one thing that is universal to
 * every `.tf.json` — its six possible top-level blocks — the same boundary `schema/`'s own
 * `Column.defaultValue` draws around a raw Postgres expression.
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
  /** Discriminates this {@link RecipeClass} as one that answers immediately. */
  readonly kind: "outputs";

  /** The contract's keys, each answered with a value. */
  readonly outputs: Readonly<Record<string, DeployValue>>;

  /**
   * The stack's own services this class reuses instead of provisioning anything, by the name
   * `Service` declared them under elsewhere in the package. Empty when this class stands on its
   * own.
   *
   * @remarks
   * Read by `scribe_tools`'s own placement, off whichever class a project's `Recipe` keys
   * `"container"` — nothing here checks that key, the same choice a column's foreign key leaves
   * to whatever renders the SQL. A resource placed under any other class drops these services
   * from the stack's compose file and its own capacity budget, since nothing left in the stack
   * would ever reach them.
   */
  readonly brings: UnmodifiableList<string>;

  /**
   * The capabilities this class already carries, by a name a project's own `requires:` entry can
   * ask for — `pg_cron`, `create_role`, whatever a resource type's classes happen to differ on.
   *
   * @remarks
   * Not a vocabulary this file owns: a capability's name means whatever the package requiring it
   * decides it means, the same openness `RoleAttribute` and `ExtensionName` already keep for a
   * vocabulary this repository does not fully control. Checked at placement, before anything is
   * provisioned — a class silently missing a capability a project asked for would otherwise
   * surface only once a managed instance is already running and billed.
   */
  readonly capabilities: UnmodifiableList<string>;
}

/** A recipe class that provisions its answer through OpenTofu. */
export interface TerraformClass {
  /** Discriminates this {@link RecipeClass} as one provisioned through OpenTofu. */
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

  /** The capabilities this class already carries once provisioned. See {@link OutputsClass.capabilities}. */
  readonly capabilities: UnmodifiableList<string>;
}

/** One way a project can satisfy a resource type — every class `RecipeClassFactory` opens ends up as one of these. */
export type RecipeClass = OutputsClass | TerraformClass;

/**
 * An `outputs` class under construction, opened by {@link RecipeClassFactory.outputs}.
 *
 * @remarks
 * `.brings` and `.capabilities` are the only two modifiers, both optional, and both free to skip:
 * most classes answer a contract and nothing else, `external.yaml` today being the ordinary case.
 */
export class OutputsClassBuilder {
  readonly #outputs: Readonly<Record<string, DeployValue>>;
  #brings: UnmodifiableList<string> = [];
  #capabilities: UnmodifiableList<string> = [];

  /** Opened by {@link RecipeClassFactory.outputs}, never directly. */
  constructor(outputs: Readonly<Record<string, ValueLike>>) {
    const resolved: Record<string, DeployValue> = {};
    for (const [key, value] of Object.entries(outputs)) {
      resolved[key] = resolveValue(value);
    }
    this.#outputs = resolved;
  }

  /** The stack's own services this class reuses instead of provisioning anything. See {@link OutputsClass.brings}. */
  brings(services: UnmodifiableList<string>): this {
    this.#brings = services;
    return this;
  }

  /** The capabilities this class already carries. See {@link OutputsClass.capabilities}. */
  capabilities(names: UnmodifiableList<string>): this {
    this.#capabilities = names;
    return this;
  }

  /** This class, exactly as `Recipe` reads it once its own `.classes` callback returns. */
  build(): OutputsClass {
    return {
      kind: "outputs",
      outputs: this.#outputs,
      brings: this.#brings,
      capabilities: this.#capabilities,
    };
  }
}

/**
 * A `terraform` class under construction, opened by {@link RecipeClassFactory.terraform}.
 *
 * @remarks
 * `.capabilities` is the only modifier: unlike {@link OutputsClassBuilder}, a provisioned class
 * never reuses a stack service in place of provisioning, so it carries no `.brings`.
 */
export class TerraformClassBuilder {
  readonly #document: TerraformDocument;
  readonly #params: Readonly<Record<string, unknown>>;
  #capabilities: UnmodifiableList<string> = [];

  /** Opened by {@link RecipeClassFactory.terraform}, never directly. */
  constructor(
    document: TerraformDocument,
    params: Readonly<Record<string, unknown>>,
  ) {
    this.#document = document;
    this.#params = params;
  }

  /** The capabilities this class already carries once provisioned. See {@link OutputsClass.capabilities}. */
  capabilities(names: UnmodifiableList<string>): this {
    this.#capabilities = names;
    return this;
  }

  /** This class, exactly as `Recipe` reads it once its own `.classes` callback returns. */
  build(): TerraformClass {
    return {
      kind: "terraform",
      document: this.#document,
      params: this.#params,
      capabilities: this.#capabilities,
    };
  }
}

/**
 * Opens one class of a recipe, passed to `Recipe`'s own `.classes` callback.
 *
 * @remarks
 * The same shape `ColumnFactory` gives `Table`'s own `.columns`: a method per way of answering a
 * resource's contract, each opening a small builder that `Recipe` itself resolves once the
 * callback returns, rather than the author calling `.build()` by hand.
 */
export class RecipeClassFactory {
  /** Opens a class that answers the contract with `outputs`, immediately, without provisioning anything. */
  outputs(outputs: Readonly<Record<string, ValueLike>>): OutputsClassBuilder {
    return new OutputsClassBuilder(outputs);
  }

  /** Opens a class that answers the contract by running `document` through OpenTofu, defaulted by `params`. */
  terraform(
    document: TerraformDocument,
    params: Readonly<Record<string, unknown>>,
  ): TerraformClassBuilder {
    return new TerraformClassBuilder(document, params);
  }
}

/** What `Recipe` takes: the contract every class answers, and one class per way of answering it. */
export interface RecipeOptions {
  /** The keys every class of this recipe must answer, in the order a reader sees them documented. */
  readonly contract: UnmodifiableList<string>;

  /** One class per way a project can satisfy this resource type, by the name a target names it with. */
  readonly classes: Readonly<Record<string, RecipeClass>>;
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
 * A recipe under construction, named `type` but not yet given a contract, opened by `Recipe`.
 *
 * @remarks
 * `.contract` is the only method here: a recipe's classes cannot be read before its contract is
 * known, since a class such as `Outputs` resolves against whatever `DeployValue` it is given
 * without checking it against anything — the contract is what a consumer of {@link declaredRecipes}
 * reads to know what every class of this recipe promises to answer.
 */
export class RecipeBuilder {
  readonly #type: string;

  /** Opened by `Recipe`, never directly. */
  constructor(type: string) {
    this.#type = type;
  }

  /** The keys every class of this recipe must answer, in the order a reader sees them documented. */
  contract(keys: UnmodifiableList<string>): RecipeWithContract {
    return new RecipeWithContract(this.#type, keys);
  }
}

/**
 * A recipe under construction, closed by {@link RecipeWithContract.classes}.
 *
 * @remarks
 * A resource type belongs to whichever package first answers it: `deployProblems` on the
 * `scribe_tools` side already refuses two packages naming the same `deploy/recipes/<type>/`, and
 * this is the vocabulary that fills that directory in rather than a hand-written `contract.yaml`
 * and one file per class.
 */
export class RecipeWithContract {
  readonly #type: string;
  readonly #contract: UnmodifiableList<string>;

  /** Opened by {@link RecipeBuilder.contract}, never directly. */
  constructor(type: string, contract: UnmodifiableList<string>) {
    this.#type = type;
    this.#contract = contract;
  }

  /**
   * Declares this recipe's classes, and with them the recipe itself, without reaching anything.
   *
   * @throws {DuplicateDeclarationError} When this recipe's type has already been declared, raised
   * where this is called.
   *
   * @example
   * ```ts ignore
   * Recipe("bucket").contract(["backend", "name", "endpoint", "region", "access_key", "secret_key"]).classes((c) => ({
   *   container: c.outputs({ backend: "file", name: "stub", endpoint: "", region: "", access_key: "", secret_key: "" }),
   *   external: c.outputs({ backend: "s3", name: env("S3_BUCKET"), endpoint: env("S3_ENDPOINT"), region: env("S3_REGION"), access_key: env("S3_ACCESS_KEY"), secret_key: env("S3_SECRET_KEY") }),
   * }));
   *
   * Recipe("postgres").contract(["host", "port", "database", "user", "password", "url"]).classes((c) => ({
   *   container: c.outputs({ host: "db", port: "5432", database: "postgres", user: "supabase_admin", password: env("POSTGRES_PASSWORD"), url: template("postgresql://supabase_admin:${POSTGRES_PASSWORD}@db:5432/postgres") })
   *     .brings(["db"])
   *     .capabilities(["pg_cron", "pgcrypto", "create_role"]),
   * }));
   * ```
   */
  classes(
    build: (
      c: RecipeClassFactory,
    ) => Readonly<Record<string, OutputsClassBuilder | TerraformClassBuilder>>,
  ): DeclaredRecipe {
    const classes: Record<string, RecipeClass> = {};
    for (
      const [key, builder] of Object.entries(
        build(new RecipeClassFactory()),
      )
    ) {
      classes[key] = builder.build();
    }
    return declared.declare(this.#type, {
      type: this.#type,
      options: { contract: this.#contract, classes },
    });
  }
}

/**
 * Declares a resource type named `type`, closed by {@link RecipeWithContract.classes}, without
 * reaching anything.
 *
 * @remarks
 * `Recipe` itself carries only a type: {@link RecipeBuilder}, what it renders, only carries
 * `.contract`. Giving one is what hands back {@link RecipeWithContract}, the only place
 * `.classes` — and with it `RecipeClassFactory`'s `.outputs`/`.terraform` — ever appears.
 */
export function Recipe(type: string): RecipeBuilder {
  return new RecipeBuilder(type);
}

/** Every recipe this package has declared, in the order it declared them. */
export function declaredRecipes(): UnmodifiableList<DeclaredRecipe> {
  return declared.all();
}

/** Forgets every declared recipe, which is what a test does between cases. */
export function forgetRecipes(): void {
  declared.forget();
}
