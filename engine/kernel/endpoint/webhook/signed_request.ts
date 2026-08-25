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

import { RequestScope } from "@scribe/runtime/scope.ts";

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
