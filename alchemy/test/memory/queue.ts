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
import type { UnmodifiableList } from "../../value/list.ts";
import type { DeclaredQueue, DeclaredQueueOptions, QueueDriver, QueueMessage } from "../../port/queue.ts";

/**
 * A queue that keeps what is pushed to it in a list, for a test to run a package against.
 *
 * @remarks
 * Nothing is drained on its own. A case pushes, reads {@link pushed} to see what a package sent,
 * and calls {@link deliver} to hand a message to the declared handler when it wants to exercise the
 * other side. Draining by itself would make a case depend on when a timer fired.
 */
export class MemoryQueue<T> implements DeclaredQueue<T> {
  /** Everything pushed to this queue, in the order it was pushed. */
  readonly pushed: T[] = [];

  /** How many times each message has been handed over, by its identifier. */
  readonly #attempts = new Map<string, number>();

  /** What this queue was declared with, the handler included when one was named. */
  readonly #options: DeclaredQueueOptions;

  constructor(options: DeclaredQueueOptions) {
    this.#options = options;
  }

  push(data: T): Future<void> {
    this.pushed.push(data);
    return Promise.resolve();
  }

  pushMany(batch: UnmodifiableList<T>): Future<void> {
    this.pushed.push(...batch);
    return Promise.resolve();
  }

  /**
   * Hands the message at `at` to the handler this queue was declared with.
   *
   * @remarks
   * It counts the delivery, so a handler reading {@link QueueMessage.attempts} sees what it would
   * see against a real broker. A handler that raises leaves the count where it is and the raise
   * reaches the caller, which is what lets a case check what a failing handler does.
   *
   * @param at - Which of {@link pushed} to hand over. The first when left out.
   */
  async deliver(at = 0): Future<void> {
    const handle = this.#options.handle;
    if (handle === undefined) return;

    const id = `${this.#options.key}:${at}`;
    const attempts = (this.#attempts.get(id) ?? 0) + 1;
    this.#attempts.set(id, attempts);

    await handle({ id, data: this.pushed[at], attempts } as QueueMessage<never>);
  }
}

/** A driver that opens a {@link MemoryQueue} per key, for a test to fill `Queues` with. */
export class MemoryQueues implements QueueDriver {
  /** Every queue opened so far, by the key it was opened under. */
  readonly opened: Map<string, MemoryQueue<never>> = new Map<string, MemoryQueue<never>>();

  /** Every key the host asked to have drained. */
  readonly draining: string[] = [];

  open<T>(options: DeclaredQueueOptions): DeclaredQueue<T> {
    const already = this.opened.get(options.key);
    if (already !== undefined) return already as unknown as DeclaredQueue<T>;

    const held = new MemoryQueue<T>(options);
    this.opened.set(options.key, held as unknown as MemoryQueue<never>);
    return held;
  }

  consume(options: DeclaredQueueOptions): void {
    this.draining.push(options.key);
  }
}
