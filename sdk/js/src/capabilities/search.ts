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
