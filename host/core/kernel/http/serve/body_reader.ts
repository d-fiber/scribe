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

/**
 * Reads the whole request body, or `null` once it grows past `maxBytes`.
 *
 * Pass `declaredBytes` when the request announced a content-length: the
 * destination is then allocated once and written through, instead of holding
 * every chunk and copying them into a second buffer of the same size. That
 * second buffer doubles the peak cost of every request that has one.
 *
 * @param declaredBytes - The announced size, which must not be smaller than
 * what the body turns out to be. A body that overruns it is refused the same
 * way as one that overruns `maxBytes`.
 */
export async function readBoundedBody(
  req: Request,
  maxBytes: number,
  declaredBytes: number | null = null,
): Promise<Uint8Array | null> {
  if (!req.body) return new Uint8Array(0);

  const bound = declaredBytes === null ? maxBytes : Math.min(declaredBytes, maxBytes);
  const reader = req.body.getReader();
  const preallocated = declaredBytes === null ? null : new Uint8Array(bound);
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (total + value.byteLength > bound) {
        await reader.cancel().catch(() => {});
        return null;
      }

      if (preallocated !== null) preallocated.set(value, total);
      else chunks.push(value);

      total += value.byteLength;
    }
  } catch (error) {
    console.error("[serve] could not read the request body:", error);
    return new Uint8Array(0);
  }

  return preallocated !== null ? preallocated.subarray(0, total) : joined(chunks, total);
}

function joined(chunks: readonly Uint8Array[], total: number): Uint8Array {
  const bytes = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes;
}
