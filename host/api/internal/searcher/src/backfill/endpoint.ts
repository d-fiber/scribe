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

import { PostgrestClients } from "@scribe/core/clients/database/client.ts";
import { from } from "@scribe/core/clients/database/tables.ts";
import { searcherRegistry } from "@scribe/host/dependencies/features/searcher/mod.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { ApiContext, RateLimiter } from "@scribe/core/kernel/endpoint/api.ts";
import { ServiceEndpoint } from "@scribe/core/kernel/endpoint/service.ts";
import { extensions } from "@scribe/core/runtime/support/extensions/mod.ts";
import { SEARCHER_EXTENSION } from "@scribe/host/dependencies/features/searcher/core/extension.ts";

const _DEFAULT_PAGE = 500;
const _MAX_PAGE = 2_000;

async function _nextIds(
  table: string,
  idColumn: string,
  after: string | null,
  limit: number,
): Promise<string[]> {
  let query = from<Record<string, string>>(PostgrestClients.service(), table)
    .selectRaw<Record<string, string>>(idColumn)
    .order(idColumn, { ascending: true })
    .limit(limit);

  if (after) query = query.where((f) => f[idColumn].gt(after));

  const rows = await query.get();
  return rows
    .map((row) => row[idColumn])
    .filter((id) => typeof id === "string" && id.length > 0);
}

export class BackfillEndpoint extends ServiceEndpoint {
  protected override rateLimit(): RateLimiter {
    return {
      limit: 60,
      window: Time.minutes(1),
      penalty: Time.minutes(1),
      maxPenalty: Time.minutes(10),
    };
  }

  protected async run(ctx: ApiContext): Promise<Response> {
    const body = ctx.body({ entity: String, after: String, limit: Number });

    await extensions.load(SEARCHER_EXTENSION);

    const name = body?.entity;
    const found = name ? searcherRegistry.byName(name) : null;
    const entities = name ? (found ? [found] : []) : searcherRegistry.all();
    if (entities.length === 0) return this.response.notFound();

    if (body?.after && entities.length > 1) return this.response.badRequest();

    const limit = Math.min(
      Math.max(Number(body?.limit) || _DEFAULT_PAGE, 1),
      _MAX_PAGE,
    );
    const report: Record<string, { indexed: number; next: string | null }> = {};

    for (const entity of entities) {
      const ids = await _nextIds(
        entity.table,
        entity.id,
        body?.after ?? null,
        limit,
      );
      const indexed = await entity.indexMany(ids);

      report[entity.name] = {
        indexed,
        next: ids.length === limit ? ids[ids.length - 1] : null,
      };
    }

    return this.response.ok({ data: report });
  }
}
