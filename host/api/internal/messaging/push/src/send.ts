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

import { clients } from "@scribe/host/dependencies/clients.ts";
import type { PushNotificationContent } from "@scribe/host/dependencies/features/messagings/notification_push/push.ts";
import { PushNotificationStatus } from "@scribe/host/dependencies/features/messagings/notification_push/push.ts";
import { Required } from "@scribe/core/kernel/validation/schema.ts";
import { ApiContext, ServiceEndpoint } from "@scribe/core/kernel/endpoint/service.ts";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

function content(type: string): PushNotificationContent | null {
  switch (type) {
    case "welcome":
      return {
        title: "Bienvenue sur Poppin",
        body: "Découvre les meilleurs bons plans près de chez toi.",
        data: { type },
      };
    default:
      return null;
  }
}

export class PushSendEndpoint extends ServiceEndpoint {
  protected run(ctx: ApiContext): Response {
    const body = ctx.body({
      notification_id: Required(String),
      type: Required(String),
    });
    if (!body) return this.response.badRequest();

    const { notification_id, type } = body;

    const c = content(type);
    if (!c) return this.response.ok();

    EdgeRuntime.waitUntil(
      (async () => {
        const sent = await clients.features.messagings.notificationPush.push.send(
          notification_id,
          c,
        );
        if (
          !sent.ok ||
          sent.data.length === 0 ||
          sent.data.every((r) => r.status === PushNotificationStatus.Failed)
        ) {
          console.error(
            "[push/send] failed to send for notification:",
            notification_id,
          );
        }
      })(),
    );

    return this.response.ok();
  }
}
