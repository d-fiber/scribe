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

import type { UnmodifiableList } from "../../../../primitives/value/list.ts";
import type { Loose } from "../../../common/value.ts";
import type { DbMoment } from "../moment.ts";
import { SchemaEntry } from "../moment.ts";

/**
 * A privilege `grant` takes, spelled the way it takes it.
 *
 * @remarks
 * Not every kind of object accepts every privilege here — `execute` only ever makes sense on a
 * function, `usage` on a sequence or a domain — and nothing in this closed union enforces that
 * pairing: Postgres itself refuses a privilege its object does not carry, the same division
 * `ColumnType` already leaves to Postgres for a nonsensical nesting.
 */
export type Privilege =
  | "select"
  | "insert"
  | "update"
  | "delete"
  | "truncate"
  | "references"
  | "trigger"
  | "maintain"
  | "usage"
  | "execute"
  | "create"
  | "connect"
  | "temporary";

/**
 * The kind of object a grant names, once declared.
 *
 * @remarks
 * `Grant` itself refuses `table` — see its own remarks — but a grant `Table`'s own
 * `options.grants` produced still carries it, filled in from the class the grant sits on, so a
 * reader of {@link declaredGrants} sees it here regardless of which path declared the grant.
 */
export type GrantObjectKind =
  | "table"
  | "sequence"
  | "schema"
  | "function"
  | "database"
  | "domain"
  | "type";

/** The object a grant applies to. */
export interface GrantObject {
  /** What kind of object {@link name} is. */
  readonly kind: GrantObjectKind;

  /** The object's own name. */
  readonly name: string;
}

/**
 * A role a grant names, spelled the way `grant` takes it — kept for autocompletion, not as a hard
 * boundary; see `SocleNetwork` in `service.ts` for why. A cluster's own role names are not a
 * vocabulary this package owns.
 */
export type GrantRole = Loose<
  "public" | "current_role" | "current_user" | "session_user"
>;

/** What `Grant` takes: what it grants, on what, and to whom. */
export interface GrantOptions {
  /** The privileges granted, or `"all"` for every privilege {@link on}'s kind of object carries. */
  readonly privileges: UnmodifiableList<Privilege> | "all";

  /** The object the privileges apply to. */
  readonly on: GrantObject;

  /** The roles granted the privileges. */
  readonly to: UnmodifiableList<GrantRole>;

  /** Whether a grantee may re-grant the same privileges to somebody else in turn. */
  readonly withGrantOption?: boolean;
}

/** A grant exactly as `Grant` declared it. */
export interface DeclaredGrant {
  /** What it grants, on what, and to whom. */
  readonly options: GrantOptions;
}

/** A grant, and the moment it belongs to — not part of {@link DeclaredGrant} itself, since which moment a grant belongs to is where it is filed, not a fact carried on the grant. */
interface StoredGrant {
  /** The moment this grant belongs to. */
  readonly moment: DbMoment;

  /** What it grants, on what, and to whom. */
  readonly grant: DeclaredGrant;
}

/** Every grant this package has declared, in the order it declared them, alongside the moment it was declared for. */
const declared: StoredGrant[] = [];

/** The object a standalone `Grant` may name — every {@link GrantObjectKind} but `table`, which belongs on `Table`'s own `.grants` instead. */
export type GrantTargetKind = Exclude<GrantObjectKind, "table">;

/**
 * Opens the object a standalone `Grant` applies its privileges to, passed to `Grant`'s own `.on`
 * callback.
 *
 * @remarks
 * `table` has no method here: a grant on a table is always tied to one table, and belongs on
 * `Table`'s own `.grants` instead, where the builder it sits on fills in the object rather than
 * asking for one.
 */
export class GrantObjectFactory {
  /** Names the schema `name`. */
  schema(name: string): GrantObject {
    return { kind: "schema", name };
  }

  /** Names the sequence `name`. */
  sequence(name: string): GrantObject {
    return { kind: "sequence", name };
  }

  /** Names the function `name`. */
  function(name: string): GrantObject {
    return { kind: "function", name };
  }

  /** Names the whole database `name`. */
  database(name: string): GrantObject {
    return { kind: "database", name };
  }

  /** Names the domain `name`. */
  domain(name: string): GrantObject {
    return { kind: "domain", name };
  }

  /** Names the type `name`. */
  type(name: string): GrantObject {
    return { kind: "type", name };
  }
}

/**
 * What every stage of a Postgres privilege grant accumulates while it is under construction,
 * shared by reference across {@link GrantBuilder}, {@link GrantWithPrivileges},
 * {@link GrantWithOn} and {@link GrantDeclaration} rather than copied at each transition.
 *
 * @remarks
 * Nothing outside this file ever sees this shape: each of the four classes wraps it instead of
 * extending a common base, because a method transitioning between them — `on()` on
 * `GrantWithPrivileges` chief among them — has to hand back an instance of a genuinely different
 * class, one `.to` really exists on rather than one merely typed as if it did. A cast from one
 * class to another changes what the type checker believes, never what the object in hand can
 * actually do, so the only safe way to change class here is to construct the next one for real.
 */
interface GrantAccumulator {
  privileges?: UnmodifiableList<Privilege> | "all";
  on?: GrantObject;
  withGrantOption?: boolean;
}

/**
 * A Postgres privilege grant that has named neither its privileges nor what they apply to,
 * opened by `Grant`.
 *
 * @remarks
 * Splitting "has privileges" and "has on" into four separate classes, rather than one class
 * carrying two phantom flags the way `Table`'s own `TableForeignKeyBuilder` does, is what keeps
 * `.to` entirely absent — not merely uncallable — everywhere but {@link GrantDeclaration}: `.to`
 * is the one method a package author is likely to reach for by typing a dot and reading what
 * comes back, so it is the one place in this module worth the extra classes.
 */
export class GrantBuilder {
  readonly #accumulator: GrantAccumulator;

  /** Opened by `Grant`, never directly. */
  constructor(accumulator: GrantAccumulator = {}) {
    this.#accumulator = accumulator;
  }

  /** The privileges granted, or `"all"` for every privilege the object named by `on` carries. */
  privileges(privileges: UnmodifiableList<Privilege> | "all"): GrantWithPrivileges {
    this.#accumulator.privileges = privileges;
    return new GrantWithPrivileges(this.#accumulator);
  }

  /** The object the privileges apply to. */
  on(build: (object: GrantObjectFactory) => GrantObject): GrantWithOn {
    this.#accumulator.on = build(new GrantObjectFactory());
    return new GrantWithOn(this.#accumulator);
  }

  /** Lets a grantee re-grant the same privileges to somebody else in turn. */
  withGrantOption(): this {
    this.#accumulator.withGrantOption = true;
    return this;
  }
}

/** A Postgres privilege grant that has named its privileges but not yet what they apply to. */
export class GrantWithPrivileges {
  readonly #accumulator: GrantAccumulator;

  /** Opened by {@link GrantBuilder.privileges}, never directly. */
  constructor(accumulator: GrantAccumulator) {
    this.#accumulator = accumulator;
  }

  /** The privileges granted, or `"all"` for every privilege the object named by `on` carries. */
  privileges(privileges: UnmodifiableList<Privilege> | "all"): this {
    this.#accumulator.privileges = privileges;
    return this;
  }

  /** The object the privileges apply to. */
  on(build: (object: GrantObjectFactory) => GrantObject): GrantDeclaration {
    this.#accumulator.on = build(new GrantObjectFactory());
    return new GrantDeclaration(this.#accumulator);
  }

  /** Lets a grantee re-grant the same privileges to somebody else in turn. */
  withGrantOption(): this {
    this.#accumulator.withGrantOption = true;
    return this;
  }
}

/** A Postgres privilege grant that has named what its privileges apply to, but not the privileges themselves. */
export class GrantWithOn {
  readonly #accumulator: GrantAccumulator;

  /** Opened by {@link GrantBuilder.on}, never directly. */
  constructor(accumulator: GrantAccumulator) {
    this.#accumulator = accumulator;
  }

  /** The object the privileges apply to. */
  on(build: (object: GrantObjectFactory) => GrantObject): this {
    this.#accumulator.on = build(new GrantObjectFactory());
    return this;
  }

  /** The privileges granted, or `"all"` for every privilege the object named by `on` carries. */
  privileges(privileges: UnmodifiableList<Privilege> | "all"): GrantDeclaration {
    this.#accumulator.privileges = privileges;
    return new GrantDeclaration(this.#accumulator);
  }

  /** Lets a grantee re-grant the same privileges to somebody else in turn. */
  withGrantOption(): this {
    this.#accumulator.withGrantOption = true;
    return this;
  }
}

/**
 * A Postgres privilege grant that has named both its privileges and what they apply to, closed by
 * {@link to}.
 *
 * @remarks
 * Nothing here checks that the object `on` named exists in this package, the same reason an
 * `Index`'s table is not checked either. `PUBLIC`, reachable through `to(["public"])`, grants
 * every role at once, including one created after this file ran.
 */
export class GrantDeclaration {
  readonly #accumulator: GrantAccumulator;

  /** Opened by {@link GrantWithPrivileges.on} or {@link GrantWithOn.privileges}, never directly. */
  constructor(accumulator: GrantAccumulator) {
    this.#accumulator = accumulator;
  }

  /** The privileges granted, or `"all"` for every privilege the object named by `on` carries. */
  privileges(privileges: UnmodifiableList<Privilege> | "all"): this {
    this.#accumulator.privileges = privileges;
    return this;
  }

  /** The object the privileges apply to. */
  on(build: (object: GrantObjectFactory) => GrantObject): this {
    this.#accumulator.on = build(new GrantObjectFactory());
    return this;
  }

  /** Lets a grantee re-grant the same privileges to somebody else in turn. */
  withGrantOption(): this {
    this.#accumulator.withGrantOption = true;
    return this;
  }

  /**
   * Names the roles granted these privileges, closing the chain: `Schema`'s own `.with` is what
   * finally registers this grant, for whichever moment its batch opened.
   */
  to(roles: UnmodifiableList<GrantRole>): SchemaEntry<DeclaredGrant> {
    const options: GrantOptions = {
      privileges: this.#accumulator.privileges as UnmodifiableList<Privilege> | "all",
      on: this.#accumulator.on as GrantObject,
      to: roles,
      withGrantOption: this.#accumulator.withGrantOption,
    };
    return new SchemaEntry((moment) => declareGrant(options, moment));
  }
}

/**
 * Opens a Postgres privilege grant on a schema, sequence, function, domain, type or the whole
 * database.
 *
 * @remarks
 * Unlike `Table` or `Index`, two grants never collide on a name — a grant has none to refuse a
 * duplicate under — so nothing here is `Registry`-backed: a package that grants the same privilege
 * twice merely repeats a statement Postgres already treats as idempotent.
 *
 * @example
 * ```ts ignore
 * Grant().privileges(["usage"]).on((o) => o.schema("public")).to(["authenticated"]);
 * ```
 */
export function Grant(): GrantBuilder {
  return new GrantBuilder();
}

/**
 * Pushes `options` onto the same list {@link Grant} declares into, without going through
 * {@link Grant} itself — what `Table`'s `options.grants` uses, filling in {@link GrantOptions.on}
 * from the class it sits on rather than asking for one, and `moment` with the same moment `Table`
 * itself was declared for.
 */
export function declareGrant(options: GrantOptions, moment: DbMoment): DeclaredGrant {
  const grant: DeclaredGrant = { options };
  declared.push({ moment, grant });
  return grant;
}

/** Every grant this package has declared for `moment`, in the order it declared them. */
export function declaredGrants(moment: DbMoment): UnmodifiableList<DeclaredGrant> {
  return declared.filter((entry) => entry.moment === moment).map((entry) => entry.grant);
}

/** Forgets every declared grant, which is what a test does between cases. */
export function forgetGrants(): void {
  declared.length = 0;
}
