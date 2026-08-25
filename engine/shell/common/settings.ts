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

import { cacheSettings, databaseSettings, queueSettings, RedisRateLimiters, required } from "@scribe/foundation";
import { deviceSettings } from "@scribe/runtime/support/settings/device.ts";
import { firewallSettings } from "@scribe/runtime/support/settings/firewall.ts";
import { httpSettings } from "@scribe/runtime/support/settings/http.ts";
import { identitySettings } from "@scribe/runtime/support/settings/identity.ts";
import { RateLimiters } from "@scribe/alchemy";
import { workerSettings } from "@scribe/runtime/support/settings/worker.ts";

/**
 * The port the persistent runtime listens on when the deployment names none.
 */
const DEFAULT_PORT = 3000;

/**
 * What the body budget falls back to when the deployment names no figure.
 *
 * This was the compiled-in ceiling before the compose learned to size it, so a
 * rendering made by an older CLI keeps the behaviour it already had instead of
 * losing its budget to a zero.
 */
const DEFAULT_MAX_INFLIGHT_BODY_MB = 256;

function maxInflightBodyBytes(): number {
  const declared = Number(Deno.env.get("API_MAX_INFLIGHT_BODY_MB"));
  const megabytes = Number.isFinite(declared) && declared > 0 ? declared : DEFAULT_MAX_INFLIGHT_BODY_MB;

  return megabytes * 1024 * 1024;
}

cacheSettings.use({ redisUrl: required("REDIS_URL") });
queueSettings.use({ natsUrl: required("NATS_URL") });
databaseSettings.use({
  restUrl: required("SUPABASE_REST_INTERNAL_URL"),
  anonKey: required("SUPABASE_ANON_KEY"),
  serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
});
identitySettings.use({
  authUrl: required("SUPABASE_AUTH_INTERNAL_URL"),
  anonKey: required("SUPABASE_ANON_KEY"),
  serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  jwtSecret: Deno.env.get("JWT_SECRET"),
});
firewallSettings.use({ internalSecret: required("INTERNAL_SECRET") });
deviceSettings.use({ payloadPrivateKeyHex: required("DEVICE_PAYLOAD_PRIVATE_KEY") });
httpSettings.use({ port: Number(Deno.env.get("PORT") ?? DEFAULT_PORT), maxInflightBodyBytes: maxInflightBodyBytes() });

RateLimiters.use(new RedisRateLimiters());

const WORKER_CALLBACK_PORT = 4747;

const WORKER_HANDSHAKE_ATTEMPTS = 10;

const WORKER_HANDSHAKE_DELAY_MS = 1_000;

/**
 * The nodes the gateway routes publicly, as the deployment declares them.
 *
 * Empty when nothing is declared, and empty means the host presumes nothing.
 * It used to fall back to `admin` and `app`, which was a guess about a project
 * it cannot see: a node is named after a folder the project chose, so the two
 * names carried no more truth than any other. A node that declares itself
 * public without appearing here is only warned about; the refusal is reserved
 * for the other direction, a node that declares itself internal while the
 * gateway exposes it.
 */
function publicNodes(): readonly string[] {
  const declared = Deno.env.get("GATEWAY_PUBLIC_NODES");
  if (!declared) return [];

  return declared.split(",").map((name) => name.trim()).filter((name) => name !== "");
}

workerSettings.use({
  endpoint: Deno.env.get("WORKER_ENDPOINT") ?? null,
  callbackUrl: Deno.env.get("WORKER_CALLBACK_URL") ?? null,
  callbackPort: Number(Deno.env.get("WORKER_CALLBACK_PORT") ?? WORKER_CALLBACK_PORT),
  handshakeAttempts: WORKER_HANDSHAKE_ATTEMPTS,
  handshakeDelayMs: WORKER_HANDSHAKE_DELAY_MS,
  publicNodes: publicNodes(),
});

/**
 * Hands the ports to the modules the project mounted.
 *
 * `@generated/registrations.ts` imports the `register.ts` of every mounted
 * module, and the CLI writes it from `config.yaml`. That indirection is the
 * whole point: this file wired four modules by name, so adding a fifth meant
 * editing the framework, and a module could not be unmounted without leaving a
 * dangling import behind.
 *
 * Its absence is ordinary rather than an error: a checkout with no project has
 * nothing to register, and every port then answers as it does when nobody
 * registered, each saying so at the first call that needs it, naming itself.
 *
 * A file that exists and throws while it loads is the opposite, and the two used
 * to be swallowed by the same empty catch. That left all eleven ports unbound
 * without a word: the process boots, listens, answers a health check, and then
 * dies on the first error path that tries to log, because the logger is one of
 * the ports nothing filled. It reads as a healthy start followed by an
 * unexplained exit. So only the absence is quiet, and anything else is said out
 * loud with what it was and where it came from.
 */
try {
  await import("@generated/registrations.ts");
} catch (raised) {
  if (!_isAbsent(raised)) {
    console.error(
      "[shell] @generated/registrations.ts threw while loading, so no module registered its ports.",
      raised,
    );
    throw raised;
  }
}

/**
 * Whether `raised` says the module is not there, rather than that it failed.
 *
 * @remarks
 * Deno answers a specifier it cannot resolve with a `TypeError` naming what it
 * looked for. There is no error class to narrow on, so the message is what tells
 * the two apart, and the test beside this file is what keeps that reading honest.
 *
 * @param raised - Whatever the dynamic import threw.
 * @returns Whether the module was simply absent.
 */
function _isAbsent(raised: unknown): boolean {
  if (!(raised instanceof TypeError)) return false;

  const said = raised.message;
  return said.includes("Module not found") ||
    said.includes("not a dependency") ||
    said.includes("not in import map") ||
    said.includes("Relative import path");
}
