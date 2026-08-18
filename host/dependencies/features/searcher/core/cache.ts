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

import { Time } from "@scribe/core/contracts/common/time.ts";
import { Valkery } from "@scribe/foundation/src/valkery/valkery.ts";

const DEFAULT_TTL = Time.seconds(300);

export class EntitySearchCache<TPreview> {
  // Two namespaces, and only one of them holds a single shape. A preview is always a
  // `TPreview`; a result set is whatever the query that produced it answers, which differs per
  // call — hence the `unknown` and the one cast below, at the only place that is honest about it.
  readonly #results: Valkery<unknown>;
  readonly #items: Valkery<TPreview>;

  constructor(table: string, name: string, ttl: Time = DEFAULT_TTL) {
    this.#results = new Valkery<unknown>({ key: `os:${table}`, ttl });
    this.#items = new Valkery<TPreview>({ key: `${name}:item`, ttl });
  }

  results<T>(key: string, produce: () => Promise<T>): Promise<T> {
    return this.#results.upsert(key, produce) as Promise<T>;
  }

  async invalidate(id: string): Promise<void> {
    await Promise.all([this.#items.delete(id), this.#results.clear()]);
  }

  async hydrate(
    ids: string[],
    idOf: (item: TPreview) => string,
    fetch: (missing: string[]) => Promise<TPreview[]>,
  ): Promise<Map<string, TPreview>> {
    const byId = new Map<string, TPreview>();
    // One round trip for the page, not one per result: a search that returns fifty ids used
    // to read fifty keys one after the other.
    const cached = await this.#items.getMany(ids);

    const missing: string[] = [];
    cached.forEach((item, i) => {
      if (item !== null) byId.set(ids[i], item);
      else missing.push(ids[i]);
    });

    if (missing.length === 0) return byId;

    const fetched = await fetch(missing);
    await Promise.all(
      fetched.map(async (item) => {
        const id = idOf(item);
        byId.set(id, item);
        await this.#items.add(id, item);
      }),
    );
    return byId;
  }
}
