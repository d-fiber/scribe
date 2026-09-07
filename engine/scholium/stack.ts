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

import { currentStack, type ShippedStack } from "./host.ts";

/**
 * Picks `byStack[currentStack()]()`, and refuses a stack {@link ShippedStack} does not name with
 * `refusal`.
 *
 * @remarks
 * This is the shape `env.ts`, `args.ts` and the two `settings.ts` files all repeated on their
 * own: a three-way switch that builds one of two classes and refuses the third. It stays a
 * builder passed in by the caller, keyed by {@link ShippedStack} rather than the classes
 * themselves, because a shared bundle that imported both `deno/*.ts` and `bun/*.ts` for every
 * caller was tried first and reverted: it pulled the other stack's whole implementation,
 * `@scribe/alchemy` included, into any file that only ever wanted one port, and a narrow,
 * hand-written import map like `sdk/js/deno.json`'s does not carry every specifier that graph
 * reaches. Each caller still imports only the classes it needs; this function only carries the
 * dispatch between them.
 *
 * Typing `byStack` as `Record<ShippedStack, () => T>` rather than a hand-written `{ deno, bun }`
 * shape is the point: a stack added to or dropped from {@link ShippedStack} turns every call site
 * that builds this object into a compile error, named at the exact property that is missing or
 * excess, rather than a silent gap only a `node`-shaped refusal at runtime would reveal. The
 * `switch` below carries the same guarantee the other way, `noImplicitReturns` refusing to compile
 * it once a case goes unhandled.
 *
 * `refusal` is the caller's own message, not a shared one: `env.ts` names "Environment" and
 * `args.ts` names "process-argument reader" because a refusal that named neither would send
 * whoever reads it looking for the wrong port.
 *
 * @param byStack - How to build the value for each stack this framework ships.
 * @param refusal - The message an unshipped stack refuses with.
 * @throws {Error} When {@link currentStack} answers a stack {@link ShippedStack} does not name.
 */
export function pickStack<T>(byStack: Record<ShippedStack, () => T>, refusal: string): T {
  switch (currentStack()) {
    case "deno":
      return byStack.deno();
    case "bun":
      return byStack.bun();
    case "node":
      throw new Error(refusal);
  }
}
