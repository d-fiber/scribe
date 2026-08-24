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

import type { Future } from "./future.ts";
import { ScribeError } from "../error/scribe_error.ts";
import type { Duration } from "../value/duration.ts";

/**
 * A call that took longer than it was given.
 *
 * @remarks
 * It carries the name Dart gives what `Future.timeout` raises, so a reader coming from there
 * catches what they expect. The shape differs and cannot not: `timeout` is a member on a future
 * there, and nothing can be added to the platform's own type here, so {@link withDeadline} is a
 * function that takes the call rather than a member on it.
 */
export class TimeoutException extends ScribeError {}

/**
 * Runs `call` against a timer, and fails when the timer wins.
 *
 * @remarks
 * Nothing is cancelled when the deadline passes, because a future cannot be. The call carries on,
 * and what it eventually answers is written to `console.error` with the same scope rather than
 * disappearing: it reaches nobody who was waiting, but it does not vanish either.
 *
 * @param scope - What is being waited on, written in brackets at the head of the message, the way
 * every log line of the repo is written.
 * @param within - How long the call has.
 * @param call - What is being waited on, already started.
 *
 * @throws {TimeoutException} When `within` passes before `call` settles.
 *
 * @example
 * ```ts
 * const rows = await withDeadline("audience:list", Duration.seconds(2), store.all());
 * ```
 */
export function withDeadline<R>(
  scope: string,
  within: Duration,
  call: Future<R>,
): Future<R> {
  let timer: ReturnType<typeof setTimeout>;

  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new TimeoutException(`[${scope}] exceeded ${within.inMilliseconds}ms`)),
      within.inMilliseconds,
    );
  });

  return Promise.race([call, deadline])
    .catch((error) => {
      if (error instanceof TimeoutException) {
        call.catch((late) =>
          console.error(
            `[${scope}] settled after its deadline was already treated as a failure:`,
            late,
          )
        );
      }
      throw error;
    })
    .finally(() => clearTimeout(timer));
}
