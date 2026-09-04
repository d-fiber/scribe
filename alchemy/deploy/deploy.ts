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
import type { DeployValue, Loose, ValueLike } from "./value.ts";
import type { DeclaredRecipe } from "./recipe.ts";
import type { DeclaredService } from "./service.ts";
import type { DeclaredCompositeType } from "./schema/composite.ts";
import type { DeclaredSqlCronJob } from "./schema/cron_job.ts";
import type { DeclaredEnum } from "./schema/enum.ts";
import type { DeclaredSqlFunction } from "./schema/function.ts";
import type { DeclaredTable } from "./schema/table.ts";
import type { DeclaredSqlTrigger } from "./schema/trigger.ts";
import type { UnmodifiableList } from "../value/list.ts";

/**
 * A Postgres attribute a provisioned role can carry, spelled the way `create role` takes it —
 * kept for autocompletion, not as a hard boundary; see `SocleNetwork` in `service.ts` for why.
 *
 * @remarks
 * This lists the flag-style attributes, the ones that take no value of their own; `create role`
 * also accepts a few that do, `CONNECTION LIMIT n` chief among them, which do not fit this list's
 * shape and are reached through `template()` when a role genuinely needs one.
 */
export type RoleAttribute = Loose<
  | "LOGIN"
  | "NOINHERIT"
  | "CREATEROLE"
  | "CREATEDB"
  | "SUPERUSER"
  | "REPLICATION"
  | "BYPASSRLS"
>;

/** What `Role` takes: where its password comes from, and the attributes it is created with. */
export interface RoleOptions {
  /** The environment variable a deployment reads this role's password from. */
  readonly passwordEnv: string;

  /** The attributes this role is created with. `["LOGIN"]` when left out. */
  readonly attributes?: UnmodifiableList<RoleAttribute>;
}

/** A Postgres role exactly as `Role` declared it. */
export interface DeclaredRole {
  readonly kind: "role";

  /** The role's own name, the one a connection string logs in as. */
  readonly name: string;

  /** What it was declared with. */
  readonly options: RoleOptions;
}

/**
 * Declares a Postgres role named `name`, described by `options`, without reaching anything.
 *
 * @remarks
 * A role belongs under `db.provisioning`: it is created once, before a package's own SQL runs,
 * the same moment `deploy/db/provisioning/` already ran at by hand. The render is what ties a
 * role's name and its `passwordEnv` to the rest of the stack — the `provision` service's own
 * environment, and the connection string a package's `Service` reads it back from — so the two
 * never have to be repeated a second time the way `roles.sql` and `docker-compose.yaml` repeated
 * them by hand today.
 *
 * @example
 * ```ts ignore
 * Role("supabase_storage_admin", { passwordEnv: "STORAGE_ADMIN_PASSWORD", attributes: ["LOGIN", "NOINHERIT", "CREATEROLE"] });
 * ```
 */
export function Role(name: string, options: RoleOptions): DeclaredRole {
  return { kind: "role", name, options };
}

/** A SQL statement carried verbatim, for what none of the typed schema entries cover. */
export interface RawSql {
  readonly kind: "raw";

  /** The statement, exactly as Postgres will run it. */
  readonly sql: string;
}

/**
 * Carries `sql` verbatim into whichever `db` moment it is listed under.
 *
 * @remarks
 * Nothing here validates it, the same choice `schema/`'s own `SqlFunction.body` and
 * `Column.defaultValue` make for raw Postgres text no closed vocabulary covers.
 */
export function Sql(sql: string): RawSql {
  return { kind: "raw", sql };
}

/**
 * Every SQL schema entry a `db` moment can carry, grouped by kind rather than mixed in one list.
 *
 * @remarks
 * A `DeclaredTable` and a `DeclaredCompositeType` carry the same two fields, `name` and `columns`,
 * with nothing in the JSON that tells them apart — the same is true across the six schema kinds
 * `schema/` already declares. Grouping by field, `tables`, `enums`, `functions`, keeps every entry
 * self-describing without inventing a tag none of those types carry today. `Table` and
 * `CompositeType` are decorators applied above the `Deploy` declaration in the same file;
 * `declaredTables()` and `declaredCompositeTypes()` are what hands their result to `tables` and
 * `compositeTypes` here, since a class decorator has nothing else to return to a caller.
 */
export interface DeploySchema {
  /** The tables this moment creates. Declared with `@Table`, collected through `declaredTables()`. */
  readonly tables?: UnmodifiableList<DeclaredTable>;

  /** The enums this moment creates. */
  readonly enums?: UnmodifiableList<DeclaredEnum>;

  /** The composite types this moment creates. Declared with `@CompositeType`, collected through `declaredCompositeTypes()`. */
  readonly compositeTypes?: UnmodifiableList<DeclaredCompositeType>;

  /** The functions this moment creates. */
  readonly functions?: UnmodifiableList<DeclaredSqlFunction>;

  /** The triggers this moment creates. */
  readonly triggers?: UnmodifiableList<DeclaredSqlTrigger>;

  /** The scheduled jobs this moment creates. */
  readonly cronJobs?: UnmodifiableList<DeclaredSqlCronJob>;

  /** The roles this moment creates. In practice only ever listed under `provisioning`. */
  readonly roles?: UnmodifiableList<DeclaredRole>;

  /** Raw statements this moment runs, for what nothing else here covers. */
  readonly raw?: UnmodifiableList<RawSql>;
}

/** What `db` takes: one `DeploySchema` per moment Postgres plays a package's SQL at. */
export interface DeployDb {
  /** Played once, at the container's own construction. Empty when left out. */
  readonly init?: DeploySchema;

  /** Replayed at every start after the first. Empty when left out. */
  readonly migrations?: DeploySchema;

  /** Played once, before `init`, and before the package's own schema exists. Empty when left out. */
  readonly provisioning?: DeploySchema;
}

/**
 * A setting a project may tune, and what it defaults to when the project never touches it.
 *
 * @remarks
 * A union rather than one interface with a loose `default: number | boolean | string`: tying
 * `type` to `default` this way is what refuses `{ type: "integer", default: "5" }` at the call
 * site, instead of at whatever eventually tries to read the mismatch back.
 */
export type SettingOptions = IntegerSetting | BooleanSetting | StringSetting;

/** A setting whose value is a whole number. */
export interface IntegerSetting {
  /** What this setting controls, in one sentence a project reads while filling `configuration.yaml` in. */
  readonly doc: string;

  readonly type: "integer";

  /** What this setting takes when a project leaves it untouched. */
  readonly default: number;
}

/** A setting whose value is on or off. */
export interface BooleanSetting {
  /** What this setting controls, in one sentence a project reads while filling `configuration.yaml` in. */
  readonly doc: string;

  readonly type: "boolean";

  /** What this setting takes when a project leaves it untouched. */
  readonly default: boolean;
}

/** A setting whose value is text. */
export interface StringSetting {
  /** What this setting controls, in one sentence a project reads while filling `configuration.yaml` in. */
  readonly doc: string;

  readonly type: "string";

  /** What this setting takes when a project leaves it untouched. */
  readonly default: string;
}

/** A resource this package needs a project to place, by the type a recipe answers for. */
export interface RequiredResource {
  /** The name this package reaches the resource by, once placed. */
  readonly name: string;

  /** The resource type a recipe must answer, `bucket`, `postgres`. */
  readonly type: string;
}

/** What `configuration` takes: the settings a project tunes, what it requires, and its own environment. */
export interface ConfigurationOptions {
  /** The settings a project may tune, by the key `setting()` reads back. Empty when left out. */
  readonly settings?: Readonly<Record<string, SettingOptions>>;

  /** The resources this package needs placed before it can run. Empty when left out. */
  readonly requires?: UnmodifiableList<RequiredResource>;

  /** This package's own slice of the stack's environment, by variable name. Empty when left out. */
  readonly env?: Readonly<Record<string, ValueLike>>;
}

/** `ConfigurationOptions`, with `env` resolved to a `DeployValue` each. */
export interface ResolvedConfigurationOptions extends Omit<ConfigurationOptions, "env"> {
  /** {@link ConfigurationOptions.env}, every value resolved. Empty when none was declared. */
  readonly env: Readonly<Record<string, DeployValue>>;
}

/** What `Deploy` takes: everything a package hands the stack, in one place. */
export interface DeployOptions {
  /** The SQL this package hands the database, by the moment it plays at. Empty when left out. */
  readonly db?: DeployDb;

  /** The containers this package starts. None when left out. */
  readonly services?: UnmodifiableList<DeclaredService>;

  /** The resource types this package answers for. None when left out. */
  readonly recipes?: UnmodifiableList<DeclaredRecipe>;

  /** What a project may tune and must place before this package can run. Nothing to tune when left out. */
  readonly configuration?: ConfigurationOptions;
}

/** A class, decorated by `@Deploy`, `new`-constructible with any arguments — all the decorator asks of its target. */
type Constructible = new (...args: readonly unknown[]) => unknown;

/** A package's whole `deploy/`, exactly as `Deploy` declared it. */
export interface DeclaredDeploy {
  /** What it was declared with, `configuration.env` resolved. */
  readonly options: Omit<DeployOptions, "configuration"> & {
    readonly configuration: ResolvedConfigurationOptions;
  };
}

/** The one `Deploy` declaration this package carries, keyed under a fixed name since a package has only one. */
const declared = new Registry<DeclaredDeploy>("deploy");

/**
 * Declares the class it decorates the whole of a package's `deploy/`, described by `options`.
 *
 * @remarks
 * This is the only declaration `deploy/deploy.ts` needs at its own top level: everything else —
 * a `Service`, a `Recipe`, a `Role`, a `@Table` — is built above it in the same file and handed to
 * `options` explicitly, so nothing under `deploy/` comes from a name `scribe forge` had to go
 * looking for. `scribe forge` renders `deploy/services/`, `deploy/recipes/`, `deploy/db/`,
 * `deploy/configuration.yaml`, `deploy/packages.env` and `deploy/overlay.yaml` from exactly what
 * this call carries, whole, every time — the same choice `schema/` already makes for
 * `db/init/00_schema.sql`.
 *
 * @throws {DuplicateDeclarationError} When a package's `deploy/deploy.ts` calls this a second
 * time, raised where the second call is written — a package hands the stack one `deploy/`, never
 * two.
 *
 * @example
 * ```ts ignore
 * @Deploy({
 *   db: { provisioning: { roles: [Role("supabase_storage_admin", { passwordEnv: "STORAGE_ADMIN_PASSWORD" })] } },
 *   services: [Service("storage", { ... }), Service("imgproxy", { ... })],
 *   recipes: [Recipe("bucket", { ... })],
 *   configuration: { settings: { ... }, requires: [{ name: "objects", type: "bucket" }] },
 * })
 * class StorageDeploy {}
 * ```
 */
export function Deploy(options: DeployOptions) {
  return function (
    _target: Constructible,
    _context: ClassDecoratorContext,
  ): void {
    const configuration = resolveConfiguration(options.configuration);
    const resolved: DeployOptions & {
      readonly configuration: ResolvedConfigurationOptions;
    } = {
      ...options,
      configuration,
    };
    refuseUnknownSettings(resolved);
    declared.declare("deploy", { options: resolved });
  };
}

/**
 * Throws when a `setting()` reached anywhere in `options` names a key `options.configuration`
 * never declared, naming the key and where a known one has to be added.
 *
 * @remarks
 * `setting()` is built before `Deploy` has read `configuration.settings`, the same reason a
 * `@Column`'s foreign key is not checked at the field either: it is only here, once the whole
 * declaration is in hand, that a stray key can be told apart from one that simply has not been
 * declared yet a few lines further down.
 */
function refuseUnknownSettings(
  options: DeployOptions & {
    readonly configuration: ResolvedConfigurationOptions;
  },
): void {
  const known = new Set(Object.keys(options.configuration.settings ?? {}));

  for (const key of settingKeysReachedBy(options)) {
    if (!known.has(key)) {
      throw new Error(
        `setting("${key}") is read somewhere in this deploy.ts, and "configuration.settings" declares no ` +
          `"${key}". Add it there, or read the key that was meant.`,
      );
    }
  }
}

/** Every key a `setting()` call reaches, anywhere under `options.services` or `options.configuration.env`. */
function settingKeysReachedBy(
  options: DeployOptions & {
    readonly configuration: ResolvedConfigurationOptions;
  },
): string[] {
  const keys: string[] = [];
  const collect = (value: DeployValue) => {
    if (value.kind === "setting") keys.push(value.key);
  };

  for (const service of options.services ?? []) {
    Object.values(service.options.environment).forEach(collect);
    Object.values(service.options.tuning).forEach(collect);
  }
  Object.values(options.configuration.env).forEach(collect);

  return keys;
}

/** The `Deploy` declaration this package's `deploy/deploy.ts` carries, or null when it declared none yet. */
export function declaredDeploy(): DeclaredDeploy | null {
  return declared.named("deploy");
}

/** Forgets the declared `Deploy`, which is what a test does between cases. */
export function forgetDeploy(): void {
  declared.forget();
}

/** `options`, or an empty configuration when left out, with `env` resolved to a `DeployValue` each. */
function resolveConfiguration(
  options: ConfigurationOptions | undefined,
): ResolvedConfigurationOptions {
  const env: Record<string, DeployValue> = {};
  for (const [key, value] of Object.entries(options?.env ?? {})) {
    env[key] = resolveValue(value);
  }
  return { ...options, env };
}
