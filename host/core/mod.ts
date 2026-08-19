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

export { Failure, OK } from "./contracts/result.ts";
export type { Result } from "./contracts/result.ts";
export { emptyPagination, pagination } from "./contracts/pagination.ts";
export type { Pagination } from "./contracts/pagination.ts";
export { AccountRole, SignOutScope } from "./contracts/account.ts";
export type { Rules, Session, SessionAdmin, SessionUser } from "./contracts/account.ts";

export { ApiEndpoint, Caller } from "./kernel/endpoint/api.ts";
export type { ApiContext, RateLimiter } from "./kernel/endpoint/api.ts";
export { ServiceEndpoint } from "./kernel/endpoint/service.ts";
export { WebhookEndpoint } from "./kernel/endpoint/webhook/mod.ts";
export { Router } from "./kernel/http/routing/router.ts";
export { json, ServerResponse } from "./kernel/http/response/json.ts";
export { RbacIdentity, RequestIdentity } from "./kernel/identity/request_identity.ts";
export { Arr, Nested } from "./kernel/validation/schema.ts";
export type { BodyFromSchema, BodySchema, FormFromSchema, FormSchema } from "./kernel/validation/schema.ts";

export { Queue } from "@scribe/foundation/src/queue/mod.ts";
export { at, Cron, cronExpression, every } from "@scribe/foundation/src/cron/mod.ts";
export { Hook } from "@scribe/foundation/src/hook/mod.ts";
export { Isolate } from "@scribe/foundation/src/isolate/mod.ts";
export { Valkery } from "@scribe/foundation/src/valkery/mod.ts";
export { RequestScope } from "./runtime/scope.ts";
export { RateLimitError, RateLimitScope } from "./runtime/redis/rate_limiter/mod.ts";
export type { RateLimitOptions, RateLimitResult } from "./runtime/redis/rate_limiter/mod.ts";
