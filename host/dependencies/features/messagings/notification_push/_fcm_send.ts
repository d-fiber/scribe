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

function post(message: FcmMessage, accessToken: string): Promise<Response> {
  return fetch(
    `https://fcm.googleapis.com/v1/projects/${Env.FCM_PROJECT_ID}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token: message.token,
          notification: { title: message.title, body: message.body },
          data: message.data,
        },
      }),
      signal: AbortSignal.timeout(10_000),
    },
  );
}

export async function fcmSend(message: FcmMessage): Promise<FcmSendResult> {
  const accessToken = await fcmAccessToken();
  if (!accessToken) {
    return { ok: false, error: "fcm_auth_failed", deadToken: false };
  }

  try {
    let res = await post(message, accessToken);
    if (!res.ok && RETRYABLE_STATUSES.has(res.status)) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      res = await post(message, accessToken);
    }
    if (res.ok) return { ok: true };

    const body = await res.text();
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
