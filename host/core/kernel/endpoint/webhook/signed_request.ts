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

import { RequestScope } from "@scribe/core/runtime/scope.ts";

export const MAX_TIMESTAMP_SKEW_S = 5 * 60;

export interface SignedWebhookRequest {
  readonly id: string;
  readonly timestamp: string;
  readonly candidateSignatures: readonly string[];
  readonly rawBody: string;
}

export function readSignedRequest(): SignedWebhookRequest | null {
  const req = RequestScope.get();
  const bodyBytes = RequestScope.getBodyBytes();

  const id = req.headers.get("webhook-id") ?? "";
  const timestamp = req.headers.get("webhook-timestamp") ?? "";
  const signatureHeader = req.headers.get("webhook-signature") ?? "";
  if (!id || !timestamp || !signatureHeader) return null;

  const candidateSignatures = signatureHeader
    .split(" ")
    .map((entry) => entry.split(",")[1])
    .filter(Boolean);
  if (candidateSignatures.length === 0) return null;

  return {
    id,
    timestamp,
    candidateSignatures,
    rawBody: bodyBytes ? new TextDecoder().decode(bodyBytes) : "",
  };
}

export function isFreshTimestamp(rawTimestamp: string): boolean {
  const seconds = Number(rawTimestamp);
  if (!Number.isFinite(seconds)) return false;

  return Math.abs(Date.now() / 1000 - seconds) <= MAX_TIMESTAMP_SKEW_S;
}
