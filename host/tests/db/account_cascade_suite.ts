// Copyright (C) 2026 Fiber
//
// This file is part of scribe and is made available under the PolyForm Shield
// License 1.0.0. The full terms are in the LICENSE file at the root of this
// repository, and at https://polyformproject.org/licenses/shield/1.0.0
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
//
// The one thing you may not do:
// - Use it to provide any product that competes with scribe, or with any
//   product Fiber or its affiliates provide using scribe. Products compete
//   even when they are offered free of charge, through a different kind of
//   interface, or for a different technical platform.
//
// If you pass this software on:
// - Anyone who receives any part of it from you must also receive these terms,
//   or the URL above, together with the "Required Notice" line carried by the
//   LICENSE file.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE COMES AS IS, WITHOUT ANY WARRANTY OR
// CONDITION, AND THE LICENSOR WILL NOT BE LIABLE TO YOU FOR ANY DAMAGES ARISING
// OUT OF THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY KIND OF
// LEGAL CLAIM.
//
// This header is a summary written for convenience. Where it differs from the
// LICENSE file, the LICENSE file governs.

import { assert, assertEquals } from "@std/assert";

const SDK_ROOT = new URL("../../", import.meta.url).pathname;

const SDK_SQL_DIRS = [
  `${SDK_ROOT}core/db/init`,
  `${SDK_ROOT}packages/auth/db/init`,
  `${SDK_ROOT}dependencies/security/vpn/db/init`,
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
