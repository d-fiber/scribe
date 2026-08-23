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

export { Failure, Ok } from "@scribe/alchemy";
export type { Result } from "@scribe/alchemy";
export { Pagination } from "@scribe/alchemy";

export { ApiEndpoint } from "./kernel/endpoint/api.ts";
export type { ApiContext } from "./kernel/endpoint/api.ts";
export { ServiceEndpoint } from "./kernel/endpoint/service.ts";
export { WebhookEndpoint } from "./kernel/endpoint/webhook/mod.ts";
export { Router } from "./kernel/http/routing/router.ts";
export { jsonReply, ServerResponse } from "@scribe/alchemy/route";
export { RbacIdentity, RequestIdentity } from "./kernel/identity/request_identity.ts";
export { ListOf, Nested, Required } from "@scribe/alchemy";
export type { BodyFromSchema, BodySchema, FormFromSchema, FormSchema } from "@scribe/alchemy";

export { Queue } from "@scribe/foundation/lib/src/queue/mod.ts";
export { at, Cron, cronExpression, every } from "@scribe/foundation/lib/src/cron/mod.ts";
export { Hook } from "@scribe/foundation/lib/src/hook/mod.ts";
export { Isolate } from "@scribe/foundation/lib/src/isolate/mod.ts";
export { Valkery } from "@scribe/foundation/lib/src/valkery/mod.ts";
export { RequestScope } from "./runtime/scope.ts";
