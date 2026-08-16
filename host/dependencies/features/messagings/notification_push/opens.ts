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

import type { InternalTNotificationPushOpensRow } from "@scribe/host/dependencies/database/rest/gen/rows.ts";
import { rest } from "@scribe/host/dependencies/database/rest/rest.ts";
import { type Pagination, pagination } from "@scribe/core/contracts/pagination.ts";
import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import { DEFAULT_PAGE_SIZE, type ListOptions } from "./core/list.ts";
import { Repository } from "./core/repository.ts";
import type { PushNotificationId } from "./send.ts";

type PushOpenRow = Pick<
  InternalTNotificationPushOpensRow,
  | "open_id"
  | "push_id"
  | "created_at"
>;

export type PushNotificationOpenId = number;

export interface PushNotificationOpen {
  readonly id: PushNotificationOpenId;
  readonly pushNotificationId: PushNotificationId;
  readonly createdAt: number;
}

export enum PushNotificationOpenError {
  NotFound = "not_found",
  Backend = "backend",
}

export interface PushNotificationOpenService {
  get(
    id: PushNotificationOpenId,
  ): Promise<Result<PushNotificationOpen, PushNotificationOpenError>>;
  list(
    pushId: PushNotificationId,
    options?: ListOptions,
  ): Promise<Result<Pagination<PushNotificationOpen>, PushNotificationOpenError>>;
  record(pushId: PushNotificationId): Promise<Result<void, PushNotificationOpenError>>;
  remove(id: PushNotificationOpenId): Promise<Result<void, PushNotificationOpenError>>;
}

export class PushNotificationOpenRepository extends Repository<PushNotificationOpenError>
  implements PushNotificationOpenService {
  protected override get backendError(): PushNotificationOpenError {
    return PushNotificationOpenError.Backend;
  }

  get(
    id: PushNotificationOpenId,
  ): Promise<Result<PushNotificationOpen, PushNotificationOpenError>> {
    return this.guard(async () => {
      const row = await rest
        .internal_t__notification_push_opens()
        .where((f) => f.open_id.eq(id))
        .getOne();

      return row ? new OK(this.#domain(row)) : new Failure(PushNotificationOpenError.NotFound);
    });
  }

  list(
    pushId: PushNotificationId,
    options?: ListOptions,
  ): Promise<Result<Pagination<PushNotificationOpen>, PushNotificationOpenError>> {
    return this.guard(async () => {
      const offset = options?.offset ?? 0;
      const size = options?.size ?? DEFAULT_PAGE_SIZE;

      const rows = await rest
        .internal_t__notification_push_opens()
        .select((s) => ({
          open_id: s.open_id,
          push_id: s.push_id,
          created_at: s.created_at,
        }))
        .where((f) => f.push_id.eq(pushId))
        .order("created_at", { ascending: false })
        .range(offset, offset + size)
        .get();

      return new OK(
        pagination(
          rows.map((row) => this.#domain(row)),
          offset,
          size,
        ),
      );
    });
  }

  record(pushId: PushNotificationId): Promise<Result<void, PushNotificationOpenError>> {
    return this.guard(async () => {
      const row = await rest
        .internal_t__notification_push_opens()
        .insertOne({ push_id: pushId });

      return row ? new OK() : new Failure(PushNotificationOpenError.Backend);
    });
  }

  remove(id: PushNotificationOpenId): Promise<Result<void, PushNotificationOpenError>> {
    return this.guard(async () => {
      const removed = await rest
        .internal_t__notification_push_opens()
        .where((f) => f.open_id.eq(id))
        .deleteOne((s) => ({ open_id: s.open_id }));

      return removed ? new OK() : new Failure(PushNotificationOpenError.NotFound);
    });
  }

  #domain(row: PushOpenRow): PushNotificationOpen {
    return {
      id: row.open_id,
      pushNotificationId: row.push_id,
      createdAt: row.created_at,
    };
  }
}
