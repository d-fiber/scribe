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

/**
 * Every `@scribe/*` specifier a sealed engine layer may resolve, written by
 * `deno task gen:workspace` from the `_collection.json` each layer carries.
 *
 * @remarks
 * `.lint/engine-layers.ts` imports this rather than reading a file itself, since a rule never
 * touches the filesystem itself, `ast.ts` says so. Hand-editing this file is pointless, since
 * the next `gen:workspace` overwrites it from the seven `_collection.json` files that are the
 * actual source.
 */
export const LAYER_SPECIFIERS: Record<string, readonly string[]> = {
  "alchemy/": [],
  "engine/contracts/": [
    "@scribe/alchemy",
    "@scribe/alchemy/body",
    "@scribe/alchemy/http",
    "@scribe/alchemy/observe",
    "@scribe/alchemy/route",
    "@scribe/alchemy/server",
    "@scribe/alchemy/test",
    "@scribe/contracts/",
  ],
  "engine/runtime/": [
    "@scribe/alchemy",
    "@scribe/alchemy/body",
    "@scribe/alchemy/http",
    "@scribe/alchemy/observe",
    "@scribe/alchemy/route",
    "@scribe/alchemy/server",
    "@scribe/alchemy/test",
    "@scribe/contracts/",
    "@scribe/runtime/",
  ],
  "engine/kernel/": [
    "@scribe/alchemy",
    "@scribe/alchemy/body",
    "@scribe/alchemy/http",
    "@scribe/alchemy/observe",
    "@scribe/alchemy/route",
    "@scribe/alchemy/server",
    "@scribe/alchemy/test",
    "@scribe/contracts/",
    "@scribe/foundation",
    "@scribe/foundation/cache",
    "@scribe/foundation/cron",
    "@scribe/foundation/database",
    "@scribe/foundation/hook",
    "@scribe/foundation/http",
    "@scribe/foundation/observe",
    "@scribe/foundation/queue",
    "@scribe/foundation/rate_limit",
    "@scribe/foundation/redis",
    "@scribe/foundation/testing",
    "@scribe/foundation/trigger",
    "@scribe/kernel/",
    "@scribe/runtime/",
  ],
  "engine/embedder/": [
    "@scribe/alchemy",
    "@scribe/alchemy/body",
    "@scribe/alchemy/http",
    "@scribe/alchemy/observe",
    "@scribe/alchemy/route",
    "@scribe/alchemy/server",
    "@scribe/alchemy/test",
    "@scribe/auth",
    "@scribe/auth/bans",
    "@scribe/auth/declaration",
    "@scribe/auth/devices",
    "@scribe/auth/identifier",
    "@scribe/auth/password",
    "@scribe/auth/reset_password",
    "@scribe/auth/session",
    "@scribe/auth/sign_in",
    "@scribe/auth/sign_up",
    "@scribe/auth/sms_intent",
    "@scribe/auth/testing",
    "@scribe/contracts/",
    "@scribe/embedder/",
    "@scribe/foundation",
    "@scribe/foundation/cache",
    "@scribe/foundation/cron",
    "@scribe/foundation/database",
    "@scribe/foundation/hook",
    "@scribe/foundation/http",
    "@scribe/foundation/observe",
    "@scribe/foundation/queue",
    "@scribe/foundation/rate_limit",
    "@scribe/foundation/redis",
    "@scribe/foundation/testing",
    "@scribe/foundation/trigger",
    "@scribe/kernel/",
    "@scribe/realtime",
    "@scribe/realtime/testing",
    "@scribe/runtime/",
    "@scribe/sdk",
    "@scribe/sdk/",
    "@scribe/search",
    "@scribe/search/testing",
    "@scribe/storage",
    "@scribe/storage/testing",
  ],
  "engine/testing/": [
    "@scribe/alchemy",
    "@scribe/alchemy/body",
    "@scribe/alchemy/http",
    "@scribe/alchemy/observe",
    "@scribe/alchemy/route",
    "@scribe/alchemy/server",
    "@scribe/alchemy/test",
    "@scribe/contracts/",
    "@scribe/foundation",
    "@scribe/foundation/cache",
    "@scribe/foundation/cron",
    "@scribe/foundation/database",
    "@scribe/foundation/hook",
    "@scribe/foundation/http",
    "@scribe/foundation/observe",
    "@scribe/foundation/queue",
    "@scribe/foundation/rate_limit",
    "@scribe/foundation/redis",
    "@scribe/foundation/testing",
    "@scribe/foundation/trigger",
    "@scribe/runtime/",
    "@scribe/testing/",
  ],
  "engine/shell/": [
    "@scribe/alchemy",
    "@scribe/alchemy/body",
    "@scribe/alchemy/http",
    "@scribe/alchemy/observe",
    "@scribe/alchemy/route",
    "@scribe/alchemy/server",
    "@scribe/alchemy/test",
    "@scribe/contracts/",
    "@scribe/embedder/",
    "@scribe/foundation",
    "@scribe/foundation/cache",
    "@scribe/foundation/cron",
    "@scribe/foundation/database",
    "@scribe/foundation/hook",
    "@scribe/foundation/http",
    "@scribe/foundation/observe",
    "@scribe/foundation/queue",
    "@scribe/foundation/rate_limit",
    "@scribe/foundation/redis",
    "@scribe/foundation/testing",
    "@scribe/foundation/trigger",
    "@scribe/kernel/",
    "@scribe/runtime/",
    "@scribe/sdk",
    "@scribe/sdk/",
    "@scribe/shell/",
  ],
};
