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
import type { Duration } from "../value/duration.ts";
import type { UnmodifiableList } from "../value/list.ts";

/** What opening a queue takes. */
export interface QueueOptions {
  /** The name this queue answers to, which is what keeps two of them apart. */
  readonly key: string;

  /** How many times a message is handed over before it is given up on. Once when left out. */
  readonly attempts?: number;

  /** How long a handler has before the message is handed to somebody else. */
  readonly visibility?: Duration;

  /**
   * What does the work.
   *
   * @remarks
   * It is declared beside the queue rather than looked up from the key by the host, so a queue and
   * the thing that drains it are read together and neither can be moved without the other. A queue
   * declared without one is a queue nothing consumes, which is legitimate when another process
   * drains it, and it is then said by leaving this out rather than by forgetting it.
   *
   * A handler that raises leaves the message to be handed over again, up to {@link attempts}.
   */
  readonly handle?: (message: QueueMessage<never>) => void | Future<void>;
}

/**
 * A message as its handler receives it.
 *
 * @remarks
 * A handler is given the message rather than the payload alone, because how many times it has been
 * tried is what decides whether a failure is worth retrying or worth reporting.
 */
export interface QueueMessage<T> {
  /** The identifier the queue gave this message when it was pushed. */
  readonly id: string;

  /** What the producer sent, decoded into the handler's own type. */
  readonly data: T;

  /**
   * How many times this message has been handed over, counting from one.
   *
   * It is the queue's count and not the payload's, so it cannot drift from what happened.
   */
  readonly attempts: number;
}

/**
 * Work handed to somebody else to do later.
 *
 * @remarks
 * A package never reaches a broker. It declares a queue, pushes to it, and what carries the message
 * is the host's business. The guarantee it buys over {@link unawaited} is that the work survives
 * this process: a crash between the push and the handling costs nothing.
 */
export interface Queue<T> {
  /** Puts `data` on this queue, and answers once the queue has taken it. */
  push(data: T): Future<void>;

  /**
   * Puts every one of `batch` on this queue.
   *
   * It is not the same as pushing one at a time: either the queue takes them all or it takes none,
   * so a producer cannot leave half a batch behind by failing in the middle.
   */
  pushMany(batch: UnmodifiableList<T>): Future<void>;
}

/** What opens a queue. */
export interface QueueDriver {
  /** Opens the queue `options` describes. Opening the same key twice answers the same queue. */
  open<T>(options: QueueOptions): Queue<T>;

  /**
   * Starts draining `options` with the handler it declared.
   *
   * @remarks
   * The host calls it once per declared queue, through {@link installQueues}, after it has filled
   * this slot. A driver that has nothing to drain, because another process does it, may do nothing.
   */
  consume<T>(options: QueueOptions): void;
}

/**
 * What answers a package that needs to hand work over.
 *
 * The host fills it once, at boot, with whatever broker it runs against, and a test fills it with
 * something that keeps what was pushed in a list.
 */
export const Queues: Slot<QueueDriver> = new Slot<QueueDriver>("Queues");

/**
 * A queue that opens itself the first time it is used, and not before.
 *
 * @remarks
 * A queue is declared at module scope, which runs the moment the module is imported, and at that
 * point nothing has filled {@link Queues}. Reading the slot there would throw before the host has
 * had a chance to start.
 */
class DeferredQueue<T> implements Queue<T> {
  readonly #options: QueueOptions;
  #opened: Queue<T> | null = null;

  constructor(options: QueueOptions) {
    this.#options = options;
  }

  push(data: T): Future<void> {
    return this.#queue().push(data);
  }

  pushMany(batch: UnmodifiableList<T>): Future<void> {
    return this.#queue().pushMany(batch);
  }

  #queue(): Queue<T> {
    if (this.#opened === null) this.#opened = Queues.get().open<T>(this.#options);
    return this.#opened;
  }
}

/**
 * Declares the queue `options` describes.
 *
 * @remarks
 * Declaring touches nothing. The slot is read at the first push, by which time the host is up, and
 * what drains the queue is started by {@link installQueues}.
 *
 * @throws {DuplicateDeclarationError} When `options.key` has already been declared, raised where the
 * second declaration is written.
 *
 * @example
 * ```ts
 * const welcomes = queue<{ userId: string }>({
 *   key: "audience:welcome",
 *   attempts: 3,
 *   handle: (message) => send(message.data),
 * });
 * await welcomes.push({ userId });
 * ```
 */
/** Every queue a package has declared, by the key it answers to. */
const declared = new Registry<QueueOptions>("queue");

export function queue<T>(options: QueueOptions): Queue<T> {
  declared.declare(options.key, options);
  return new DeferredQueue<T>(options);
}

/**
 * Starts draining every declared queue that named a handler.
 *
 * @remarks
 * The host calls it once, after it has filled {@link Queues} and before it starts serving. A queue
 * declared without a handler is left alone: something else drains it.
 */
export function installQueues(): void {
  const driver = Queues.get();
  for (const options of declared.all()) {
    if (options.handle) driver.consume(options);
  }
}

/** Forgets every declared queue, which is what a test does between cases. */
export function forgetQueues(): void {
  declared.forget();
}
