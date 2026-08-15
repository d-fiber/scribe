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

import { Searcher } from "../../gen/scribe/host/dependencies/features/searcher/protocol/searcher_pb.ts";
import { decodeJson, encodeJson } from "../contracts/json.ts";
import { host } from "./channel.ts";
import { raiseOn } from "./error.ts";

const CAPABILITY = "searcher";

export interface SearchDocument {
  readonly id: string;
  readonly source: unknown;
}

export interface SearchSort {
  readonly field: string;
  readonly descending?: boolean;
  readonly geo?: { readonly lat: number; readonly lng: number; readonly radiusMeters: number };
}

export interface SearchOptions {
  readonly fields?: readonly string[];
  readonly sort?: readonly SearchSort[];
  readonly limit?: number;
  readonly offset?: number;
  readonly cacheKey?: string;
}

export interface SearchOutcome<T> {
  readonly hits: readonly { readonly id: string; readonly score: number; readonly source: T | null }[];
  readonly total: number;
}

export const searcher = {
  async add(
    entity: string,
    documents: readonly SearchDocument[],
    refresh = false,
  ): Promise<number> {
    const result = await host.client().call(Searcher.method.add, {
      entity,
      documents: documents.map((document) => ({
        id: document.id,
        source: encodeJson(document.source),
      })),
      refresh,
    });
    raiseOn(CAPABILITY, result.error);
    return result.indexed;
  },

  async delete(entity: string, ids: readonly string[]): Promise<number> {
    const result = await host.client().call(Searcher.method.delete, { entity, ids: [...ids] });
    raiseOn(CAPABILITY, result.error);
    return result.deleted;
  },

  async search<T>(
    entity: string,
    query: unknown,
    options: SearchOptions = {},
  ): Promise<SearchOutcome<T>> {
    const result = await host.client().call(Searcher.method.search, {
      entity,
      query: encodeJson(query),
      fields: [...(options.fields ?? [])],
      sort: (options.sort ?? []).map((sort) => ({
        field: sort.field,
        descending: sort.descending ?? false,
        geo: sort.geo
          ? { lat: sort.geo.lat, lng: sort.geo.lng, radiusMeters: sort.geo.radiusMeters }
          : undefined,
      })),
      limit: options.limit ?? 0,
      offset: options.offset ?? 0,
      cacheKey: options.cacheKey ?? "",
    });

    raiseOn(CAPABILITY, result.error);
    return {
      hits: result.hits.map((hit) => ({
        id: hit.id,
        score: hit.score,
        source: decodeJson<T>(hit.source),
      })),
      total: Number(result.total),
    };
  },
};
