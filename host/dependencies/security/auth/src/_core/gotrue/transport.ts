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

import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import { identitySettings } from "@scribe/core/runtime/support/settings/identity.ts";

export type AuthError = { code: string; message: string };

export interface GoTrueIdentity {
  identity_id: string;
  id: string;
  user_id: string;
  provider: string;
  identity_data?: { email?: string; sub?: string; [key: string]: unknown };
  created_at: string | null;
  last_sign_in_at: string | null;
}

export interface GoTrueUser {
  id: string;
  aud: string;
  role: string;
  email: string | null;
  phone: string | null;
  email_confirmed_at: string | null;
  phone_confirmed_at: string | null;
  confirmed_at: string | null;
  last_sign_in_at: string | null;
  app_metadata: { provider?: string; role?: string; [key: string]: unknown };
  user_metadata: Record<string, unknown>;
  identities: GoTrueIdentity[];
  created_at: string;
  updated_at: string;
}

export interface GoTrueSessionResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: GoTrueUser;
}

export function authUrl(): string {
  return identitySettings.get().authUrl;
}

export function anonHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    apikey: identitySettings.get().anonKey,
  };
}

export function adminHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    apikey: identitySettings.get().serviceRoleKey,
    Authorization: `Bearer ${identitySettings.get().serviceRoleKey}`,
  };
}

export function userHeaders(jwt: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    apikey: identitySettings.get().anonKey,
    Authorization: `Bearer ${jwt}`,
  };
}

export async function parseError(res: Response): Promise<AuthError> {
  try {
    const body = await res.json();
    return {
      code: body.error_code ?? body.error ?? "unexpected_error",
      message: body.msg ?? body.error_description ?? "Unexpected error",
    };
  } catch {
    return { code: "unexpected_error", message: "Unexpected error" };
  }
}

export async function requestAuth<T>(
  url: string,
  init: RequestInit,
): Promise<Result<T, AuthError>> {
  const res = await fetch(url, init);
  if (!res.ok) return new Failure(await parseError(res));
  return new OK((await res.json()) as T);
}

export async function requestAuthVoid(
  url: string,
  init: RequestInit,
): Promise<Result<void, AuthError>> {
  const res = await fetch(url, init);
  if (!res.ok) return new Failure(await parseError(res));
  return new OK();
}
