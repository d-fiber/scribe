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

import { assert, assertEquals } from "@std/assert";

const SDK_ROOT = new URL("../../../", import.meta.url).pathname;

const SDK_SQL_DIRS = [
  `${SDK_ROOT}db/init`,
  `${SDK_ROOT}packages/auth/db/init`,
];

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await Deno.stat(path)).isDirectory;
  } catch {
    return false;
  }
}

async function walk(dir: string, entry: Deno.DirEntry, out: string[]): Promise<void> {
  const path = `${dir}/${entry.name}`;
  if (entry.isDirectory) {
    for await (const child of Deno.readDir(path)) await walk(path, child, out);
    return;
  }
  if (entry.name.endsWith(".sql")) out.push(path);
}

async function allSql(roots: string[]): Promise<string> {
  const files: string[] = [];
  for (const dir of roots) {
    if (!await isDirectory(dir)) continue;
    for await (const entry of Deno.readDir(dir)) await walk(dir, entry, files);
  }
  const parts = await Promise.all(files.map((f) => Deno.readTextFile(f)));
  return parts.join("\n").toLowerCase().replace(/\s+/g, " ");
}

export function registerAccountCascadeTests(label: string, extraRoots: string[] = []): void {
  const roots = [...SDK_SQL_DIRS, ...extraRoots];

  Deno.test(`${label}: account root tables cascade from auth.users`, async () => {
    const sql = await allSql(roots);
    for (const table of ["internal_t__app_users", "internal_t__admin_users"]) {
      const declaration = sql.match(
        new RegExp(`create table[^;]*${table} \\([^;]*?references auth\\.users\\(id\\) on delete cascade`),
      );
      assert(
        declaration !== null,
        `${table} must reference auth.users(id) on delete cascade, which is what makes the sign-up rollback complete`,
      );
    }
  });

  Deno.test(`${label}: every child table of an account declares an explicit delete action`, async () => {
    const sql = await allSql(roots);
    const references = [
      ...sql.matchAll(
        /references public\.(internal_t__app_users|internal_t__admin_users)\s*\([^)]*\)((?: on delete (?:cascade|set null|restrict))?)/g,
      ),
    ];

    assert(references.length > 0, "no reference found, the test is testing nothing");

    const orphans = references
      .filter((match) => match[2].trim() === "")
      .map((match) => match[0]);

    assertEquals(
      orphans,
      [],
      `these references have no delete action: the row would outlive the account`,
    );
  });

  Deno.test(`${label}: pending-token cleanup is scheduled`, async () => {
    const sql = await allSql(roots);
    assert(
      sql.includes("cleanup-pending-tokens"),
      "without a scheduled purge, __pending_tokens__ grows unbounded",
    );
  });

  Deno.test(`${label}: an account of any role cascades into what hangs off it`, async () => {
    const sql = await allSql(roots);
    const references = [
      ...sql.matchAll(
        /references public\.__accounts__\s*\([^)]*\)((?: on delete (?:cascade|set null|restrict))?)/g,
      ),
    ];

    assert(references.length > 0, "no reference to the accounts table found, the test is testing nothing");

    assertEquals(
      references.filter((match) => match[1].trim() === "").map((match) => match[0]),
      [],
      "these references have no delete action: the row would outlive the account",
    );
  });
}
