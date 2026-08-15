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
import type { UpdatePushTemplateInput } from "@scribe/host/dependencies/features/messagings/notification_push/push.ts";
import { ApiContext } from "@scribe/core/kernel/endpoint/api.ts";
import {
  AdminPushIdEndpoint,
  isNotFound,
  isValidName,
  NAME_EXPECTATION,
  objectOrNull,
  trimmedOrNull,
  WRITE_RATE_LIMIT,
} from "./_shared.ts";

export class AdminPushTemplateUpdateEndpoint extends AdminPushIdEndpoint {
  protected rateLimit() {
    return WRITE_RATE_LIMIT;
  }

  protected async run(ctx: ApiContext): Promise<Response> {
    if (!this.validId()) return this.invalidId();

    const body = objectOrNull(ctx.raw());
    if (!body) return this.invalidBody();

    const patch: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = trimmedOrNull(body.name);
      if (!name || !isValidName(name)) return this.invalidField("name", NAME_EXPECTATION);
      patch.name = name;
    }

    if (body.title !== undefined) {
      const title = trimmedOrNull(body.title);
      if (!title) return this.invalidField("title", "a non-empty string");
      patch.title = title;
    }

    if (body.body !== undefined) {
      const text = trimmedOrNull(body.body);
      if (!text) return this.invalidField("body", "a non-empty string");
      patch.body = text;
    }

    if (body.data !== undefined) {
      const data = objectOrNull(body.data);
      if (!data) return this.invalidField("data", "a JSON object");
      patch.data = data;
    }

    if (Object.keys(patch).length === 0) return this.emptyPatch();

    const result = await clients.features.messagings.notificationPush.templates.update(
      this.id,
      patch as UpdatePushTemplateInput,
    );
    if (!result.ok) return this.notFoundOr(isNotFound(result.error));

    return this.response.ok();
  }
}
