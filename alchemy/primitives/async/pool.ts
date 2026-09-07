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

import type { Future } from "./future.ts";
import type { UnmodifiableList } from "../value/list.ts";

/**
 * Runs `run` over every one of `items`, with at most `limit` of them in flight.
 *
 * @remarks
 * The workers share one cursor, so items are taken in order and **nothing says in what order they
 * finish**. It answers nothing on purpose: what a call produces, `run` has to put somewhere itself,
 * which is what keeps this from having to gather results nobody asked for.
 *
 * A call that fails stops the whole thing: the workers still in flight finish the item they hold
 * and then stand down, and the first failure is what comes back out. Nothing is started after it.
 * Work that should carry on past one failure has to catch inside `run`.
 *
 * That the others stop matters to whoever catches. A caller that retries what it believes was left
 * undone would otherwise redo items the pool went on to finish underneath it, which on a write is a
 * duplicate.
 *
 * @param items - What to visit, each exactly once.
 * @param limit - How many at a time. Anything under one is read as one, and more than there are
 * items opens only as many workers as there are items.
 * @param run - What to do with one item.
 *
 * @example
 * ```ts ignore
 * await runPooled(paths, 8, async (path) => {
 *   found.push(await disk.readText(path));
 * });
 * ```
 */
export async function runPooled<T>(
  items: UnmodifiableList<T>,
  limit: number,
  run: (item: T) => Future<void>,
): Future<void> {
  if (items.length === 0) return;

  const workers = Math.max(1, Math.min(limit, items.length));
  let cursor = 0;
  let failed = false;

  const raised = await Promise.allSettled(
    Array.from({ length: workers }, async () => {
      while (cursor < items.length && !failed) {
        try {
          await run(items[cursor++]);
        } catch (cause) {
          failed = true;
          throw cause;
        }
      }
    }),
  );

  const first = raised.find((settled) => settled.status === "rejected");
  if (first) throw (first as PromiseRejectedResult).reason;
}
