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

import { MAX_BODY_BYTES, MAX_FORM_BYTES } from "@scribe/core/runtime/http/limits.ts";

/**
 * The ceiling on request body bytes this process will hold at once.
 *
 * It covers every body, not only uploads: a small body admitted for free is
 * still a buffer the process has to keep until the handler answers, and
 * thousands of them at 64 KiB apiece take the process past its container long
 * before any single upload does.
 */
const MAX_INFLIGHT_BODY_BYTES = 256 * 1024 * 1024;

let inflightBytes = 0;

export interface BodyAdmission {
  readonly reservedBytes: number;
  readonly maxBodyBytes: number;

  /**
   * The size this request declared, or `null` when it declared nothing usable.
   *
   * The reader uses it to allocate the destination once instead of collecting
   * chunks and copying them into a second buffer of the same size.
   */
  readonly declaredBytes: number | null;
}

/**
 * Reserves room for this request's body, or `null` when the process is full.
 *
 * A refusal is a 503, not a rejection of the request itself: the caller may
 * retry once other bodies have been released.
 */
export function admitBody(req: Request): BodyAdmission | null {
  const ceiling = isMultipart(req) ? MAX_FORM_BYTES : MAX_BODY_BYTES;
  const declared = declaredSize(req, ceiling);
  const size = declared ?? ceiling;

  if (inflightBytes + size > MAX_INFLIGHT_BODY_BYTES) return null;

  inflightBytes += size;
  return { reservedBytes: size, maxBodyBytes: size, declaredBytes: declared };
}

export function releaseBody(admission: BodyAdmission): void {
  inflightBytes -= admission.reservedBytes;
}

export function inflightBodyBytes(): number {
  return inflightBytes;
}

function isMultipart(req: Request): boolean {
  return req.headers
    .get("content-type")
    ?.toLowerCase()
    .includes("multipart/form-data") ?? false;
}

/**
 * What this request says it will send, or `null` when it says nothing usable.
 *
 * A declared size doubles as the read bound, so a content-length that lies low
 * cannot buy a small reservation and then send more than it reserved.
 */
function declaredSize(req: Request, ceiling: number): number | null {
  const declared = Number(req.headers.get("content-length") ?? 0);

  return Number.isFinite(declared) && declared > 0 && declared <= ceiling
    ? declared
    : null;
}
