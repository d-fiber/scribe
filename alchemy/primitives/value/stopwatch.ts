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

import { Now } from "./date_time.ts";
import { Duration } from "./duration.ts";

/**
 * How long something took, measured rather than told.
 *
 * @remarks
 * It reads the same source `DateTime.now` reads, which is what makes a case about a slow call take
 * no time at all: the test moves the source, and this reports what the case decided.
 *
 * Starting an already running one does nothing, and stopping a stopped one does nothing, so a
 * caller unsure of the state does not have to check first.
 *
 * @example
 * ```ts ignore
 * const watch = Stopwatch.started();
 * await work();
 * log.info(`took ${watch.elapsed.inMilliseconds} ms`);
 * ```
 */
export class Stopwatch {
  /** When the current run began, or null while this is stopped. */
  #startedAt: number | null = null;

  /** How much was counted by the runs before the current one. */
  #before = 0;

  /** Whether this is counting right now. */
  get isRunning(): boolean {
    return this.#startedAt !== null;
  }

  /** How long this has counted in total, over every run since the last reset. */
  get elapsed(): Duration {
    return Duration.milliseconds(this.elapsedMilliseconds);
  }

  /** How long this has counted, in milliseconds. */
  get elapsedMilliseconds(): number {
    if (this.#startedAt === null) return this.#before;
    return this.#before + (Now.get().millisecondsSinceEpoch() - this.#startedAt);
  }

  /** Starts counting, and does nothing when this is running already. */
  start(): void {
    if (this.#startedAt !== null) return;
    this.#startedAt = Now.get().millisecondsSinceEpoch();
  }

  /** Stops counting, keeping what was counted. Does nothing when this is stopped already. */
  stop(): void {
    if (this.#startedAt === null) return;
    this.#before += Now.get().millisecondsSinceEpoch() - this.#startedAt;
    this.#startedAt = null;
  }

  /** Sets what was counted back to nothing, leaving this running if it was. */
  reset(): void {
    this.#before = 0;
    if (this.#startedAt !== null) this.#startedAt = Now.get().millisecondsSinceEpoch();
  }

  /** A stopwatch already running, which is what most callers want. */
  static started(): Stopwatch {
    const watch = new Stopwatch();
    watch.start();
    return watch;
  }
}
