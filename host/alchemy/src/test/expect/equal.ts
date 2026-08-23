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

/**
 * Whether two values hold the same thing, all the way down.
 *
 * @remarks
 * The rules it follows, in the order it applies them:
 *
 * - Primitives are compared with `Object.is`, so `NaN` equals itself and `+0` does not equal `-0`.
 * - A `Date` is compared on its time, a `RegExp` on its source and its flags.
 * - A boxed primitive is compared on the value it wraps.
 * - An `Error` is compared on its name and its message, then on whatever else it carries.
 * - Two objects of different constructors are never equal, so an instance never equals a literal
 *   that happens to carry the same fields.
 * - A `Map` and a `Set` ignore order, and their keys are matched by this same comparison rather
 *   than by identity, which is why a key that is itself an object still finds its partner.
 * - Anything else is compared on its own enumerable keys, symbols included.
 *
 * Cycles are held in a table of pairs already being compared, so a structure that points back at
 * itself answers instead of running forever.
 */
export function equal(a: unknown, b: unknown): boolean {
  return compare(a, b, new Map<object, Set<object>>());
}

function compare(a: unknown, b: unknown, seen: Map<object, Set<object>>): boolean {
  if (Object.is(a, b)) return true;

  if (a instanceof Date && b instanceof Date) return Object.is(a.getTime(), b.getTime());
  if (a instanceof RegExp && b instanceof RegExp) return a.source === b.source && a.flags === b.flags;

  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;

  if (alreadyPaired(a, b, seen)) return true;
  pair(a, b, seen);

  if (isBoxed(a) && isBoxed(b)) return Object.is(a.valueOf(), b.valueOf());
  if (a instanceof Error && b instanceof Error) {
    if (a.name !== b.name || a.message !== b.message) return false;
  }

  const bytesOfA = bytesOf(a);
  const bytesOfB = bytesOf(b);
  if (bytesOfA !== null || bytesOfB !== null) {
    return bytesOfA !== null && bytesOfB !== null && sameBytes(bytesOfA, bytesOfB);
  }

  if (a instanceof Map && b instanceof Map) return sameEntries(a, b, seen);
  if (a instanceof Set && b instanceof Set) return sameMembers(a, b, seen);
  if (a instanceof WeakMap || a instanceof WeakSet) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((held, at) => compare(held, b[at], seen));
  }

  return sameFields(a, b, seen);
}

function alreadyPaired(a: object, b: object, seen: Map<object, Set<object>>): boolean {
  return seen.get(a)?.has(b) ?? false;
}

function pair(a: object, b: object, seen: Map<object, Set<object>>): void {
  const held = seen.get(a);
  if (held === undefined) seen.set(a, new Set([b]));
  else held.add(b);
}

function isBoxed(held: object): held is { valueOf(): unknown } {
  return held instanceof Number || held instanceof String || held instanceof Boolean;
}

function bytesOf(held: object): Uint8Array | null {
  if (held instanceof ArrayBuffer) return new Uint8Array(held);
  if (ArrayBuffer.isView(held)) {
    return new Uint8Array(held.buffer, held.byteOffset, held.byteLength);
  }
  return null;
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  return a.every((byte, at) => byte === b[at]);
}

function sameEntries(a: Map<unknown, unknown>, b: Map<unknown, unknown>, seen: Map<object, Set<object>>): boolean {
  if (a.size !== b.size) return false;

  const left = [...b.entries()];
  const taken = new Set<number>();

  for (const [key, value] of a) {
    const found = left.findIndex(([otherKey, otherValue], at) =>
      !taken.has(at) && compare(key, otherKey, seen) && compare(value, otherValue, seen)
    );
    if (found === -1) return false;
    taken.add(found);
  }

  return true;
}

function sameMembers(a: Set<unknown>, b: Set<unknown>, seen: Map<object, Set<object>>): boolean {
  if (a.size !== b.size) return false;

  const left = [...b];
  const taken = new Set<number>();

  for (const member of a) {
    const found = left.findIndex((other, at) => !taken.has(at) && compare(member, other, seen));
    if (found === -1) return false;
    taken.add(found);
  }

  return true;
}

function sameFields(a: object, b: object, seen: Map<object, Set<object>>): boolean {
  const keysOfA = fieldsOf(a);
  const keysOfB = fieldsOf(b);
  if (keysOfA.length !== keysOfB.length) return false;

  return keysOfA.every((key) =>
    Object.prototype.hasOwnProperty.call(b, key) &&
    compare((a as Record<PropertyKey, unknown>)[key], (b as Record<PropertyKey, unknown>)[key], seen)
  );
}

function fieldsOf(held: object): List<PropertyKey> {
  const symbols = Object.getOwnPropertySymbols(held).filter((symbol) =>
    Object.prototype.propertyIsEnumerable.call(held, symbol)
  );
  return [...Object.keys(held), ...symbols];
}
