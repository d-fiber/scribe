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

import { Search } from "../../gen/scribe/host/packages/search/protocol/search_pb.ts";
import { decodeJson, encodeJson } from "../contracts/json.ts";
import { host } from "./channel.ts";
import { raiseOn } from "./error.ts";

const CAPABILITY = "search";

/** One page of results, as the index that answered it shaped them. */
export interface SearchPage<T> {
  /** The previews the index answered with, in the order it ranked them. */
  readonly items: readonly T[];

  /** How many documents matched in total, which is what a page count is computed against. */
  readonly total: number;
}

export const search = {
  /**
   * Queues `ids` of the index `index` for a rebuild, and answers whether the request was recorded.
   *
   * A table carrying the package's trigger never needs this. It is for the documents no table
   * change announces, such as one built from an outside service.
   */
  async add(index: string, ids: readonly string[]): Promise<boolean> {
    const result = await host.client().call(Search.method.add, { index, ids: [...ids] });
    raiseOn(CAPABILITY, result.error);
    return result.queued;
  },

  /** Queues `ids` of the index `index` for removal, and answers whether the request was recorded. */
  async delete(index: string, ids: readonly string[]): Promise<boolean> {
    const result = await host.client().call(Search.method.delete, { index, ids: [...ids] });
    raiseOn(CAPABILITY, result.error);
    return result.queued;
  },

  /**
   * Answers the page the index `index` gives for `params`.
   *
   * `params` is whatever the declaration takes, and nothing else travels: the plan, the fields
   * looked in and the shape of one result are all decided by the declaration on the host.
   */
  async search<T>(index: string, params: unknown): Promise<SearchPage<T>> {
    const result = await host.client().call(Search.method.search, {
      index,
      params: encodeJson(params),
    });

    raiseOn(CAPABILITY, result.error);
    return decodeJson<SearchPage<T>>(result.page) ?? { items: [], total: 0 };
  },
};
