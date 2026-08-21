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

import { Env } from "@scribe/host/env.ts";
import { post } from "@scribe/foundation/src/http/mod.ts";
import type { Response as HttpResponse } from "@scribe/foundation/src/http/response/response.ts";
import { fcmAccessToken } from "./_fcm_token.ts";

export type FcmMessage = {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

export type FcmSendResult =
  | { ok: true }
  | { ok: false; error: string; deadToken: boolean };

// https://firebase.google.com/docs/reference/fcm/rest/v1/ErrorCode
const DEAD_TOKEN_ERROR_CODES = new Set([
  "UNREGISTERED",
  "INVALID_ARGUMENT",
  "SENDER_ID_MISMATCH",
]);
const RETRYABLE_STATUSES = new Set([429, 500, 503]);
const RETRY_DELAY_MS = 500;

function fcmErrorCode(body: string): string | null {
  try {
    const parsed = JSON.parse(body);
    return parsed?.error?.details?.[0]?.errorCode ?? parsed?.error?.status ??
      null;
  } catch {
    return null;
  }
}

function send(message: FcmMessage, accessToken: string): Promise<HttpResponse> {
  return post(
    `https://fcm.googleapis.com/v1/projects/${Env.FCM_PROJECT_ID}/messages:send`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token: message.token,
          notification: { title: message.title, body: message.body },
          data: message.data,
        },
      }),
      timeout: 10_000,
    },
  );
}

export async function fcmSend(message: FcmMessage): Promise<FcmSendResult> {
  const accessToken = await fcmAccessToken();
  if (!accessToken) {
    return { ok: false, error: "fcm_auth_failed", deadToken: false };
  }

  try {
    let res = await send(message, accessToken);
    if (!res.ok && RETRYABLE_STATUSES.has(res.statusCode)) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      res = await send(message, accessToken);
    }
    if (res.ok) return { ok: true };

    const body = res.body;
    const errorCode = fcmErrorCode(body);
    return {
      ok: false,
      error: body.slice(0, 500),
      deadToken: errorCode !== null && DEAD_TOKEN_ERROR_CODES.has(errorCode),
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      deadToken: false,
    };
  }
}
