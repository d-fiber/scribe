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

import { Table } from "../../database/table.ts";

/** One row of the table that tracks which `@Init` job has already run. */
export interface InitRow {
  /** The name the job was declared under — an `@Init` method's own class name. */
  name: string;

  /** When the job was recorded as having run. */
  ran_at: string;
}

/**
 * The table this package ships, as the query builder needs to see it.
 *
 * It is declared here rather than taken from a generated schema because the package owns the
 * SQL that creates it — the same reason `storage`'s own `StorageSchema` is declared next to its
 * table rather than derived from a project's own generated file.
 */
export type LifecycleInitSchema = {
  /** Which `@Init` job has already run, one row per job. */
  __inits__: { row: InitRow };
};

/** A handle on this package's own table. */
export class InitTable<K extends keyof LifecycleInitSchema & string> extends Table<LifecycleInitSchema, K> {}

/** The jobs `runDeclaredInits` has already recorded as run. */
export function inits(): InitTable<"__inits__"> {
  return new InitTable("__inits__");
}
