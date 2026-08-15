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

import { redactIfJson } from "../redaction.ts";

const PREVIEW_BYTES_THRESHOLD = 8_192;
const PREVIEW_CHARS_THRESHOLD = 500;
const PREVIEW_EDGE_CHARS = 250;

export async function previewOf(response: Response): Promise<string> {
  if (response.status < 400) return "";

  const declaredBytes = Number(response.headers.get("content-length") ?? 0);
  if (declaredBytes > PREVIEW_BYTES_THRESHOLD) return `[${declaredBytes} bytes]`;

  const text = redactIfJson(await response.clone().text());
  return text.length > PREVIEW_CHARS_THRESHOLD ? elided(text) : text;
}

function elided(text: string): string {
  const head = text.slice(0, PREVIEW_EDGE_CHARS);
  const tail = text.slice(-PREVIEW_EDGE_CHARS);
  return `${head}...${tail}`;
}
