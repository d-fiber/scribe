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

import { Slot } from "../bind/slot.ts";
import { Registry } from "../declare/registry.ts";
import type { Future } from "../async/future.ts";

/** What declaring a hook takes. */
export interface HookOptions {
  /** What happened, named once and written the same way by everybody who listens for it. */
  readonly event: string;
}

/**
 * Something that happened, told to whoever asked to hear it.
 *
 * @remarks
 * It is what a queue is not. A queue names who does the work; this names what happened and knows
 * nothing about who cares. That is the whole reason to reach for one: a package announces a fact
 * without growing a list of the packages that react to it.
 *
 * Nothing is promised about who hears it, or whether anybody does. A caller that needs the work
 * done reaches for a queue instead.
 */
export interface Hook<T> {
  /** Says that this happened, carrying `payload`, and answers once it has been told. */
  emit(payload: T): Future<void>;

  /**
   * Calls `listen` every time this happens, from now on.
   *
   * @remarks
   * A hook that could only be emitted was half a primitive: a package could say a thing happened
   * and had no way of hearing one, so every package that reacted to an event reached past this port
   * for something else.
   *
   * Nothing is promised about the order two listeners are called in, or about a listener that
   * raises stopping the others.
   */
  on(listen: (payload: T) => void | Future<void>): void;
}

/** What carries an event to whoever listens. */
export interface HookDriver {
  /** Opens the hook `options` describes. Opening the same event twice answers the same hook. */
  open<T>(options: HookOptions): Hook<T>;
}

/**
 * What answers a package that needs to say something happened.
 *
 * The host fills it once, at boot, and a test fills it with something that keeps what was emitted.
 */
export const Hooks: Slot<HookDriver> = new Slot<HookDriver>("Hooks");

/** Every hook a package has declared, by the event it answers to. */
const declared = new Registry<{ open(): void }>("hook");

/** A hook that opens itself the first time it is used, and not before. */
class DeferredHook<T> implements Hook<T> {
  readonly #options: HookOptions;

  /** Whoever asked to hear this before the host was up, kept until there is something to open. */
  readonly #waiting: Array<(payload: T) => void | Future<void>> = [];
  #opened: Hook<T> | null = null;

  constructor(options: HookOptions) {
    this.#options = options;
  }

  emit(payload: T): Future<void> {
    return this.#hook().emit(payload);
  }

  on(listen: (payload: T) => void | Future<void>): void {
    if (this.#opened === null) {
      this.#waiting.push(listen);
      return;
    }
    this.#opened.on(listen);
  }

  /** Opens this hook now, which is what {@link openHooks} does to every declared one. */
  open(): void {
    this.#hook();
  }

  #hook(): Hook<T> {
    if (this.#opened === null) {
      this.#opened = Hooks.get().open<T>(this.#options);
      for (const listen of this.#waiting) this.#opened.on(listen);
      this.#waiting.length = 0;
    }
    return this.#opened;
  }
}

/**
 * Declares the hook `options` describes.
 *
 * @remarks
 * Declaring touches nothing, listening included: a listener written at module scope is kept and
 * handed over the moment the hook opens, which is the first emit or {@link openHooks}.
 *
 * @example
 * ```ts
 * const signedUp = hook<{ userId: string }>({ event: "audience.signed_up" });
 * await signedUp.emit({ userId });
 * ```
 */
export function hook<T>(options: HookOptions): Hook<T> {
  const held = new DeferredHook<T>(options);
  declared.declare(options.event, held);
  return held;
}

/**
 * Opens every declared hook, so a listener written at module scope is heard from now on.
 *
 * @remarks
 * The host calls it once, after it has filled {@link Hooks}. Without it a hook nobody emits to is
 * never opened, and a package that only listens would never hear anything.
 */
export function openHooks(): void {
  for (const held of declared.all()) held.open();
}

/** Forgets every declared hook, which is what a test does between cases. */
export function forgetHooks(): void {
  declared.forget();
}
