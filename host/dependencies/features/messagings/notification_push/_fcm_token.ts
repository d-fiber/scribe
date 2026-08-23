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

import { Duration } from "@scribe/alchemy";
import { post } from "@scribe/foundation/lib/src/http/mod.ts";
import { Valkery } from "@scribe/foundation/lib/src/valkery/valkery.ts";
import { Env } from "@scribe/host/env.ts";
import { importPKCS8, SignJWT } from "jose";

const _TOKEN_URL = "https://oauth2.googleapis.com/token";
const _SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

const _cache = new Valkery<string | null>({ key: "fcm:token", ttl: Duration.seconds(3000) });

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

    const res = await post(_TOKEN_URL, {
      body: {
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      },
      timeout: Duration.seconds(5),
    });
    if (!res.ok) return null;

    const data = res.json<{ access_token?: unknown }>();
    return typeof data.access_token === "string" ? data.access_token : null;
  } catch {
    return null;
  }
}

export function fcmAccessToken(): Promise<string | null> {
  return _cache.upsert("access_token", _mint);
}
