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

import { assertEquals } from "@std/assert";
import { base64, base64Url, hex } from "@scribe/alchemy";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function referenceHexEncode(view: Uint8Array): string {
  return Array.from(view).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function referenceHexDecode(encoded: string): Uint8Array {
  if (encoded.length % 2 !== 0 || !/^[0-9a-f]*$/.test(encoded)) throw new Error("refused");
  return new Uint8Array((encoded.match(/.{2}/g) ?? []).map((byte) => parseInt(byte, 16)));
}

function referenceBase64Decode(encoded: string): Uint8Array {
  const padded = /^[^=]*={0,2}$/.test(encoded) && encoded.length % 4 === 0;
  if (!padded && encoded.includes("=")) throw new Error("refused");

  const trimmed = encoded.replace(/=+$/, "");
  const bytes: number[] = [];
  let bits = 0;
  let held = 0;

  for (const character of [...trimmed]) {
    const at = ALPHABET.indexOf(character);
    if (at === -1) throw new Error("refused");
    held = (held << 6) | at;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((held >> bits) & 0xff);
    }
  }

  if (bits > 0 && (held & ((1 << bits) - 1)) !== 0) throw new Error("refused");
  return new Uint8Array(bytes);
}

function outcome<T>(call: () => T): { ok: true; value: T } | { ok: false } {
  try {
    return { ok: true, value: call() };
  } catch {
    return { ok: false };
  }
}

function agrees<T>(mine: () => T, reference: () => T, about: string): void {
  const held = outcome(mine);
  const expected = outcome(reference);

  assertEquals(held.ok, expected.ok, `${about}: one accepted what the other refused`);
  if (held.ok && expected.ok) assertEquals(held.value, expected.value, `${about}: the two answered differently`);
}

const CORNERS = [
  "",
  "=",
  "QQ==",
  "QR==",
  "QV==",
  "A=A=",
  "AA==A",
  "++//",
  "--__",
  "eAAA",
  "deadbeef",
  "DEADBEEF",
  "abc",
  "0f",
  "0F",
  "zz",
];

Deno.test("writing bytes as hexadecimal answers what the loop it replaced answered", () => {
  let compared = 0;
  for (let length = 0; length <= 64; length++) {
    const view = new Uint8Array(length);
    for (let at = 0; at < length; at++) view[at] = (at * 37 + length * 11) & 0xff;

    assertEquals(hex.encode(view), referenceHexEncode(view), `${length} bytes were written differently`);
    compared++;
  }

  const every = new Uint8Array(256);
  for (let byte = 0; byte < 256; byte++) every[byte] = byte;
  assertEquals(hex.encode(every), referenceHexEncode(every), "one of the 256 byte values is written differently");

  assertEquals(compared, 65);
});

Deno.test("reading hexadecimal agrees with the pattern it replaced, refusals included", () => {
  const corpus: string[] = [...CORNERS];
  for (let seed = 0; seed < 2_000; seed++) {
    const source = "0123456789abcdefABCDEF xyz=";
    let written = "";
    for (let at = 0; at < (seed % 9); at++) written += source[(seed * 31 + at * 7) % source.length];
    corpus.push(written);
  }

  for (const encoded of corpus) {
    agrees(() => hex.decode(encoded), () => referenceHexDecode(encoded), `hex.decode(${JSON.stringify(encoded)})`);
  }

  assertEquals(corpus.length, 2_016);
});

Deno.test("reading base64 agrees with the walk it replaced, refusals included", () => {
  const corpus: string[] = [...CORNERS];
  for (let seed = 0; seed < 3_000; seed++) {
    const source = `${ALPHABET}=-_!é`;
    let written = "";
    for (let at = 0; at < (seed % 13); at++) written += source[(seed * 17 + at * 5) % source.length];
    corpus.push(written);
  }

  for (const encoded of corpus) {
    agrees(
      () => base64.decode(encoded),
      () => referenceBase64Decode(encoded),
      `base64.decode(${JSON.stringify(encoded)})`,
    );
  }

  assertEquals(corpus.length, 3_016);
});

Deno.test("every byte string survives a round trip through all three codecs", () => {
  for (let length = 0; length <= 96; length++) {
    const view = new Uint8Array(length);
    for (let at = 0; at < length; at++) view[at] = (at * 53 + length * 29) & 0xff;

    assertEquals(hex.decode(hex.encode(view)), view, `${length} bytes did not survive hexadecimal`);
    assertEquals(base64.decode(base64.encode(view)), view, `${length} bytes did not survive base64`);
    assertEquals(base64Url.decode(base64Url.encode(view)), view, `${length} bytes did not survive base64url`);
  }
});
