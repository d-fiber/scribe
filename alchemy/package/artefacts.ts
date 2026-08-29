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

import type { UnmodifiableList } from "../value/list.ts";

/**
 * The key, at the root of a manifest, holding what the package hands the stack.
 *
 * @remarks
 * It sits under a name of its own rather than at the root because what it holds is read by the
 * framework and by nothing else, the way `flutter:` is in a pubspec. A package that hands the stack
 * nothing leaves the block out.
 */
export const ARTEFACTS_KEY = "scribe";

/** The keys the artefacts block may carry, and there is no fourth. */
export const ARTEFACTS_KEYS: UnmodifiableList<string> = ["db", "protocol", "services"];

/** The keys the `db:` block may carry, one per moment Postgres plays SQL at. */
export const DATABASE_KEYS: UnmodifiableList<string> = ["init", "migrations", "provisioning"];

/**
 * The names a service fragment goes by, and the whole of them.
 *
 * @remarks
 * A fragment's name is what pairs it with the file of the base it completes, and there is no table
 * relating the two. The list belongs to the framework, so a package never repeats it and never
 * invents one: a file under another name is reached through a path written inside a fragment, and
 * nothing looks it up.
 */
export const SERVICE_FRAGMENTS: UnmodifiableList<string> = [
  "capacity.yaml",
  "docker-compose.yaml",
  "kong.yml",
  "overlay.yaml",
  "replicas.yaml",
  "resources.yaml",
  "tuning.yaml",
];

/**
 * The SQL a package poses, one directory per moment it is played at.
 *
 * @remarks
 * Each directory is harvested whole, subdirectories included, and the files are played in the order
 * their paths sort in. That is what a numeric prefix on a directory is for, and why nothing here
 * declares an order of its own.
 */
export interface DatabaseArtefacts {
  /** The SQL played once, when the database container is built, or null when none is. */
  readonly init: string | null;

  /** The SQL played at every start, one pass per file the migrator has not seen, or null. */
  readonly migrations: string | null;

  /** The SQL played before anything else, the roles, extensions and schemas, or null. */
  readonly provisioning: string | null;
}

/**
 * What a package hands the stack besides the code the host imports.
 *
 * @remarks
 * Nothing here is derived from the tree. The keys are the framework's and the list is closed; the
 * paths are the package's, which names its directories what it likes and puts them where it likes
 * inside itself. A directory the manifest does not name is a directory nothing plays, mounts or
 * compiles, which is what makes leaving the block out the way to hand over nothing.
 */
export interface Artefacts {
  /** The SQL this package poses, or null when it poses none. */
  readonly db: DatabaseArtefacts | null;

  /**
   * The directory holding the `.proto` files, or null when it speaks to no worker.
   *
   * @remarks
   * Its path decides the path of the generated stubs, since `protoc` is handed the root of the
   * repository and resolves everything against it.
   */
  readonly protocol: string | null;

  /**
   * The service directories this package contributes, one per service, in the order written.
   *
   * @remarks
   * An entry is a directory under `deploy/services/`, and what it hands over is the fragments it
   * holds, whose names are in {@link SERVICE_FRAGMENTS}. Everything else a service needs, a
   * Dockerfile or a script, is reached through a path written inside a fragment, so nothing looks
   * it up by name and nothing has to declare it.
   */
  readonly services: UnmodifiableList<string>;
}

/** What a manifest with no artefacts block declares, which is nothing. */
export const NO_ARTEFACTS: Artefacts = Object.freeze({
  db: null,
  protocol: null,
  services: Object.freeze([]) as UnmodifiableList<string>,
});

/** Whether `artefacts` names nothing at all. */
export function handsOverNothing(artefacts: Artefacts): boolean {
  return artefacts.db === null && artefacts.protocol === null && artefacts.services.length === 0;
}

/**
 * What is wrong with `path` as a manifest writes it, or null when nothing is.
 *
 * @remarks
 * A package names what it carries, relative to itself, so that it says the same thing wherever it
 * is checked out. An absolute path names one machine, and a path that climbs above the package
 * hands over something it does not own.
 */
export function artefactPathProblem(path: string): string | null {
  if (path.trim() === "") return `a path written empty names nothing. Leave the key out instead.`;
  if (path.startsWith("/")) {
    return (
      `"${path}" is an absolute path. A package names what it carries, relative to itself, so that ` +
      `it says the same thing wherever it is checked out.`
    );
  }

  const normalised = normaliseArtefactPath(path);
  if (normalised === ".." || normalised.startsWith("../")) {
    return (
      `"${path}" climbs out of the package. What a package hands over is what it carries, and ` +
      `reaching next door would hand over something it does not own.`
    );
  }

  return null;
}

/**
 * `path` with the noise a person writes taken out, so two spellings of one place compare equal.
 *
 * @remarks
 * Manifest paths are posix whatever the machine reads them on, since they are written once and read
 * everywhere. `./deploy/services/queue/` and `deploy/services/queue` are the same entry, and a
 * manifest that names both is naming one service twice.
 */
export function normaliseArtefactPath(path: string): string {
  const kept: string[] = [];
  for (const segment of path.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === ".." && kept.length > 0 && kept[kept.length - 1] !== "..") {
      kept.pop();
      continue;
    }
    kept.push(segment);
  }

  return kept.length === 0 ? "." : kept.join("/");
}
