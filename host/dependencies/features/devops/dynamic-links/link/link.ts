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

import type { InternalTDynamicLinksRow } from "@scribe/foundation/src/database/gen/rows.ts";
import { database } from "@scribe/foundation/src/database/database.ts";
import { type Pagination, pagination } from "@scribe/core/contracts/pagination.ts";
import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import { Repository } from "../core/repository.ts";
import type { DynamicLinkPayload } from "../payload/payload.ts";
import {
  dynamicLinkPayloadRecord,
  parseDynamicLinkPayload,
} from "../payload/payload.ts";
import { dynamicLinkCache } from "./_cache.ts";
import { generateSlug } from "./_slug.ts";

type DynamicLinkRow = Pick<
  InternalTDynamicLinksRow,
  "short_link_id" | "slug" | "payload" | "expires_at" | "created_at" | "updated_at"
>;

const MAX_SLUG_ATTEMPTS = 5;
const DEFAULT_PAGE_SIZE = 30;

export type DynamicLinkId = number;

export interface DynamicLink {
  readonly id: DynamicLinkId;
  readonly slug: string;
  readonly payload: DynamicLinkPayload;
  readonly expiresAt: number | null;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface CreateDynamicLinkInput {
  readonly payload: DynamicLinkPayload;
  readonly expiresAt?: number | null;
}

export interface UpdateDynamicLinkInput {
  readonly payload?: DynamicLinkPayload;
  readonly expiresAt?: number | null;
}

export interface DynamicLinkPaginationOptions {
  readonly offset?: number;
  readonly size?: number;
}

export enum DynamicLinkError {
  NotFound = "not_found",
  Expired = "expired",
  MalformedPayload = "malformed_payload",
  SlugConflict = "slug_conflict",
  Backend = "backend",
}

export interface DynamicLinkService {
  get(slug: string): Promise<Result<DynamicLink, DynamicLinkError>>;
  getById(id: DynamicLinkId): Promise<Result<DynamicLink, DynamicLinkError>>;
  pagination(
    options?: DynamicLinkPaginationOptions,
  ): Promise<Result<Pagination<DynamicLink>, DynamicLinkError>>;
  add(
    input: CreateDynamicLinkInput,
  ): Promise<Result<DynamicLink, DynamicLinkError>>;
  update(
    id: DynamicLinkId,
    input: UpdateDynamicLinkInput,
  ): Promise<Result<void, DynamicLinkError>>;
  remove(id: DynamicLinkId): Promise<Result<void, DynamicLinkError>>;
}

export class DynamicLinkRepository
  extends Repository<DynamicLinkError>
  implements DynamicLinkService
{
  protected override get backendError(): DynamicLinkError {
    return DynamicLinkError.Backend;
  }

  get(slug: string): Promise<Result<DynamicLink, DynamicLinkError>> {
    return this.guard(async () => {
      const link = await dynamicLinkCache.read(slug, () => this.#load(slug));

      if (!link) return new Failure(DynamicLinkError.NotFound);
      if (this.#expired(link)) return new Failure(DynamicLinkError.Expired);
      return new OK(link);
    });
  }

  getById(id: DynamicLinkId): Promise<Result<DynamicLink, DynamicLinkError>> {
    return this.guard(async () => {
      const row = await database
        .internal_t__dynamic_links()
        .where((f) => f.short_link_id.eq(id))
        .getOne();

      if (!row) return new Failure(DynamicLinkError.NotFound);

      const link = this.#domain(row);
      if (!link) return new Failure(DynamicLinkError.MalformedPayload);
      if (this.#expired(link)) return new Failure(DynamicLinkError.Expired);
      return new OK(link);
    });
  }

  pagination(
    options?: DynamicLinkPaginationOptions,
  ): Promise<Result<Pagination<DynamicLink>, DynamicLinkError>> {
    return this.guard(async () => {
      const offset = options?.offset ?? 0;
      const size = options?.size ?? DEFAULT_PAGE_SIZE;

      const rows = await database
        .internal_t__dynamic_links()
        .select((s) => ({
          short_link_id: s.short_link_id,
          slug: s.slug,
          payload: s.payload,
          expires_at: s.expires_at,
          created_at: s.created_at,
          updated_at: s.updated_at,
        }))
        .order("created_at", { ascending: false })
        .range(offset, offset + size)
        .get();

      const items = rows
        .map((row) => this.#domain(row))
        .filter((link): link is DynamicLink => link !== null);

      return new OK(pagination(items, offset, size));
    });
  }

  add(
    input: CreateDynamicLinkInput,
  ): Promise<Result<DynamicLink, DynamicLinkError>> {
    return this.guard(async () => {
      for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
        const row = await database.internal_t__dynamic_links().insertOne({
          slug: generateSlug(),
          payload: dynamicLinkPayloadRecord(input.payload),
          expires_at: input.expiresAt ?? null,
        });
        if (!row) continue;

        const link = this.#domain(row);
        if (!link) return new Failure(DynamicLinkError.MalformedPayload);

        await dynamicLinkCache.forget(link.slug);
        return new OK(link);
      }
      return new Failure(DynamicLinkError.SlugConflict);
    });
  }

  update(
    id: DynamicLinkId,
    input: UpdateDynamicLinkInput,
  ): Promise<Result<void, DynamicLinkError>> {
    return this.guard(async () => {
      const existing = await database
        .internal_t__dynamic_links()
        .select((s) => ({ slug: s.slug }))
        .where((f) => f.short_link_id.eq(id))
        .getOne();

      if (!existing) return new Failure(DynamicLinkError.NotFound);

      const ok = await database
        .internal_t__dynamic_links()
        .where((f) => f.short_link_id.eq(id))
        .update(this.#patch(input));

      if (!ok) return new Failure(DynamicLinkError.Backend);

      await dynamicLinkCache.forget(existing.slug);
      return new OK();
    });
  }

  remove(id: DynamicLinkId): Promise<Result<void, DynamicLinkError>> {
    return this.guard(async () => {
      const removed = await database
        .internal_t__dynamic_links()
        .where((f) => f.short_link_id.eq(id))
        .deleteOne((s) => ({ slug: s.slug }));

      if (!removed) return new Failure(DynamicLinkError.NotFound);

      await dynamicLinkCache.forget(removed.slug);
      return new OK();
    });
  }

  #patch(input: UpdateDynamicLinkInput): {
    payload?: Record<string, unknown>;
    expires_at?: number | null;
  } {
    return {
      ...(input.payload !== undefined && {
        payload: dynamicLinkPayloadRecord(input.payload),
      }),
      ...(input.expiresAt !== undefined && { expires_at: input.expiresAt }),
    };
  }

  async #load(slug: string): Promise<DynamicLink | null> {
    const row = await database
      .internal_t__dynamic_links()
      .where((f) => f.slug.eq(slug))
      .getOne();

    return row ? this.#domain(row) : null;
  }

  #expired(link: DynamicLink): boolean {
    return link.expiresAt !== null && link.expiresAt < Date.now();
  }

  #domain(row: DynamicLinkRow): DynamicLink | null {
    const payload = parseDynamicLinkPayload(row.payload);
    if (!payload) {
      console.warn(
        `[dynamic-links] malformed payload on link ${row.short_link_id}, ignored`,
      );
      return null;
    }

    return {
      id: row.short_link_id,
      slug: row.slug,
      payload,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
