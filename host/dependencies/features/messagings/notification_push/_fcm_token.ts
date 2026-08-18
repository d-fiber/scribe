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
import { Valkery } from "@scribe/foundation/src/valkery/valkery.ts";
import { Env } from "@scribe/host/env.ts";
import { importPKCS8, SignJWT } from "jose";

const _TOKEN_URL = "https://oauth2.googleapis.com/token";
const _SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

const _cache = new Valkery<string | null>({ key: "fcm:token", ttl: Time.seconds(3000) });

async function _mint(): Promise<string | null> {
  try {
    const privateKey = await importPKCS8(
      Env.FCM_PRIVATE_KEY.replace(/\\n/g, "\n"),
      "RS256",
    );
    const now = Math.floor(Date.now() / 1000);
    const assertion = await new SignJWT({ scope: _SCOPE })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer(Env.FCM_CLIENT_EMAIL)
      .setSubject(Env.FCM_CLIENT_EMAIL)
      .setAudience(_TOKEN_URL)
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(privateKey);

    const res = await fetch(_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    return typeof data.access_token === "string" ? data.access_token : null;
  } catch {
    return null;
  }
}

export function fcmAccessToken(): Promise<string | null> {
  return _cache.upsert("access_token", _mint);
}
