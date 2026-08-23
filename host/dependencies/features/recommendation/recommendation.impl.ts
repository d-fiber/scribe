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

import { Duration } from "@scribe/alchemy";
import { Failure, Ok, okay, type Result } from "@scribe/alchemy";
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
import { currentClient } from "@scribe/foundation/lib/src/http/run_with_client.ts";
import type { HttpResponse } from "@scribe/alchemy/http";

const TIMEOUT: Duration = Duration.seconds(5);

export class RecommendationClient implements RecommendationService {
  async upsertUser(
    user: GorseUser,
  ): Promise<Result<void, RecommendationUpsertUserError>> {
    const res = await this.#send("POST", "/api/user", {
      UserId: user.id,
      Labels: user.labels ?? {},
      Comment: user.comment ?? "",
    });
    if (!res.ok) return new Failure(RecommendationUpsertUserError.Unexpected);
    return okay;
  }

  async upsertItem(
    item: GorseItem,
  ): Promise<Result<void, RecommendationUpsertItemError>> {
    const res = await this.#send("POST", "/api/item", {
      ItemId: item.id,
      Categories: item.categories ?? [],
      Labels: item.labels ?? {},
      IsHidden: item.isHidden ?? false,
      Timestamp: item.timestamp ?? new Date().toISOString(),
      Comment: item.comment ?? "",
    });
    if (!res.ok) return new Failure(RecommendationUpsertItemError.Unexpected);
    return okay;
  }

  async deleteUser(
    userId: string,
  ): Promise<Result<void, RecommendationDeleteUserError>> {
    const res = await this.#send("DELETE", `/api/user/${encodeURIComponent(userId)}`);
    if (res.statusCode === 404) {
      return new Failure(RecommendationDeleteUserError.NotFound);
    }
    if (!res.ok) return new Failure(RecommendationDeleteUserError.Unexpected);
    return okay;
  }

  async deleteItem(
    itemId: string,
  ): Promise<Result<void, RecommendationDeleteItemError>> {
    const res = await this.#send("DELETE", `/api/item/${encodeURIComponent(itemId)}`);
    if (res.statusCode === 404) {
      return new Failure(RecommendationDeleteItemError.NotFound);
    }
    if (!res.ok) return new Failure(RecommendationDeleteItemError.Unexpected);
    return okay;
  }

  async insertFeedback(
    feedback: GorseFeedback[],
  ): Promise<Result<void, RecommendationFeedbackError>> {
    const res = await this.#send(
      "POST",
      "/api/feedback",
      feedback.map((f) => ({
        FeedbackType: f.type,
        UserId: f.userId,
        ItemId: f.itemId,
        Value: f.value ?? 1,
        Timestamp: f.timestamp ?? new Date().toISOString(),
      })),
    );
    if (!res.ok) return new Failure(RecommendationFeedbackError.Unexpected);
    return okay;
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

    const res = await this.#send(
      "GET",
      `/api/recommend/${encodeURIComponent(userId)}${query}`,
    );
    if (!res.ok) return new Failure(RecommendationRecommendError.Unexpected);
    return new Ok(res.json<string[]>());
  }

  // Gorse answers JSON everywhere and reads it everywhere, so the content type and the key are
  // set once here rather than at each of the six calls.
  async #send(
    method: "GET" | "POST" | "DELETE",
    path: string,
    body?: unknown,
  ): Promise<HttpResponse> {
    const client = currentClient();
    const url = `${Env.GORSE_URL}${path}`;
    const options = {
      headers: {
        "X-API-Key": Env.GORSE_API_KEY,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: body === undefined ? null : JSON.stringify(body),
      timeout: TIMEOUT,
    };

    try {
      if (method === "POST") return await client.post(url, options);
      if (method === "DELETE") return await client.delete(url, options);
      return await client.get(url, options);
    } finally {
      client.close();
    }
  }
}
