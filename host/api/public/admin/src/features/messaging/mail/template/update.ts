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
import type { UpdateEmailTemplateInput } from "@scribe/host/dependencies/features/messagings/mail/mail.ts";
import { ApiContext } from "@scribe/core/kernel/endpoint/api.ts";
import {
  AdminMailIdEndpoint,
  isNotFound,
  isValidName,
  NAME_EXPECTATION,
  objectOrNull,
  trimmedOrNull,
  WRITE_RATE_LIMIT,
} from "./_shared.ts";

export class AdminEmailTemplateUpdateEndpoint extends AdminMailIdEndpoint {
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
      if (!name || !isValidName(name)) {
        return this.invalidField("name", NAME_EXPECTATION);
      }
      patch.name = name;
    }

    if (body.subject !== undefined) {
      const subject = trimmedOrNull(body.subject);
      if (!subject) return this.invalidField("subject", "a non-empty string");
      patch.subject = subject;
    }

    if (body.text !== undefined) {
      const text = trimmedOrNull(body.text);
      if (!text) return this.invalidField("text", "a non-empty string");
      patch.text = text;
    }

    if (body.html !== undefined) {
      if (typeof body.html !== "string") return this.invalidField("html", "a string");
      patch.html = body.html;
    }

    if (Object.keys(patch).length === 0) return this.emptyPatch();

    const found = await clients.features.messagings.mail.templates.getById(this.id);
    if (!found.ok) return this.notFoundOr(isNotFound(found.error));

    const result = await clients.features.messagings.mail.templates.update(
      this.id,
      patch as UpdateEmailTemplateInput,
    );
    if (!result.ok) return this.notFoundOr(isNotFound(result.error));

    return this.response.ok();
  }
}
