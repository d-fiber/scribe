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

import { cacheSettings } from "@scribe/foundation/lib/src/valkery/settings.ts";
import { databaseSettings } from "@scribe/foundation/lib/src/database/settings.ts";
import { deviceSettings } from "@scribe/core/runtime/support/settings/device.ts";
import { firewallSettings } from "@scribe/core/runtime/support/settings/firewall.ts";
import { httpSettings } from "@scribe/core/runtime/support/settings/http.ts";
import { identitySettings } from "@scribe/core/runtime/support/settings/identity.ts";
import { queueSettings } from "@scribe/foundation/lib/src/queue/settings.ts";
import { searchSettings } from "@scribe/search/src/settings.ts";
import { authSettings } from "@scribe/auth/src/settings.ts";
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
  authSettings.use({
    jwtSecret: env("JWT_SECRET", "test-jwt-secret"),
    pendingTokenSecret: env("PENDING_TOKEN_SECRET", "test-pending-token-secret"),
    googleClientId: env("GOOGLE_CLIENT_ID", ""),
    googleClientSecret: env("GOOGLE_CLIENT_SECRET", ""),
    appleClientId: env("APPLE_CLIENT_ID", ""),
    appleClientSecret: env("APPLE_CLIENT_SECRET", ""),
    twilioAccountSid: env("TWILIO_ACCOUNT_SID", ""),
    twilioAuthToken: env("TWILIO_AUTH_TOKEN", ""),
    twilioMessageServiceSid: env("TWILIO_MESSAGE_SERVICE_SID", ""),
  });
  storageSettings.use({
    apiUrl: env("SUPABASE_STORAGE_INTERNAL_URL", "http://localhost:5000"),
    serviceRoleKey: env("SUPABASE_SERVICE_ROLE_KEY", "service"),
    publicBaseUrl: env("APP_URL", "http://localhost"),
    privateBaseUrl: env("ADMIN_URL", "http://localhost"),
  });
  searchSettings.use({
    clusterUrl: env("OPENSEARCH_URL", "http://localhost:9200"),
  });
}

installTestSettings();
