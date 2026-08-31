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

import type { Future } from "../../async/future.ts";
import type { DeclaredHook, HookDriver, HookOptions } from "../../port/hook.ts";

/**
 * A hook that keeps what is emitted and calls whoever listened, for a test to run a package against.
 *
 * @remarks
 * Listeners are called in the order they asked, and one that raises stops the rest, so a case that
 * wants to see what a failing listener does can. A real carrier promises neither, which is why the
 * port promises neither either: a package that depends on the order here is a package that will
 * break in production, and this fake is not the place that catches it.
 */
export class MemoryHook<T> implements DeclaredHook<T> {
  /** Everything emitted, in the order it was emitted. */
  readonly emitted: T[] = [];

  /** Whoever asked to hear this. */
  readonly #listening: Array<(payload: T) => void | Future<void>> = [];

  /**
   * The {@link DeclaredHook.emit} implementation: records `payload` in {@link emitted}, then
   * calls every listener in registration order, letting a raised error stop the rest.
   */
  async emit(payload: T): Future<void> {
    this.emitted.push(payload);
    for (const listen of this.#listening) await listen(payload);
  }

  /** The {@link DeclaredHook.on} implementation: records `listen`, called by every later {@link emit}. */
  on(listen: (payload: T) => void | Future<void>): void {
    this.#listening.push(listen);
  }

  /** How many listeners this hook has. */
  get listeners(): number {
    return this.#listening.length;
  }
}

/** A driver that opens a {@link MemoryHook} per event, for a test to fill `Hooks` with. */
export class MemoryHooks implements HookDriver {
  /** Every hook opened so far, by the event it was opened under. */
  readonly opened: Map<string, MemoryHook<never>> = new Map<string, MemoryHook<never>>();

  /**
   * The {@link HookDriver.open} implementation: opens a {@link MemoryHook} for `options.event`,
   * or hands back the one already opened under that event.
   */
  open<T>(options: HookOptions): DeclaredHook<T> {
    const already = this.opened.get(options.event);
    if (already !== undefined) return already as unknown as DeclaredHook<T>;

    const held = new MemoryHook<T>();
    this.opened.set(options.event, held as unknown as MemoryHook<never>);
    return held;
  }
}
