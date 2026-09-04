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
 * The directory every package carries, holding everything a running stack reads.
 *
 * @remarks
 * Its shape is fixed and closed, which is what lets nothing be declared: the SQL, the compose
 * fragments, the recipes and the configuration each sit at a place the framework knows by name, so
 * a reader finds them by walking the tree rather than by looking a path up in the manifest. A
 * package that hands the stack nothing still carries `deploy/db/init/` and `deploy/db/migrations/`,
 * empty.
 */
export const DEPLOY = "deploy";

/**
 * The moments Postgres plays a package's SQL at, one directory each under `deploy/db/`.
 *
 * @remarks
 * A directory is harvested whole, subdirectories included, and the files are played in the order
 * their paths sort in. That is what a numeric prefix on a file or a directory is for.
 */
export const DATABASE_MOMENTS: UnmodifiableList<string> = [
  "init",
  "migrations",
  "provisioning",
];

/** The moments a package cannot leave out: the container build, and every start after it. */
export const REQUIRED_DATABASE_MOMENTS: UnmodifiableList<string> = [
  "init",
  "migrations",
];

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
 * What may sit directly under `deploy/`, and nothing else may.
 *
 * @remarks
 * `db` is the only one a package cannot omit. `services/` holds one directory per service,
 * `recipes/` one per resource type, and the four files are read where they sit: `deploy.ts` is the
 * source a package's `@Deploy` declares against, `overlay.yaml` mounts `deploy/db/` into a base
 * service, `configuration.yaml` names what a project tunes and requires, `packages.env` is the
 * package's own slice of the environment.
 */
export const DEPLOY_ENTRIES: UnmodifiableList<string> = [
  "db",
  "services",
  "recipes",
  "deploy.ts",
  "overlay.yaml",
  "configuration.yaml",
  "packages.env",
];

/**
 * The export a package's entry carries when it lets a project declare something against it.
 *
 * @remarks
 * It maps a bucket, the name of the generated loader function, to the symbol a project file imports
 * from the package's door to declare one. It lives in code rather than in the manifest because the
 * value is a class the entry already has in scope, and reading it there keeps the framework and the
 * tool from ever naming a package. A package that lets a project declare nothing exports nothing.
 *
 * @example
 * ```ts ignore
 * export const declares = { queues: Queue, crons: Cron };
 * ```
 */
export const DECLARES_EXPORT = "declares";
