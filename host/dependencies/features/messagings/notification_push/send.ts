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

import type { InternalTNotificationPushesRow } from "@scribe/host/packages/foundation/database/rest/gen/rows.ts";
import { rest } from "@scribe/host/packages/foundation/database/rest/rest.ts";
import { type Pagination, pagination } from "@scribe/core/contracts/pagination.ts";
import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import { DEFAULT_PAGE_SIZE, type ListOptions } from "./core/list.ts";
import { Repository } from "./core/repository.ts";
import { fcmSend } from "./_fcm_send.ts";

type PushNotificationRow = Pick<
  InternalTNotificationPushesRow,
  | "push_id"
  | "notification_id"
  | "device_id"
  | "status"
  | "error"
  | "created_at"
  | "updated_at"
>;

export type PushNotificationId = number;

export enum PushNotificationStatus {
  Sent = "sent",
  Failed = "failed",
}

export interface PushNotification {
  readonly id: PushNotificationId;
  readonly notificationId: string;
  readonly deviceId: string;
  readonly status: PushNotificationStatus;
  readonly error: string | null;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface PushNotificationContent {
  readonly title: string;
  readonly body: string;
  readonly data?: Record<string, string>;
}

export enum PushNotificationSendError {
  NotFound = "not_found",
  Backend = "backend",
}

export interface PushNotificationSenderService {
  send(
    notificationId: string,
    content: PushNotificationContent,
  ): Promise<Result<PushNotification[], PushNotificationSendError>>;
  get(
    pushId: PushNotificationId,
  ): Promise<Result<PushNotification, PushNotificationSendError>>;
  list(
    notificationId: string,
    options?: ListOptions,
  ): Promise<Result<Pagination<PushNotification>, PushNotificationSendError>>;
  remove(
    pushId: PushNotificationId,
  ): Promise<Result<void, PushNotificationSendError>>;
}

export class PushNotificationSenderFcm extends Repository<PushNotificationSendError>
  implements PushNotificationSenderService {
  protected override get backendError(): PushNotificationSendError {
    return PushNotificationSendError.Backend;
  }

  send(
    notificationId: string,
    content: PushNotificationContent,
  ): Promise<Result<PushNotification[], PushNotificationSendError>> {
    return this.guard(async () => {
      const existing = await rest
        .internal_t__notification_pushes()
        .select((s) => ({
          push_id: s.push_id,
          notification_id: s.notification_id,
          device_id: s.device_id,
          status: s.status,
          error: s.error,
          created_at: s.created_at,
          updated_at: s.updated_at,
        }))
        .where((f) => f.notification_id.eq(notificationId))
        .get();
      if (existing.length > 0) {
        return new OK(existing.map((row) => this.#domain(row)));
      }

      const notification = await rest
        .internal_t__in_app_notifications()
        .select((s) => ({ user_id: s.user_id }))
        .where((f) => f.notification_id.eq(notificationId))
        .getOne();
      if (!notification) return new Failure(PushNotificationSendError.NotFound);

      const rows = await this.#fanOut(notificationId, notification.user_id, content);
      return new OK(rows.map((row) => this.#domain(row)));
    });
  }

  get(
    pushId: PushNotificationId,
  ): Promise<Result<PushNotification, PushNotificationSendError>> {
    return this.guard(async () => {
      const row = await this.#row(pushId);
      return row ? new OK(this.#domain(row)) : new Failure(PushNotificationSendError.NotFound);
    });
  }

  list(
    notificationId: string,
    options?: ListOptions,
  ): Promise<Result<Pagination<PushNotification>, PushNotificationSendError>> {
    return this.guard(async () => {
      const offset = options?.offset ?? 0;
      const size = options?.size ?? DEFAULT_PAGE_SIZE;

      const rows = await rest
        .internal_t__notification_pushes()
        .select((s) => ({
          push_id: s.push_id,
          notification_id: s.notification_id,
          device_id: s.device_id,
          status: s.status,
          error: s.error,
          created_at: s.created_at,
          updated_at: s.updated_at,
        }))
        .where((f) => f.notification_id.eq(notificationId))
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

  remove(
    pushId: PushNotificationId,
  ): Promise<Result<void, PushNotificationSendError>> {
    return this.guard(async () => {
      const removed = await rest
        .internal_t__notification_pushes()
        .where((f) => f.push_id.eq(pushId))
        .deleteOne((s) => ({ push_id: s.push_id }));

      return removed ? new OK() : new Failure(PushNotificationSendError.NotFound);
    });
  }

  async #fanOut(
    notificationId: string,
    userId: string,
    content: PushNotificationContent,
  ): Promise<InternalTNotificationPushesRow[]> {
    const devices = await rest
      .internal_t__app_user_devices()
      .select((s) => ({ id: s.id, notification_token: s.notification_token }))
      .where((f) => f.user_id.eq(userId))
      .get();

    const targets = devices.filter(
      (device): device is typeof device & { notification_token: string } => device.notification_token !== null,
    );

    const settled = await Promise.allSettled(
      targets.map((device) => this.#deliver(notificationId, device.id, device.notification_token, content)),
    );

    const rows: InternalTNotificationPushesRow[] = [];
    for (const outcome of settled) {
      if (outcome.status === "rejected") {
        console.error("[push:send] device task failed:", outcome.reason);
      } else if (outcome.value) {
        rows.push(outcome.value);
      } else {
        console.error("[push:send] insert returned no row for notification:", notificationId);
      }
    }
    return rows;
  }

  async #deliver(
    notificationId: string,
    deviceId: string,
    token: string,
    content: PushNotificationContent,
  ): Promise<InternalTNotificationPushesRow | null> {
    const result = await fcmSend({
      token,
      title: content.title,
      body: content.body,
      data: content.data,
    });

    if (!result.ok && result.deadToken) {
      await rest
        .internal_t__app_user_devices()
        .where((f) => f.id.eq(deviceId))
        .update({ notification_token: null });
    }

    return rest.internal_t__notification_pushes().insertOne({
      notification_id: notificationId,
      device_id: deviceId,
      status: result.ok ? PushNotificationStatus.Sent : PushNotificationStatus.Failed,
      error: result.ok ? null : result.error,
    });
  }

  #row(pushId: PushNotificationId): Promise<InternalTNotificationPushesRow | null> {
    return rest
      .internal_t__notification_pushes()
      .where((f) => f.push_id.eq(pushId))
      .getOne();
  }

  #domain(row: PushNotificationRow): PushNotification {
    return {
      id: row.push_id,
      notificationId: row.notification_id,
      deviceId: row.device_id,
      status: row.status as PushNotificationStatus,
      error: row.error,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
