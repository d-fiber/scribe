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

import { Recommendation } from "../../gen/scribe/host/dependencies/features/recommendation/protocol/recommendation_pb.ts";
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
