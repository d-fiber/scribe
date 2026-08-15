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
import { ApiContext, ApiEndpoint, Caller } from "@scribe/core/kernel/endpoint/api.ts";

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

const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 100;

export interface PageRequest {
  readonly offset: number;
  readonly size: number;
}

export function page(ctx: ApiContext): PageRequest {
  const offset = Math.max(0, Math.floor(Number(ctx.query("offset")) || 0));
  const requested = Math.floor(Number(ctx.query("size")) || DEFAULT_PAGE_SIZE);
  return { offset, size: Math.min(Math.max(1, requested), MAX_PAGE_SIZE) };
}

export function objectOrNull(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export function trimmedOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function positiveIntOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export abstract class AdminPushEndpoint extends ApiEndpoint {
  protected access(): Caller {
    return Caller.Admin;
  }

  protected invalidBody(): Response {
    return this.response.badRequest();
  }

  protected invalidId(): Response {
    return this.response.badRequest({
      code: "invalid_id",
      message: "The identifier must be a positive integer.",
    });
  }

  protected emptyPatch(): Response {
    return this.response.badRequest({
      code: "empty_patch",
      message: "Provide at least one field to update.",
    });
  }

  protected invalidField(field: string, expected: string): Response {
    return this.response.badRequest({
      code: `invalid_${field}`,
      message: `\`${field}\` must be ${expected}.`,
    });
  }

  protected notFoundOr(isNotFound: boolean): Response {
    return isNotFound ? this.response.notFound() : this.response.unexpected();
  }
}

export abstract class AdminPushIdEndpoint extends AdminPushEndpoint {
  protected readonly id: number;

  constructor(raw: string) {
    super();
    this.id = Number(raw);
  }

  protected validId(): boolean {
    return Number.isSafeInteger(this.id) && this.id > 0;
  }
}
