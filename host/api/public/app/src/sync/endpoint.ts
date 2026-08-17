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

import { SyncEntityDelta, SyncResult } from "@scribe/core/contracts/sync.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { rest } from "@scribe/host/dependencies/database/rest/rest.ts";
import { realtime } from "@scribe/host/dependencies/database/realtime/mod.ts";
import { ApiContext, ApiEndpoint, Caller } from "@scribe/core/kernel/endpoint/api.ts";

const MAX_ENTITIES = 20;
const MAX_KNOWN_IDS = 2000;
const MAX_TOPICS = 50;

interface RpcRow {
  upserted_ids: string[] | null;
  deleted_ids: string[] | null;
  new_cursor: number | null;
  full_resync: boolean | null;
}

interface Channel {
  scope: "users" | "user";
  recipientId: string | null;
  topic: string | null;
}

export class SyncEndpoint extends ApiEndpoint {
  protected access(): Caller {
    return Caller.User;
  }

  protected rateLimit() {
    return {
      limit: 30,
      window: Time.minutes(1),
      penalty: Time.minutes(1),
      maxPenalty: Time.minutes(10),
    };
  }

  protected async run(ctx: ApiContext): Promise<Response> {
    const userId = ctx.id;
    if (!userId) return this.response.unauthorized();

    const raw = ctx.raw();
    if (!raw || typeof raw !== "object") return this.response.badRequest();
    const body = raw as Record<string, unknown>;

    const cursor = Math.max(0, Math.floor(Number(body.cursor) || 0));
    const known = this.#knownIds(body.entities);
    if (!known) {
      return this.response.badRequest({
        code: "invalid_entities",
        message: "`entities` must map an entity name to an array of ids.",
      });
    }

    const entities = Object.keys(known);
    if (entities.length === 0) {
      return this.response.ok({
        data: { cursor, full_resync: false, entities: {} } satisfies SyncResult,
      });
    }
    if (entities.length > MAX_ENTITIES) {
      return this.response.badRequest({
        code: "too_many_entities",
        message: `At most ${MAX_ENTITIES} entities can be synced per call.`,
      });
    }

    const channels = await this.#channels(userId, body.topics);
    if (!channels) {
      return this.response.badRequest({
        code: "too_many_topics",
        message: `At most ${MAX_TOPICS} topics can be synced per call.`,
      });
    }

    // Every entity and channel pair goes out together, so the client pays for
    // one round trip rather than one per entity, the way a sync endpoint
    // dedicated to a single entity would.
    const queries = entities.flatMap((entity) =>
      channels.map((channel) => this.#query(entity, channel, cursor, known[entity]))
    );
    const rows = await Promise.all(queries);

    return this.response.ok({ data: this.#merge(entities, channels.length, rows, cursor) });
  }

  #knownIds(value: unknown): Record<string, string[]> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;

    const out: Record<string, string[]> = {};
    for (const [entity, ids] of Object.entries(value as Record<string, unknown>)) {
      if (!Array.isArray(ids)) return null;
      const strings = ids.filter((id): id is string => typeof id === "string");
      if (strings.length > MAX_KNOWN_IDS) return null;
      out[entity] = strings;
    }
    return out;
  }

  /**
   * The channels an account can really receive on.
   *
   * Those are the broad channel of its role, its own private channel, and the
   * requested topics it belongs to. Membership is filtered here rather than in
   * SQL so that a client cannot probe a topic it does not belong to and read
   * activity off the answer.
   */
  async #channels(userId: string, topics: unknown): Promise<Channel[] | null> {
    const requested = Array.isArray(topics) ? topics.filter((t): t is string => typeof t === "string") : [];
    if (requested.length > MAX_TOPICS) return null;

    const channels: Channel[] = [
      { scope: "users", recipientId: null, topic: null },
      { scope: "user", recipientId: userId, topic: null },
    ];

    if (requested.length > 0) {
      const owned = new Set(await realtime.topics.users.of(userId));
      for (const topic of requested) {
        if (owned.has(topic)) {
          channels.push({ scope: "users", recipientId: null, topic });
        }
      }
    }

    return channels;
  }

  async #query(
    entity: string,
    channel: Channel,
    cursor: number,
    knownIds: string[],
  ): Promise<RpcRow | null> {
    const { data } = await rest
      .rpc("get_sync_ids", {
        p_scope: channel.scope,
        p_entity: entity,
        p_cursor: cursor,
        p_known_ids: knownIds,
        p_recipient_id: channel.recipientId,
        p_topic: channel.topic,
      })
      .single();

    return (data as RpcRow | null) ?? null;
  }

  #merge(
    entities: string[],
    channelCount: number,
    rows: (RpcRow | null)[],
    cursor: number,
  ): SyncResult {
    let newCursor = cursor;
    let fullResync = false;
    const merged: Record<string, SyncEntityDelta> = {};

    entities.forEach((entity, index) => {
      const upserted = new Set<string>();
      const deleted = new Set<string>();

      for (let i = 0; i < channelCount; i++) {
        const row = rows[index * channelCount + i];
        if (!row) continue;

        if (row.full_resync) fullResync = true;
        // The maximum and not the minimum. A channel with no event returns the
        // cursor it was given, so taking the minimum would freeze the cursor as
        // soon as one channel went quiet. Moving forward is safe because the
        // safety margin of get_sync_ids is computed on the same `now` for all
        // of them.
        if (row.new_cursor && row.new_cursor > newCursor) newCursor = row.new_cursor;

        for (const id of row.upserted_ids ?? []) upserted.add(id);
        for (const id of row.deleted_ids ?? []) deleted.add(id);
      }

      // An id deleted on one channel and changed on another counts as deleted.
      // That is the outcome that makes the client converge on absence: a lost
      // upsert is caught on the next cycle, whereas a missed deletion leaves a
      // ghost row behind.
      for (const id of deleted) upserted.delete(id);

      merged[entity] = { upserted: [...upserted], deleted: [...deleted] };
    });

    if (fullResync) {
      return { cursor: newCursor, full_resync: true, entities: {} };
    }
    return { cursor: newCursor, full_resync: false, entities: merged };
  }
}
