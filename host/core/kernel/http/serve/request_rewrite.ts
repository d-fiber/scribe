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

import { originOf } from "@scribe/core/kernel/http/serve/pathname.ts";

function bytesOnly(bodyBytes: Uint8Array): ArrayBuffer {
  const coversWholeBuffer = bodyBytes.byteOffset === 0 &&
    bodyBytes.byteLength === bodyBytes.buffer.byteLength;

  return coversWholeBuffer
    ? (bodyBytes.buffer as ArrayBuffer)
    : (bodyBytes.slice().buffer as ArrayBuffer);
}

export function rewriteRequest(
  req: Request,
  bodyBytes: Uint8Array | null,
  pathname: string,
): Request {
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body: BodyInit | null =
    hasBody && bodyBytes && bodyBytes.byteLength > 0
      ? bytesOnly(bodyBytes)
      : null;
  return new Request(new URL(pathname || "/", originOf(req.url)), {
    method: req.method,
    headers: req.headers,
    body,
  });
}
