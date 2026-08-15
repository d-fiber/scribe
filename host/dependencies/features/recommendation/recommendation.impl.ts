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

import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import type {
  GorseFeedback,
  GorseItem,
  GorseUser,
  RecommendationOptions,
  RecommendationService,
} from "@scribe/host/dependencies/features/recommendation/recommendation.ts";
import {
  RecommendationDeleteItemError,
  RecommendationDeleteUserError,
  RecommendationFeedbackError,
  RecommendationRecommendError,
  RecommendationUpsertItemError,
  RecommendationUpsertUserError,
} from "@scribe/host/dependencies/features/recommendation/recommendation.ts";
import { Env } from "@scribe/host/env.ts";

const TIMEOUT_MS = 5_000;

export class RecommendationClient implements RecommendationService {
  async upsertUser(
    user: GorseUser,
  ): Promise<Result<void, RecommendationUpsertUserError>> {
    const res = await this.#fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        UserId: user.id,
        Labels: user.labels ?? {},
        Comment: user.comment ?? "",
      }),
    });
    if (!res.ok) return new Failure(RecommendationUpsertUserError.Unexpected);
    return new OK();
  }

  async upsertItem(
    item: GorseItem,
  ): Promise<Result<void, RecommendationUpsertItemError>> {
    const res = await this.#fetch("/api/item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ItemId: item.id,
        Categories: item.categories ?? [],
        Labels: item.labels ?? {},
        IsHidden: item.isHidden ?? false,
        Timestamp: item.timestamp ?? new Date().toISOString(),
        Comment: item.comment ?? "",
      }),
    });
    if (!res.ok) return new Failure(RecommendationUpsertItemError.Unexpected);
    return new OK();
  }

  async deleteUser(
    userId: string,
  ): Promise<Result<void, RecommendationDeleteUserError>> {
    const res = await this.#fetch(`/api/user/${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
    if (res.status === 404) {
      return new Failure(RecommendationDeleteUserError.NotFound);
    }
    if (!res.ok) return new Failure(RecommendationDeleteUserError.Unexpected);
    return new OK();
  }

  async deleteItem(
    itemId: string,
  ): Promise<Result<void, RecommendationDeleteItemError>> {
    const res = await this.#fetch(`/api/item/${encodeURIComponent(itemId)}`, {
      method: "DELETE",
    });
    if (res.status === 404) {
      return new Failure(RecommendationDeleteItemError.NotFound);
    }
    if (!res.ok) return new Failure(RecommendationDeleteItemError.Unexpected);
    return new OK();
  }

  async insertFeedback(
    feedback: GorseFeedback[],
  ): Promise<Result<void, RecommendationFeedbackError>> {
    const res = await this.#fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        feedback.map((f) => ({
          FeedbackType: f.type,
          UserId: f.userId,
          ItemId: f.itemId,
          Value: f.value ?? 1,
          Timestamp: f.timestamp ?? new Date().toISOString(),
        })),
      ),
    });
    if (!res.ok) return new Failure(RecommendationFeedbackError.Unexpected);
    return new OK();
  }

  async recommend(
    userId: string,
    options?: RecommendationOptions,
  ): Promise<Result<string[], RecommendationRecommendError>> {
    const params = new URLSearchParams();
    if (options?.count) params.set("n", String(options.count));
    if (options?.category) params.set("category", options.category);
    if (options?.offset) params.set("offset", String(options.offset));
    const query = params.size > 0 ? `?${params}` : "";

    const res = await this.#fetch(
      `/api/recommend/${encodeURIComponent(userId)}${query}`,
    );
    if (!res.ok) return new Failure(RecommendationRecommendError.Unexpected);
    return new OK((await res.json()) as string[]);
  }

  #fetch(path: string, init: RequestInit = {}): Promise<Response> {
    return fetch(`${Env.GORSE_URL}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        "X-API-Key": Env.GORSE_API_KEY,
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  }
}
