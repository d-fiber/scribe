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

import type { MappingProperty } from "../fields/mapping.ts";
import { type QueryFields, queryFields } from "../fields/projection.ts";
import { QueryBuilder, query } from "../fields/query.ts";
import type { EntityQueryPlan, EntitySearchParams, SearcherSort } from "../types.ts";
import { stableSearchKey } from "./cache_key.ts";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SETTINGS,
  type Searcher,
  SearcherEntity,
  type StringKeyOf,
} from "./entity.ts";
import { searcherRegistry } from "./registry.ts";
import type { IndexSettings } from "./setup.ts";

export type SearcherProperties = Record<string, MappingProperty>;

export type SearcherSorts = Record<string, SearcherSort | SearcherSort[]>;

export interface SearcherQueryContext<
  P extends SearcherProperties,
  S extends SearcherSorts,
> {
  readonly q: QueryBuilder;
  readonly f: QueryFields<P>;
  readonly sorts: S;
}

export interface SearcherDefinition<
  TSearch extends EntitySearchParams,
  TPreview,
  P extends SearcherProperties,
  S extends SearcherSorts,
> {
  readonly name: string;
  readonly table: string;
  readonly id: StringKeyOf<TPreview>;
  readonly properties: P;
  readonly defaultPageSize?: number;
  readonly excludeFromIndex?: readonly string[];
  readonly settings?: IndexSettings;
  readonly sorts?: (f: QueryFields<P>) => S;
  readonly cacheKey?: (params: TSearch) => string;
  readonly query: (
    params: TSearch,
    ctx: SearcherQueryContext<P, S>,
  ) => QueryBuilder | EntityQueryPlan;
  readonly document: (ids: string[]) => Promise<Record<string, unknown>[]>;
  readonly fetch: (ids: string[]) => Promise<TPreview[]>;
}

function _plan(value: QueryBuilder | EntityQueryPlan): EntityQueryPlan {
  return value instanceof QueryBuilder ? value.build() : value;
}

export function defineSearcher<
  TSearch extends EntitySearchParams,
  TPreview,
  P extends SearcherProperties,
  S extends SearcherSorts = Record<never, never>,
>(
  definition: SearcherDefinition<TSearch, TPreview, P, S>,
): Searcher<TSearch, TPreview> {
  const f = queryFields(definition.properties);
  const sorts = (definition.sorts?.(f) ?? {}) as S;

  const entity = new SearcherEntity<TSearch, TPreview>({
    name: definition.name,
    table: definition.table,
    id: definition.id,
    properties: definition.properties,
    settings: definition.settings ?? DEFAULT_SETTINGS,
    defaultPageSize: definition.defaultPageSize ?? DEFAULT_PAGE_SIZE,
    excludeFromIndex: definition.excludeFromIndex ?? [],
    plan: (params) => _plan(definition.query(params, { q: query(), f, sorts })),
    document: definition.document,
    cacheKey: definition.cacheKey ?? stableSearchKey,
    fetch: definition.fetch,
  });

  searcherRegistry.register(entity);
  return entity;
}
