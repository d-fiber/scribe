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

import { Recommendation } from "../../gen/scribe/engine/dependencies/features/recommendation/protocol/recommendation_pb.ts";
import { encodeJson } from "../contracts/json.ts";
import { host } from "./channel.ts";
import { raiseOn } from "./error.ts";

const CAPABILITY = "recommendation";

export interface RecommendedUser {
  readonly id: string;
  readonly labels?: unknown;
  readonly comment?: string;
}

export interface RecommendedItem {
  readonly id: string;
  readonly labels?: unknown;
  readonly comment?: string;
  readonly categories?: readonly string[];
  readonly isHidden?: boolean;
  readonly timestamp?: string;
}

export interface FeedbackEntry {
  readonly type: string;
  readonly userId: string;
  readonly itemId: string;
  readonly value?: number;
  readonly timestamp?: string;
}

export const recommendation = {
  async upsertUser(user: RecommendedUser): Promise<void> {
    const result = await host.client().call(Recommendation.method.upsertUser, {
      user: {
        id: user.id,
        labels: encodeJson(user.labels ?? {}),
        comment: user.comment ?? "",
      },
    });
    raiseOn(CAPABILITY, result.error);
  },

  async upsertItem(item: RecommendedItem): Promise<void> {
    const result = await host.client().call(Recommendation.method.upsertItem, {
      item: {
        id: item.id,
        labels: encodeJson(item.labels ?? {}),
        comment: item.comment ?? "",
        categories: [...(item.categories ?? [])],
        isHidden: item.isHidden ?? false,
        timestamp: item.timestamp ?? "",
      },
    });
    raiseOn(CAPABILITY, result.error);
  },

  async deleteUser(userId: string): Promise<void> {
    const result = await host.client().call(Recommendation.method.deleteUser, { userId });
    raiseOn(CAPABILITY, result.error);
  },

  async deleteItem(itemId: string): Promise<void> {
    const result = await host.client().call(Recommendation.method.deleteItem, { itemId });
    raiseOn(CAPABILITY, result.error);
  },

  async insertFeedback(entries: readonly FeedbackEntry[]): Promise<void> {
    const result = await host.client().call(Recommendation.method.insertFeedback, {
      feedback: entries.map((entry) => ({
        type: entry.type,
        userId: entry.userId,
        itemId: entry.itemId,
        value: entry.value ?? 0,
        timestamp: entry.timestamp ?? "",
      })),
    });
    raiseOn(CAPABILITY, result.error);
  },

  async recommend(
    userId: string,
    count: number,
    category = "",
    offset = 0,
  ): Promise<readonly string[]> {
    const result = await host.client().call(Recommendation.method.recommend, {
      userId,
      count,
      category,
      offset,
    });
    raiseOn(CAPABILITY, result.error);
    return result.itemIds;
  },
};
