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

import { Env } from "@scribe/host/env.ts";
import {
  extensions,
  OptionalExtension,
} from "@scribe/core/runtime/support/extensions/mod.ts";
import { cacheSettings } from "@scribe/core/runtime/support/settings/cache.ts";
import { databaseSettings } from "@scribe/core/runtime/support/settings/database.ts";
import { deviceSettings } from "@scribe/core/runtime/support/settings/device.ts";
import { firewallSettings } from "@scribe/core/runtime/support/settings/firewall.ts";
import { httpSettings } from "@scribe/core/runtime/support/settings/http.ts";
import { identitySettings } from "@scribe/core/runtime/support/settings/identity.ts";
import { queueSettings } from "@scribe/core/runtime/support/settings/queue.ts";
import { storageSettings } from "@scribe/core/runtime/support/settings/storage.ts";
import { workerSettings } from "@scribe/core/runtime/support/settings/worker.ts";
import { EXTENSION_CRON, EXTENSION_QUEUE } from "./extensions.ts";

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

cacheSettings.use({ redisUrl: Env.REDIS_URL });
queueSettings.use({ natsUrl: Env.NATS_URL });
databaseSettings.use({
  restUrl: Env.SUPABASE_REST_INTERNAL_URL,
  anonKey: Env.SUPABASE_ANON_KEY,
  serviceRoleKey: Env.SUPABASE_SERVICE_ROLE_KEY,
});
identitySettings.use({
  authUrl: Env.SUPABASE_AUTH_INTERNAL_URL,
  anonKey: Env.SUPABASE_ANON_KEY,
  serviceRoleKey: Env.SUPABASE_SERVICE_ROLE_KEY,
  jwtSecret: Deno.env.get("JWT_SECRET"),
});
firewallSettings.use({ internalSecret: Env.INTERNAL_SECRET });
deviceSettings.use({ payloadPrivateKeyHex: Env.DEVICE_PAYLOAD_PRIVATE_KEY });
httpSettings.use({ port: Env.PORT, maxInflightBodyBytes: maxInflightBodyBytes() });
storageSettings.use({
  apiUrl: Env.SUPABASE_STORAGE_INTERNAL_URL,
  serviceRoleKey: Env.SUPABASE_SERVICE_ROLE_KEY,
  publicBaseUrl: Env.APP_URL,
  privateBaseUrl: Env.ADMIN_URL,
});

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

extensions.register(
  new OptionalExtension(
    EXTENSION_QUEUE,
    () => import("@app/extensions/event_driven/queue/queue.ts"),
  ),
);

extensions.register(
  new OptionalExtension(
    EXTENSION_CRON,
    () => import("@app/extensions/event_driven/cron/cron.ts"),
  ),
);

/**
 * Hands the ports to the modules the project mounted.
 *
 * `@generated/registrations.ts` imports the `register.ts` of every mounted
 * module, and the CLI writes it from `config.yaml`. That indirection is the
 * whole point: this file wired four modules by name, so adding a fifth meant
 * editing the framework, and a module could not be unmounted without leaving a
 * dangling import behind.
 *
 * Its absence is ordinary rather than an error -- a checkout with no project
 * generated nothing, which is the state of the framework's own tests. The ports
 * then answer as they do when nobody registered: each says so at the first call
 * that needs it, naming itself.
 */
try {
  await import("@generated/registrations.ts");
  // deno-lint-ignore no-empty
} catch {}
