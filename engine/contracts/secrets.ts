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
 * The environment variables this framework owns, and hands to nobody.
 *
 * @remarks
 * They are the credentials of the deployment itself: what tokens are signed with, what bypasses
 * row level security, what proves an internal call, what opens a device payload, and the addresses
 * that carry a password in them. A worker is handed the identity already resolved and reaches
 * everything else through a capability, so it needs none of them.
 *
 * It is a deny list and not the allow list `embedder/control/invocation.ts` keeps for headers, and
 * the difference is not a preference. A project's own functions read their own variables, and this
 * framework has no way of knowing which: an allow list here would be the framework deciding what a
 * project may configure. What it can decide is that its own secrets are not part of that.
 *
 * **A framework variable added anywhere belongs here too.** Nothing enforces it, which is why the
 * list sits in `contracts/` rather than beside one of its readers: it is the one place both the
 * composition root and the boundary that withholds them can name.
 */
export const FRAMEWORK_SECRETS: ReadonlySet<string> = new Set([
  "ANON_KEY",
  "AUTHENTICATOR_PASSWORD",
  "AUTH_ADMIN_PASSWORD",
  "AUTH_INTERNAL_URL",
  "DB_ENC_KEY",
  "DEVICE_PAYLOAD_PRIVATE_KEY",
  "INTERNAL_SECRET",
  "JWT_SECRET",
  "MIGRATOR_PASSWORD",
  "NATS_PASSWORD",
  "NATS_URL",
  "PENDING_TOKEN_SECRET",
  "PGBOUNCER_PASSWORD",
  "POSTGRES_PASSWORD",
  "REDIS_PASSWORD",
  "REDIS_URL",
  "REST_INTERNAL_URL",
  "SECRET_KEY_BASE",
  "SERVICE_KEY",
  "SMTP_ENCRYPTION_KEY",
  "STORAGE_ADMIN_PASSWORD",
]);
