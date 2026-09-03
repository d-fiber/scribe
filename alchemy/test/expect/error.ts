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

import type { List } from "../../value/list.ts";
import { equal } from "./equal.ts";

/**
 * An assertion that did not hold.
 *
 * @remarks
 * It descends from `Error` and deliberately not from `ScribeError`. Everything descending from that
 * one is printed as its sentence and loses its stack, which is right for a fault in what somebody
 * wrote and wrong here: what a failing assertion is asked first is which line of the test failed,
 * and only the stack answers that.
 */
export class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssertionError";
  }
}

const MAX_DEPTH = 4;
const MAX_MEMBERS = 12;
const MAX_TEXT = 120;

/**
 * `value` written the way an assertion message shows it.
 *
 * @remarks
 * It is short on purpose. A structure is opened four levels deep and shows twelve members, past
 * which it says how many were left out, because a message nobody reads to the end helps nobody.
 */
export function format(value: unknown): string {
  return write(value, 0, new Set<object>());
}

/**
 * What there is to say about `actual` on top of what was expected, or null when nothing differs.
 *
 * @remarks
 * What was expected is already on the line above, written by the matcher, so this says only what
 * was found and, when both sides are structures, the path of the first field that differs. Naming
 * the path rather than printing both structures in full is the point: that path is what somebody
 * is looking for, and finding it by eye in two long structures is the slow part.
 */
export function difference(expected: unknown, actual: unknown): string | null {
  if (equal(expected, actual)) return null;

  const path = firstDifference(expected, actual, "");
  const lines = [`  actual    ${format(actual)}`];

  if (path !== null && path !== "") lines.push(`  differs at  ${path}`);

  return lines.join("\n");
}

function firstDifference(
  expected: unknown,
  actual: unknown,
  at: string,
): string | null {
  if (equal(expected, actual)) return null;
  if (typeof expected !== "object" || typeof actual !== "object") return at;
  if (expected === null || actual === null) return at;
  if (Object.getPrototypeOf(expected) !== Object.getPrototypeOf(actual)) {
    return at;
  }
  if (
    expected instanceof Map ||
    expected instanceof Set ||
    expected instanceof Date
  ) {
    return at;
  }

  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length !== actual.length) return at;
    for (let index = 0; index < expected.length; index++) {
      const deeper = firstDifference(
        expected[index],
        actual[index],
        `${at}[${index}]`,
      );
      if (deeper !== null) return deeper;
    }
    return at;
  }

  const fields = Object.keys(expected as Record<string, unknown>);
  if (fields.length !== Object.keys(actual as Record<string, unknown>).length) {
    return at;
  }

  for (const field of fields) {
    const deeper = firstDifference(
      (expected as Record<string, unknown>)[field],
      (actual as Record<string, unknown>)[field],
      at === "" ? field : `${at}.${field}`,
    );
    if (deeper !== null) return deeper;
  }

  return at;
}

function write(value: unknown, depth: number, seen: Set<object>): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";

  switch (typeof value) {
    case "string":
      return quote(value);
    case "bigint":
      return `${value}n`;
    case "symbol":
      return value.toString();
    case "function":
      return value.name === "" ? "[function]" : `[function ${value.name}]`;
    case "number":
      return Object.is(value, -0) ? "-0" : String(value);
    case "boolean":
      return String(value);
  }

  const held = value as object;
  if (seen.has(held)) return "[circular]";
  if (depth >= MAX_DEPTH) return "...";

  if (held instanceof Date) return `Date(${held.toISOString()})`;
  if (held instanceof RegExp) return held.toString();
  if (held instanceof Error) return `${held.name}(${quote(held.message ?? "")})`;

  seen.add(held);
  const written = writeStructure(held, depth, seen);
  seen.delete(held);
  return written;
}

function writeStructure(
  held: object,
  depth: number,
  seen: Set<object>,
): string {
  if (Array.isArray(held)) {
    return wrap(
      "[",
      held.map((member) => write(member, depth + 1, seen)),
      "]",
      held.length,
    );
  }

  if (held instanceof Map) {
    const entries = [...held].map(
      ([key, value]) => `${write(key, depth + 1, seen)} => ${write(value, depth + 1, seen)}`,
    );
    return `Map${wrap("{", entries, "}", held.size)}`;
  }

  if (held instanceof Set) {
    return `Set${
      wrap(
        "{",
        [...held].map((member) => write(member, depth + 1, seen)),
        "}",
        held.size,
      )
    }`;
  }

  if (ArrayBuffer.isView(held) || held instanceof ArrayBuffer) {
    const bytes = held instanceof ArrayBuffer
      ? new Uint8Array(held)
      : new Uint8Array(held.buffer, held.byteOffset, held.byteLength);
    return `${held.constructor.name}${wrap("[", [...bytes].map(String), "]", bytes.length)}`;
  }

  const fields = Object.entries(held as Record<string, unknown>).map(
    ([field, value]) => `${field}: ${write(value, depth + 1, seen)}`,
  );
  const named = held.constructor === Object || held.constructor === undefined ? "" : `${held.constructor.name} `;
  return `${named}${wrap("{", fields, "}", fields.length)}`;
}

function wrap(
  open: string,
  members: List<string>,
  close: string,
  total: number,
): string {
  if (total === 0) return `${open}${close}`;

  const shown = members.slice(0, MAX_MEMBERS);
  if (total > MAX_MEMBERS) shown.push(`... ${total - MAX_MEMBERS} more`);

  const spacing = open === "{" ? " " : "";
  return `${open}${spacing}${shown.join(", ")}${spacing}${close}`;
}

function quote(text: string): string {
  const shortened = text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT)}...` : text;
  return JSON.stringify(shortened);
}
