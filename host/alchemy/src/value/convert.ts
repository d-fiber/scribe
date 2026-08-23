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

import { describeText, FormatException } from "../error/format_exception.ts";

/** How many characters one byte takes when written in hexadecimal. */
const PER_BYTE = 2;

/**
 * Something that writes a value one way and reads it back the other.
 *
 * @remarks
 * The pair is declared together on purpose. A writer and a reader living apart drift, and the day
 * one of them learns a case the other does not, what was written stops being readable by the only
 * thing meant to read it.
 *
 * @typeParam S - What the value is, decoded.
 * @typeParam T - What it becomes, encoded.
 */
export interface Codec<S, T> {
  /** `input` written the encoded way. */
  encode(input: S): T;

  /** What `encoded` holds, read back. */
  decode(encoded: T): S;
}

/**
 * Bytes written in hexadecimal, two lowercase characters per byte.
 *
 * @remarks
 * It is how a byte string is carried anywhere it has to survive being read by a person or written
 * into a column: a digest, a token, a signature.
 *
 * @example
 * ```ts
 * const written = hex.encode(digest);
 * const read = hex.decode(written);
 * ```
 */
export const hex: Codec<Uint8Array, string> = {
  encode(input: Uint8Array | ArrayBuffer): string {
    const view = input instanceof Uint8Array ? input : new Uint8Array(input);
    return Array.from(view)
      .map((byte) => byte.toString(16).padStart(PER_BYTE, "0"))
      .join("");
  },

  /**
   * @remarks
   * Only what {@link encode} writes is read back: lower case, two characters per byte. Accepting
   * upper case as well would make `DEADBEEF` and `deadbeef` two texts for one value, and anything
   * keyed on the text, a cache entry or a table of digests already seen, would hold both.
   *
   * @throws {FormatException} When `encoded` is not lower case hexadecimal, or holds an odd number
   * of characters.
   */
  decode(encoded: string): Uint8Array<ArrayBuffer> {
    if (encoded.length % PER_BYTE !== 0 || !/^[0-9a-f]*$/.test(encoded)) {
      throw new FormatException(`Expected hexadecimal, two characters per byte. ${describeText(encoded.length, null)}`);
    }
    return new Uint8Array((encoded.match(/.{2}/g) ?? []).map((byte) => parseInt(byte, 16)));
  },
};

/**
 * Text written as its bytes, and read back from them.
 *
 * @remarks
 * It is the encoding everything here uses. A caller rarely names it: a body arrives as bytes and
 * leaves as bytes, and this is what stands between them and a string.
 */
export const utf8: Codec<string, Uint8Array> = {
  encode(input: string): Uint8Array {
    return new TextEncoder().encode(input);
  },

  /** @throws {FormatException} When `encoded` holds bytes that spell nothing. */
  decode(encoded: Uint8Array): string {
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(encoded);
    } catch {
      throw new FormatException("Expected utf-8 text.");
    }
  },
};

/** The alphabet base64 writes, in the order the specification gives it. */
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** How many bits one base64 character carries. */
const PER_CHARACTER = 6;

/**
 * Bytes written in base64, padded.
 *
 * @remarks
 * It is what carries bytes through anything that only accepts text: a header, a JSON field, a
 * column declared as text.
 */
export const base64: Codec<Uint8Array, string> = {
  encode(input: Uint8Array): string {
    let bits = 0;
    let held = 0;
    let written = "";

    for (const byte of input) {
      held = (held << 8) | byte;
      bits += 8;
      while (bits >= PER_CHARACTER) {
        bits -= PER_CHARACTER;
        written += ALPHABET[(held >> bits) & 0b111111];
      }
    }
    if (bits > 0) written += ALPHABET[(held << (PER_CHARACTER - bits)) & 0b111111];
    while (written.length % 4 !== 0) written += "=";

    return written;
  },

  /**
   * @remarks
   * One text, one value. The padding has to be where {@link encode} puts it, and the bits left over
   * at the end have to be the zeroes it wrote: `QQ==`, `QR` and `QV` all spell the byte 65, and
   * taking all three used to mean a token had three texts. Anything keyed on the text, a guard
   * against a replay above all, held one of them and let the other two through.
   *
   * @throws {FormatException} When `encoded` is not base64, is padded somewhere else than the end,
   * or carries bits past the last whole byte.
   */
  decode(encoded: string): Uint8Array<ArrayBuffer> {
    const padded = /^[^=]*={0,2}$/.test(encoded) && encoded.length % 4 === 0;
    if (!padded && encoded.includes("=")) {
      throw new FormatException(
        `Expected base64 padded to a multiple of four. ${describeText(encoded.length, encoded.indexOf("="))}`,
      );
    }

    const trimmed = encoded.replace(/=+$/, "");
    const bytes: number[] = [];
    let bits = 0;
    let held = 0;

    for (const [position, character] of [...trimmed].entries()) {
      const at = ALPHABET.indexOf(character);
      if (at === -1) throw new FormatException(`Expected base64. ${describeText(encoded.length, position)}`);
      held = (held << PER_CHARACTER) | at;
      bits += PER_CHARACTER;
      if (bits >= 8) {
        bits -= 8;
        bytes.push((held >> bits) & 0xff);
      }
    }

    if (bits > 0 && (held & ((1 << bits) - 1)) !== 0) {
      throw new FormatException(
        `Expected base64 whose last character carries no bits past the final byte. ${
          describeText(encoded.length, trimmed.length - 1)
        }`,
      );
    }

    return new Uint8Array(bytes);
  },
};

/**
 * Bytes written in base64 the way an address accepts, unpadded.
 *
 * @remarks
 * `+` and `/` mean something inside an address, so this writes `-` and `_` instead and leaves the
 * padding off. It is what a token in a path or a query is carried as.
 */
export const base64Url: Codec<Uint8Array, string> = {
  encode(input: Uint8Array): string {
    return base64.encode(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  },

  /**
   * @remarks
   * It refuses `+`, `/` and padding rather than taking them as the other alphabet's spelling of the
   * same bytes. A token that arrives in either spelling is a token that has two texts, and whatever
   * keyed on the text, a replay guard most of all, would hold one and let the other through.
   *
   * @throws {FormatException} When `encoded` holds a character this alphabet does not use.
   */
  decode(encoded: string): Uint8Array<ArrayBuffer> {
    if (/[+/=]/.test(encoded)) {
      throw new FormatException(
        `Expected base64 written for an address, which uses "-" and "_" and no padding. ${
          describeText(encoded.length, encoded.search(/[+/=]/))
        }`,
      );
    }
    return base64.decode(encoded.replace(/-/g, "+").replace(/_/g, "/")) as Uint8Array<ArrayBuffer>;
  },
};

/**
 * A value written as JSON text, and read back from it.
 *
 * @remarks
 * What comes back is `unknown` on purpose. The text arrived from somewhere this process does not
 * control, so what it spells is not known until something checks, and a schema is what checks.
 */
export const json: Codec<unknown, string> = {
  encode(input: unknown): string {
    return JSON.stringify(input) ?? "null";
  },

  /** @throws {FormatException} When `encoded` is not JSON. */
  decode(encoded: string): unknown {
    try {
      return JSON.parse(encoded);
    } catch {
      throw new FormatException(`Expected JSON. ${describeText(encoded.length, null)}`);
    }
  },
};
