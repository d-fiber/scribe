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

const MAX_INFLIGHT_UPLOAD_BYTES = 256 * 1024 * 1024;

let inflightBytes = 0;

export interface UploadAdmission {
  readonly reservedBytes: number;
  readonly maxBodyBytes: number;
}

export function admitUpload(req: Request): UploadAdmission | null {
  if (!isMultipart(req)) {
    return { reservedBytes: 0, maxBodyBytes: MAX_BODY_BYTES };
  }

  const size = declaredUploadSize(req);
  if (inflightBytes + size > MAX_INFLIGHT_UPLOAD_BYTES) return null;

  inflightBytes += size;
  return { reservedBytes: size, maxBodyBytes: size };
}

export function releaseUpload(admission: UploadAdmission): void {
  inflightBytes -= admission.reservedBytes;
}

export function inflightUploadBytes(): number {
  return inflightBytes;
}

function isMultipart(req: Request): boolean {
  return req.headers
    .get("content-type")
    ?.toLowerCase()
    .includes("multipart/form-data") ?? false;
}

function declaredUploadSize(req: Request): number {
  const declared = Number(req.headers.get("content-length") ?? 0);

  return Number.isFinite(declared) && declared > 0 && declared <= MAX_FORM_BYTES
    ? declared
    : MAX_FORM_BYTES;
}
