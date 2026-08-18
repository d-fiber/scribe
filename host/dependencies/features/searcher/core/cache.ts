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
import { Valkery } from "@scribe/host/packages/foundation/cache/valkery.ts";

const DEFAULT_TTL = Time.seconds(300);

class _NamespacedCache extends Valkery {
  constructor(
    private readonly _key: string,
    private readonly _ttl: Time,
  ) {
    super();
  }
  override get key(): string {
    return this._key;
  }
  override get ttl(): Time {
    return this._ttl;
  }
}

export class EntitySearchCache<TPreview> {
  readonly #results: Valkery;
  readonly #items: Valkery;

  constructor(table: string, name: string, ttl: Time = DEFAULT_TTL) {
    this.#results = new _NamespacedCache(`os:${table}`, ttl);
    this.#items = new _NamespacedCache(`${name}:item`, ttl);
  }

  results<T>(key: string, produce: () => Promise<T>): Promise<T> {
    return this.#results.upsert(key, produce);
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
    const cached = await Promise.all(
      ids.map((id) => this.#items.get<TPreview>(id)),
    );

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
