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

import {
  type DynamicLink,
  DynamicLinkError,
  type DynamicLinkPayload,
  parseDynamicLinkPayload,
} from "@scribe/host/dependencies/features/devops/dynamic-links/dynamic-links.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { ApiEndpoint, Caller } from "@scribe/core/kernel/endpoint/api.ts";
import { idOrNull, invalidIdMessage } from "../_shared.ts";

export const READ_RATE_LIMIT = {
  limit: 60,
  window: Time.minutes(1),
  penalty: Time.minutes(1),
  maxPenalty: Time.minutes(10),
};

export const WRITE_RATE_LIMIT = {
  limit: 30,
  window: Time.minutes(5),
  penalty: Time.minutes(5),
  maxPenalty: Time.minutes(30),
};

export function payload(link: DynamicLink) {
  return {
    id: link.id,
    slug: link.slug,
    payload: link.payload,
    expires_at: link.expiresAt,
    created_at: link.createdAt,
    updated_at: link.updatedAt,
  };
}

export function payloadOrNull(raw: unknown): DynamicLinkPayload | null {
  return parseDynamicLinkPayload(raw);
}

export function expiresAtOrInvalid(raw: unknown): number | null | undefined {
  if (raw === null) return null;
  if (typeof raw !== "number" || !Number.isSafeInteger(raw) || raw <= 0) return undefined;
  return raw;
}

export abstract class AdminDynamicLinkEndpoint extends ApiEndpoint {
  protected access(): Caller {
    return Caller.Admin;
  }

  protected invalidBody(): Response {
    return this.response.badRequest();
  }

  protected invalidPayload(): Response {
    return this.response.badRequest({
      code: "invalid_payload",
      message: "`payload` must be a readable dynamic-link payload (deeplink or redirect).",
    });
  }

  protected invalidExpiresAt(): Response {
    return this.response.badRequest({
      code: "invalid_expires_at",
      message: "`expires_at` must be a positive epoch in milliseconds, or null.",
    });
  }

  protected failure(error: DynamicLinkError): Response {
    switch (error) {
      case DynamicLinkError.NotFound:
        return this.response.notFound();
      case DynamicLinkError.Expired:
        return this.response.conflict({
          code: "link_expired",
          message: "This link has expired. Patch `expires_at` to bring it back.",
        });
      case DynamicLinkError.MalformedPayload:
        return this.response.conflict({
          code: "malformed_payload",
          message: "The stored payload of this link is unreadable.",
        });
      case DynamicLinkError.SlugConflict:
        return this.response.conflict({
          code: "slug_conflict",
          message: "No free slug could be generated. Retry.",
        });
      default:
        return this.response.unexpected();
    }
  }
}

export abstract class AdminDynamicLinkIdEndpoint extends AdminDynamicLinkEndpoint {
  protected readonly id: number | null;

  constructor(rawId: string) {
    super();
    this.id = idOrNull(rawId);
  }

  protected invalidId(): Response {
    return this.response.badRequest({
      code: "invalid_id",
      message: invalidIdMessage(),
    });
  }
}
