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

import { Registry } from "../../../../declare/registry.ts";
import type { Loose } from "../../value.ts";
import type { UnmodifiableList } from "../../../../value/list.ts";
import type { DbMoment } from "../moment.ts";
import { SchemaEntry } from "../moment.ts";

/**
 * The name of a Postgres extension, spelled the way `create extension` takes it — kept for
 * autocompletion, not as a hard boundary; see `SocleNetwork` in `service.ts` for why.
 *
 * @remarks
 * Postgres itself ships fifty of these, bundled with any standard build (its own "contrib"
 * appendix names them all), and a cluster can carry more still: `pg_cron`, `postgis` and `vector`
 * are never bundled, only ever available if the image running the cluster installed them, and a
 * managed Postgres provider narrows this further still, to whatever it allowlists — a list this
 * repository has no way to know ahead of time. This names the handful most packages reach for,
 * not the other forty-odd bundled ones — `sepgsql`, `pg_walinspect`, `tsm_system_rows` and their
 * like are cluster-administration or introspection tools, not something an application declares.
 * A name outside the ones below is not refused here: it passes through unchanged, and Postgres
 * itself refuses it if the cluster does not actually carry it.
 */
export type ExtensionName = Loose<
  | "pg_trgm"
  | "unaccent"
  | "pgcrypto"
  | "pg_cron"
  | "uuid-ossp"
  | "postgis"
  | "vector"
  | "btree_gist"
  | "citext"
  | "hstore"
>;

/** What `Extension` takes: where it installs, and which of its own versions. */
export interface ExtensionOptions {
  /** The schema this extension installs into. The extension's own control file decides when left out, and wins even when this is given. */
  readonly schema?: string;

  /** The version of the extension to install. Its default version when left out. */
  readonly version?: string;

  /** Whether to also install any extension this one depends on that is not installed yet. */
  readonly cascade?: boolean;
}

/** An extension exactly as `Extension` declared it. */
export interface DeclaredExtension {
  /** The name this extension is installed under. */
  readonly name: ExtensionName;

  /** Where it installs, and which of its own versions. */
  readonly options: ExtensionOptions;
}

/** An extension, and the moment it belongs to — not part of {@link DeclaredExtension} itself, since which moment an extension belongs to is where it is filed, not a fact carried on the extension. */
interface StoredExtension {
  /** The moment this extension belongs to. */
  readonly moment: DbMoment;

  /** The extension exactly as `Extension` declared it. */
  readonly extension: DeclaredExtension;
}

/** Every extension this package has declared, by the name it took. */
const declared = new Registry<StoredExtension>("extension");

/**
 * Opens a Postgres extension named `name`, closed by {@link ExtensionBuilder.install}.
 *
 * @remarks
 * `foundation` itself still opens `pg_cron` and `pgcrypto` by hand, in a plain `.sql` file it
 * predates this declaration: this is for a package of one's own that needs an extension `foundation`
 * does not already carry, and does not retrofit what `foundation` already does. An extension is a
 * cluster-wide object shared by every schema, so a package that needs one batches it under
 * `Schema`'s own `.provisioning`, alongside a `Role`, rather than under `.init`.
 */
export class ExtensionBuilder {
  readonly #name: ExtensionName;
  #schema?: string;
  #version?: string;
  #cascade?: boolean;

  /** Opened by `Extension`, never directly. */
  constructor(name: ExtensionName) {
    this.#name = name;
  }

  /** The schema this extension installs into. The extension's own control file decides when left out, and wins even when this is given. */
  schema(schema: string): this {
    this.#schema = schema;
    return this;
  }

  /** The version of the extension to install. Its default version when left out. */
  version(version: string): this {
    this.#version = version;
    return this;
  }

  /** Also installs any extension this one depends on that is not installed yet. */
  cascade(): this {
    this.#cascade = true;
    return this;
  }

  /**
   * Closes this extension, ready for a `Schema` batch to declare it under the moment that batch
   * opened.
   *
   * @throws {DuplicateDeclarationError} When this extension's name has already been declared,
   * raised where `declareInto` runs — see `Table.columns`'s own remarks for why that is no longer
   * where this call sits.
   */
  install(): SchemaEntry<DeclaredExtension> {
    const extension: DeclaredExtension = {
      name: this.#name,
      options: { schema: this.#schema, version: this.#version, cascade: this.#cascade },
    };
    return new SchemaEntry((moment) => declared.declare(this.#name, { moment, extension }).extension);
  }
}

/**
 * Opens a Postgres extension named `name`.
 *
 * @remarks
 * `Extension` no longer takes a moment of its own: `.install`'s own return value declares nothing
 * by itself, and only renders once handed to one of `Schema`'s own `.init`, `.migrations` or
 * `.provisioning` batches — an extension is a cluster-wide object shared by every schema, so a
 * package that needs one batches it under `.provisioning`, alongside a `Role`, rather than `.init`.
 *
 * @example
 * ```ts ignore
 * dbSchema.provisioning().with((w) => [
 *   w.extension("pg_trgm").install(),
 *   w.extension("vector").version("0.8.0").install(),
 * ]);
 * ```
 */
export function Extension(name: ExtensionName): ExtensionBuilder {
  return new ExtensionBuilder(name);
}

/** Every extension this package has declared for `moment`, in the order it declared them. */
export function declaredExtensions(moment: DbMoment): UnmodifiableList<DeclaredExtension> {
  return declared.all().filter((entry) => entry.moment === moment).map((entry) => entry.extension);
}

/** Forgets every declared extension, which is what a test does between cases. */
export function forgetExtensions(): void {
  declared.forget();
}
