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

import { defineQueue } from "@scribe/foundation/src/queue/core/define.ts";
import { extensions } from "@scribe/core/runtime/support/extensions/mod.ts";
import { SEARCHER_EXTENSION } from "../core/extension.ts";
import { searcherRegistry } from "../core/registry.ts";
import { SyncOperation, type SyncOperationName } from "./operation.ts";

export interface SyncJob {
  readonly table: string;
  readonly operation: SyncOperationName;
  readonly id: string;
}

const LINGER_MS = 250;

type Grouped = Map<string, { removals: string[]; toBuild: string[] }>;

function group(jobs: readonly SyncJob[]): Grouped {
  const grouped: Grouped = new Map();

  for (const job of jobs) {
    let bucket = grouped.get(job.table);
    if (!bucket) {
      bucket = { removals: [], toBuild: [] };
      grouped.set(job.table, bucket);
    }

    if (job.operation === SyncOperation.Delete) bucket.removals.push(job.id);
    else bucket.toBuild.push(job.id);
  }

  return grouped;
}

export const searcherSyncQueue = defineQueue<SyncJob>(
  { name: "searcher-sync", batch: { lingerMs: LINGER_MS } },
  async (jobs) => {
    await extensions.load(SEARCHER_EXTENSION);

    for (const [table, bucket] of group(jobs)) {
      const entity = searcherRegistry.byTable(table);
      if (!entity) continue;

      for (const id of bucket.removals) await entity.applyRemove(id);

      if (bucket.toBuild.length === 0) continue;

      const ids = [...new Set(bucket.toBuild)];
      const documents = await entity.documents(ids);
      for (const document of documents) {
        const id = document[entity.id];
        if (typeof id !== "string" || id.length === 0) continue;
        await entity.applyIndex(id, document);
      }
    }
  },
);
