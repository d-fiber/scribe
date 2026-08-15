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

import type { Pagination } from "@scribe/core/contracts/pagination.ts";
import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import type { MappingProperty } from "../fields/mapping.ts";
import { SyncOperation } from "../sync/operation.ts";
import { searcherSyncQueue } from "../sync/queue.ts";
import type { EntityQueryPlan, EntitySearchParams } from "../types.ts";
import { EntitySearchCache } from "./cache.ts";
import { type IndexSettings, SearcherSetupClient } from "./setup.ts";
import { openSearch } from "./transport.ts";

export type { EntityQueryPlan, EntitySearchParams };

export type StringKeyOf<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T] &
  string;

export interface Searcher<TSearch extends EntitySearchParams, TPreview> {
  add(id: string): Promise<void>;
  delete(id: string): Promise<void>;
  search(params: TSearch): Promise<Result<Pagination<TPreview>, void>>;
}

export interface ResolvedSearcher<
  TSearch extends EntitySearchParams,
  TPreview,
> {
  readonly name: string;
  readonly table: string;
  readonly id: StringKeyOf<TPreview>;
  readonly properties: Record<string, MappingProperty>;
  readonly settings: IndexSettings;
  readonly defaultPageSize: number;
  readonly excludeFromIndex: readonly string[];
  readonly document: (ids: string[]) => Promise<Record<string, unknown>[]>;
  readonly plan: (params: TSearch) => EntityQueryPlan;
  readonly cacheKey: (params: TSearch) => string;
  readonly fetch: (ids: string[]) => Promise<TPreview[]>;
}

interface SearchResponse {
  hits?: {
    hits?: { _source: Record<string, string> }[];
    total?: { value?: number };
  };
}

export const DEFAULT_SETTINGS: IndexSettings = {
  analysis: {
    normalizer: {
      sort_normalizer: {
        type: "custom",
        filter: ["lowercase", "asciifolding"],
      },
    },
    analyzer: {
      default: {
        type: "custom",
        tokenizer: "standard",
        filter: ["lowercase", "asciifolding"],
      },
    },
  },
};

export const DEFAULT_PAGE_SIZE = 20;

export class SearcherEntity<
  TSearch extends EntitySearchParams,
  TPreview,
> implements Searcher<TSearch, TPreview> {
  readonly #cache: EntitySearchCache<TPreview>;
  readonly #definition: ResolvedSearcher<TSearch, TPreview>;

  constructor(definition: ResolvedSearcher<TSearch, TPreview>) {
    this.#definition = definition;
    this.#cache = new EntitySearchCache<TPreview>(
      definition.table,
      definition.name,
    );
  }

  get name(): string {
    return this.#definition.name;
  }

  get table(): string {
    return this.#definition.table;
  }

  get id(): StringKeyOf<TPreview> {
    return this.#definition.id;
  }

  get defaultPageSize(): number {
    return this.#definition.defaultPageSize;
  }

  #beforeIndex(record: Record<string, unknown>): Record<string, unknown> {
    if (this.#definition.excludeFromIndex.length === 0) return record;
    const copy = { ...record };
    for (const field of this.#definition.excludeFromIndex) delete copy[field];
    return copy;
  }

  setup(): Promise<void> {
    return new SearcherSetupClient(openSearch()).index(this.table, {
      settings: this.#definition.settings,
      mappings: { properties: this.#definition.properties },
    });
  }

  async indexMany(ids: readonly string[]): Promise<number> {
    if (ids.length === 0) return 0;

    const rows = await this.#definition.document([...ids]);
    let indexed = 0;
    for (const row of rows) {
      const id = row[this.#definition.id];
      if (typeof id !== "string" || id.length === 0) continue;
      await this.applyIndex(id, row);
      indexed++;
    }
    return indexed;
  }

  documents(ids: string[]): Promise<Record<string, unknown>[]> {
    return this.#definition.document(ids);
  }

  async add(id: string): Promise<void> {
    await searcherSyncQueue.push({
      table: this.table,
      operation: SyncOperation.Index,
      id,
    });
  }

  async delete(id: string): Promise<void> {
    await searcherSyncQueue.push({
      table: this.table,
      operation: SyncOperation.Delete,
      id,
    });
  }

  async applyIndex(id: string, record: Record<string, unknown>): Promise<void> {
    await openSearch().index({
      index: this.table,
      id,
      body: this.#beforeIndex(record),
    });
    await this.#cache.invalidate(id);
  }

  async applyRemove(id: string): Promise<void> {
    await openSearch().delete({ index: this.table, id });
    await this.#cache.invalidate(id);
  }

  async search(params: TSearch): Promise<Result<Pagination<TPreview>, void>> {
    try {
      const data = await this.#cache.results(
        this.#definition.cacheKey(params),
        () => this.#execute(params),
      );
      return new OK(data);
    } catch {
      return new Failure();
    }
  }

  async #execute(params: TSearch): Promise<Pagination<TPreview>> {
    const { bool, sort } = this.#definition.plan(params);
    const page = params.page;

    const { body } = await openSearch().search({
      index: this.table,
      body: {
        _source: [this.id],
        query: { bool },
        ...(sort.length ? { sort } : {}),
        size: page?.size ?? this.defaultPageSize,
        from: page?.from ?? 0,
      },
    });
    const res = body as SearchResponse;

    const ids = (res.hits?.hits ?? []).map((h) => h._source[this.id]);
    const total = res.hits?.total?.value ?? 0;

    if (ids.length === 0) {
      return { items: [], pagination: { offset: 0, total, has_more: false } };
    }

    const byId = await this.#cache.hydrate(
      ids,
      (item) => (item as Record<string, string>)[this.id],
      (missing) => this.#definition.fetch(missing),
    );
    const items = ids
      .map((id) => byId.get(id))
      .filter((v): v is TPreview => v !== undefined);

    const from = page?.from ?? 0;
    const offset = from + items.length;

    return {
      items,
      pagination: { offset, total, has_more: offset < total },
    };
  }
}
