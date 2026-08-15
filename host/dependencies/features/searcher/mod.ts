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

export { defineSearcher } from "./core/define.ts";
export type {
  SearcherDefinition,
  SearcherProperties,
  SearcherQueryContext,
  SearcherSorts,
} from "./core/define.ts";

export type {
  EntityQueryPlan,
  EntitySearchParams,
  Searcher,
} from "./core/entity.ts";

export { searcherRegistry } from "./core/registry.ts";
export { openSearch } from "./core/transport.ts";
export { SearcherSetupClient } from "./core/setup.ts";
export type { IndexConfig, IndexMappings, IndexSettings } from "./core/setup.ts";
export { roundCoord, stableSearchKey, timeBucket } from "./core/cache_key.ts";

export { Field } from "./fields/mapping.ts";
export type { MappingProperty } from "./fields/mapping.ts";
export { query, QueryBuilder, textMatch } from "./fields/query.ts";
export { queryFields } from "./fields/projection.ts";
export type {
  NestedFields,
  NestedPaths,
  QueryFields,
  SortableFields,
  TextFields,
} from "./fields/projection.ts";

export { searcher, SearchClient } from "./searcher.ts";

export {
  Distance,
  DistanceUnit,
  Fuzziness,
  MultiMatchType,
  ScriptLang,
  ScriptValueType,
  SortOrder,
} from "./types.ts";
export type {
  BoolQuery,
  DistanceValue,
  FieldSort,
  FieldSortOptions,
  GeoDistanceQuery,
  GeoDistanceSort,
  MatchAllQuery,
  MatchQuery,
  MinimumShouldMatch,
  MultiMatchQuery,
  NestedQuery,
  RangeQuery,
  ScalarValue,
  ScriptSort,
  SearcherQuery,
  SearcherSort,
  TermQuery,
  TermsQuery,
} from "./types.ts";
