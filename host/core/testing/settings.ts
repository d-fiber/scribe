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

import { cacheSettings } from "@scribe/foundation/src/valkery/settings.ts";
import { databaseSettings } from "@scribe/foundation/src/database/settings.ts";
import { deviceSettings } from "@scribe/core/runtime/support/settings/device.ts";
import { firewallSettings } from "@scribe/core/runtime/support/settings/firewall.ts";
import { httpSettings } from "@scribe/core/runtime/support/settings/http.ts";
import { identitySettings } from "@scribe/core/runtime/support/settings/identity.ts";
import { queueSettings } from "@scribe/foundation/src/queue/settings.ts";
import { storageSettings } from "@scribe/storage/src/settings.ts";

function env(key: string, fallback: string): string {
  return Deno.env.get(key) ?? fallback;
}

export function installTestSettings(): void {
  if (cacheSettings.configured) return;

  cacheSettings.use({ redisUrl: env("REDIS_URL", "redis://localhost:6379") });
  queueSettings.use({ natsUrl: env("NATS_URL", "nats://localhost:4222") });
  databaseSettings.use({
    restUrl: env("SUPABASE_REST_INTERNAL_URL", "http://localhost:3000"),
    anonKey: env("SUPABASE_ANON_KEY", "anon"),
    serviceRoleKey: env("SUPABASE_SERVICE_ROLE_KEY", "service"),
  });
  identitySettings.use({
    authUrl: env("SUPABASE_AUTH_INTERNAL_URL", "http://localhost:9999"),
    anonKey: env("SUPABASE_ANON_KEY", "anon"),
    serviceRoleKey: env("SUPABASE_SERVICE_ROLE_KEY", "service"),
    jwtSecret: Deno.env.get("JWT_SECRET"),
  });
  firewallSettings.use({ internalSecret: env("INTERNAL_SECRET", "internal") });
  deviceSettings.use({
    payloadPrivateKeyHex: env("DEVICE_PAYLOAD_PRIVATE_KEY", ""),
  });
  httpSettings.use({
    port: Number(env("PORT", "3000")),
    maxInflightBodyBytes: Number(env("API_MAX_INFLIGHT_BODY_MB", "256")) * 1024 * 1024,
  });
  storageSettings.use({
    apiUrl: env("SUPABASE_STORAGE_INTERNAL_URL", "http://localhost:5000"),
    serviceRoleKey: env("SUPABASE_SERVICE_ROLE_KEY", "service"),
    publicBaseUrl: env("APP_URL", "http://localhost"),
    privateBaseUrl: env("ADMIN_URL", "http://localhost"),
  });
}

installTestSettings();
