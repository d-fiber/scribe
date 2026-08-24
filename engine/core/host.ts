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

export { forward, serve, serveFunction } from "./kernel/http/serve/mod.ts";
export { logger } from "./kernel/observability/logger.ts";
export { INTERNAL_SERVICES, InternalService } from "./kernel/http/routing/internal_services.ts";
export { resolveIdentity } from "./kernel/identity/middleware.ts";
export { GrantsResolver } from "./runtime/support/ports/grants.ts";
export type { Grants, GrantSource } from "./contracts/grants.ts";

export { cronRegistry } from "@scribe/foundation/lib/src/cron/core/registry.ts";
export { cronRunner } from "@scribe/foundation/lib/src/cron/runner/cron_runner.ts";
export { queueRegistry } from "@scribe/foundation/lib/src/queue/core/registry.ts";
export { queueRunner } from "@scribe/foundation/lib/src/queue/runner/queue_runner.ts";
export { hookRegistry } from "@scribe/foundation/lib/src/hook/core/registry.ts";
export {
  type Extension,
  type ExtensionImporter,
  ExtensionRegistry,
  extensions,
  OptionalExtension,
} from "./runtime/support/extensions/mod.ts";
