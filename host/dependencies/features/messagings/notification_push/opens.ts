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

import type { InternalTNotificationPushOpensRow } from "@scribe/foundation/lib/src/database/gen/rows.ts";
import { database } from "@scribe/foundation/lib/src/database/database.ts";
import { Pagination } from "@scribe/alchemy";
import { Failure, Ok, okay, type Result } from "@scribe/alchemy";
import type { PageRequest } from "@scribe/alchemy";
import { DEFAULT_PAGE_SIZE } from "./core/list.ts";
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
    options?: PageRequest,
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
      const row = await database
        .internal_t__notification_push_opens()
        .where((f) => f.open_id.eq(id))
        .getOne();

      return row ? new Ok(this.#domain(row)) : new Failure(PushNotificationOpenError.NotFound);
    });
  }

  list(
    pushId: PushNotificationId,
    options?: PageRequest,
  ): Promise<Result<Pagination<PushNotificationOpen>, PushNotificationOpenError>> {
    return this.guard(async () => {
      const offset = options?.offset ?? 0;
      const size = options?.size ?? DEFAULT_PAGE_SIZE;

      const rows = await database
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

      return new Ok(
        Pagination.of(
          rows.map((row) => this.#domain(row)),
          offset,
          size,
        ),
      );
    });
  }

  record(pushId: PushNotificationId): Promise<Result<void, PushNotificationOpenError>> {
    return this.guard(async () => {
      const row = await database
        .internal_t__notification_push_opens()
        .insertOne({ push_id: pushId });

      return row ? okay : new Failure(PushNotificationOpenError.Backend);
    });
  }

  remove(id: PushNotificationOpenId): Promise<Result<void, PushNotificationOpenError>> {
    return this.guard(async () => {
      const removed = await database
        .internal_t__notification_push_opens()
        .where((f) => f.open_id.eq(id))
        .deleteOne((s) => ({ open_id: s.open_id }));

      return removed ? okay : new Failure(PushNotificationOpenError.NotFound);
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
