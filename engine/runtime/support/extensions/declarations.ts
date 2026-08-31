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

import type { Future } from "@scribe/alchemy";
import { isMissingModule } from "./missing_module.ts";

/**
 * What a project declared, found by the CLI and written down before anything runs.
 *
 * @remarks
 * A project puts its declarations wherever it likes under `lib/`, under any name it likes, and
 * declares nothing. `scribe gen code` walks the tree, recognises a file by the declaration API it
 * imports, and writes `@generated/declarations.ts` naming what it found. Nothing is searched,
 * matched or decided while the process is running: by the time this is called the list is a
 * literal in a file on disk.
 *
 * The four kinds stay apart because the host loads them at four different moments. Collapsing
 * them would drag every declaration a project wrote into the earliest of the four, which is what
 * the worker runtime pays for in modules it never uses.
 */
export interface ProjectDeclarations {
  /** Loads every queue the project declared, and answers once they have all run. */
  queues(): Future<unknown[]>;

  /** Loads every cron the project declared. */
  crons(): Future<unknown[]>;

  /** Loads every account role the project declared. */
  accounts(): Future<unknown[]>;

  /** Loads every search index the project declared. */
  searchers(): Future<unknown[]>;
}

/** The kinds a project may declare, which are the four the generated file exports. */
export type DeclarationKind = keyof ProjectDeclarations;

const NOTHING: ProjectDeclarations = {
  queues: () => Promise.resolve([]),
  crons: () => Promise.resolve([]),
  accounts: () => Promise.resolve([]),
  searchers: () => Promise.resolve([]),
};

let declared: Future<ProjectDeclarations> | null = null;

/**
 * Runs the declarations of one kind, once per process.
 *
 * @remarks
 * The generated file is imported once and kept, so four calls cost one import. A process with no
 * project mounted has no such file, which is the one case that is still discovered by trying: the
 * framework has to compile and boot with nothing on the other side, and it answers the empty set
 * rather than refusing.
 *
 * A declaration file is run for its effect. Whatever it returns is dropped, because what it does
 * is register itself with the port that will read it.
 *
 * A kind the generated file does not carry is nothing to do. The CLI writes one function per kind
 * a mounted package asked for, so this only happens when a package asks for a kind it never
 * declared, and answering the empty set is closer to the truth than calling what is not there.
 */
export async function runDeclarations(kind: DeclarationKind): Future<void> {
  declared ??= import("@generated/declarations.ts")
    .then((module) => module as unknown as ProjectDeclarations)
    .catch((raised: unknown) => {
      if (isMissingModule(raised)) return NOTHING;
      console.error("[extensions] @generated/declarations.ts threw while loading:", raised);
      throw raised;
    });

  const bucket = (await declared)[kind];
  if (typeof bucket !== "function") return;

  await bucket();
}
