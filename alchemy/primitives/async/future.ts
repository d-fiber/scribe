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

import type { List } from "../value/list.ts";
import type { Duration } from "../value/duration.ts";

/**
 * A value that is not there yet.
 *
 * @remarks
 * It is `Promise` under Dart's name, and an `async` function answers one whether or not it says so.
 * Nothing changes at run time.
 *
 * It lives here rather than among the values because it is not one: it is how this repository holds
 * the asynchronous together, and the ways in below reach a timer and a scheduler.
 */
export type Future<T> = Promise<T>;

/**
 * Either a value or a {@link Future} of it.
 *
 * It is what a callback is declared as when the caller awaits either, so somebody writing a handler
 * may leave off `async` when there is nothing to wait for.
 */
export type FutureOr<T> = T | Future<T>;

/**
 * The ways a future is made, named the way Dart names them.
 *
 * @remarks
 * Every one of them is what the platform already does under another name. They are here so that a
 * package writes one vocabulary rather than two, and so that `Promise` never has to appear in code
 * that otherwise reads as Dart.
 */
export const Future: {
  /** A future that settles with `value` after `held` has passed, or with nothing when none is given. */
  delayed<T = void>(held: Duration, value?: T): Future<T>;

  /** A future already settled with `value`. */
  value<T>(value: T): Future<T>;

  /** A future already failed with `raised`. */
  error<T = never>(raised: unknown): Future<T>;

  /**
   * A future that settles once every one of `futures` has.
   *
   * It fails as soon as any of them does, and what the others answer is then dropped.
   */
  wait<T>(futures: Iterable<Future<T>>): Future<List<T>>;

  /**
   * A future that settles as soon as the first of `futures` does, however it settles.
   *
   * @remarks
   * It is called `race` and not `any` because the platform already uses both words and they mean
   * different things: `Promise.race` settles on the first to finish, failure included, while
   * `Promise.any` settles on the first to **succeed**. Dart calls this one `any`, and keeping that
   * name here would have handed a reader of TypeScript the opposite of what they read. Whoever
   * wants a fallback wants {@link firstSucceeding}.
   */
  race<T>(futures: Iterable<Future<T>>): Future<T>;

  /**
   * A future that settles on the first of `futures` to succeed, and fails only if they all do.
   *
   * @remarks
   * It is what a caller reaching for a primary and a fallback wants: {@link race} would answer the
   * failure of whichever came back first and throw the fallback away.
   */
  firstSucceeding<T>(futures: Iterable<Future<T>>): Future<T>;

  /** A future that runs `computation` after the current work has finished, and not before. */
  microtask<T>(computation: () => FutureOr<T>): Future<T>;
} = {
  delayed<T = void>(held: Duration, value?: T): Future<T> {
    return new Promise((settle) => setTimeout(() => settle(value as T), held.inMilliseconds));
  },

  value<T>(value: T): Future<T> {
    return Promise.resolve(value);
  },

  error<T = never>(raised: unknown): Future<T> {
    return Promise.reject(raised);
  },

  wait<T>(futures: Iterable<Future<T>>): Future<List<T>> {
    return Promise.all(futures);
  },

  race<T>(futures: Iterable<Future<T>>): Future<T> {
    return Promise.race(futures);
  },

  firstSucceeding<T>(futures: Iterable<Future<T>>): Future<T> {
    return Promise.any(futures);
  },

  microtask<T>(computation: () => FutureOr<T>): Future<T> {
    return Promise.resolve().then(computation);
  },
};

/**
 * Starts `work` and does not wait for it.
 *
 * @remarks
 * It is how work outlives the answer that started it: the caller replies, the body carries on, and
 * then it is gone.
 *
 * A body that fails is logged and goes no further. Whoever started it has already answered, so
 * there is nobody left to tell.
 *
 * **The body lives in this process and nowhere else.** A crash, a redeploy or a `SIGTERM` takes it
 * with them, and nothing waits for it or replays it. Work whose loss would be noticed belongs on a
 * queue, which pays a round trip for the guarantee. Nothing caps how much is started either, so a
 * caller that loops keeps starting bodies until the process runs out of memory.
 */
export function unawaited(work: Future<void>): void {
  work.catch((raised) => console.error("[unawaited] a detached body failed:", raised));
}
