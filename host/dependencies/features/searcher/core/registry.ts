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

// deno-lint-ignore-file no-explicit-any

import type { SearcherEntity } from "./entity.ts";

type AnyEntity = SearcherEntity<any, any>;

class SearcherRegistry {
  readonly #byName = new Map<string, AnyEntity>();
  readonly #byTable = new Map<string, AnyEntity>();

  register(entity: AnyEntity): void {
    const existing = this.#byName.get(entity.name);
    if (existing) {
      throw new Error(
        `[searcher] entity "${entity.name}" already declared on table "${existing.table}".`,
      );
    }
    const onTable = this.#byTable.get(entity.table);
    if (onTable) {
      throw new Error(
        `[searcher] table "${entity.table}" already indexed by entity "${onTable.name}".`,
      );
    }
    this.#byName.set(entity.name, entity);
    this.#byTable.set(entity.table, entity);
  }

  byName(name: string): AnyEntity | null {
    return this.#byName.get(name) ?? null;
  }

  byTable(table: string): AnyEntity | null {
    return this.#byTable.get(table) ?? null;
  }

  all(): readonly AnyEntity[] {
    return [...this.#byName.values()];
  }

  report(): string {
    const count = this.#byName.size;
    if (count === 0) return "[searcher] no entity declared.";
    return `[searcher] ${count} entit${count > 1 ? "ies" : "y"} declared.`;
  }
}

export const searcherRegistry = new SearcherRegistry();
