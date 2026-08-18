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
import type { DynamicLink } from "./link.ts";

const CACHE_TTL = Time.minutes(10);

interface CachedLink {
  readonly link: DynamicLink | null;
}

class _DynamicLinkCache extends Valkery {
  override get key(): string {
    return "dynlink:slug";
  }

  override get ttl(): Time {
    return CACHE_TTL;
  }
}

const cache = new _DynamicLinkCache();

class DynamicLinkCache {
  async read(
    slug: string,
    load: () => Promise<DynamicLink | null>,
  ): Promise<DynamicLink | null> {
    const cached = await cache.upsert<CachedLink>(slug, async () => ({
      link: await load(),
    }));
    return cached.link;
  }

  forget(slug: string): Promise<void> {
    return cache.delete(slug);
  }
}

export const dynamicLinkCache = new DynamicLinkCache();
