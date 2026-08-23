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

/**
 * What a test asserts, without reaching outside the package.
 *
 * @remarks
 * It is a second entry rather than part of the main one because it is written against only while
 * testing, and a package that never tests has no reason to carry it.
 *
 * What is not here is the thing that runs a test. A case is declared through {@link Scribe}, and
 * what holds it and runs it is filled into {@link Runners} from outside, because a runner is
 * something that runs and nothing here does.
 */

export { expect, expectLater, fail } from "./expect/expect.ts";

export {
  contains,
  equals,
  greaterThan,
  hasLength,
  having,
  isA,
  isEmpty,
  isFalse,
  isNot,
  isNotEmpty,
  isNotNull,
  isNull,
  isTrue,
  lessThan,
  same,
  throwsA,
  withMessage,
} from "./expect/matcher.ts";
export type { Matcher } from "./expect/matcher.ts";

export { equal } from "./expect/equal.ts";
export { AssertionError, difference, format } from "./expect/error.ts";

export { Runners, Scribe } from "./runner.ts";
export type { CaseBody, Declarations, TestRunner } from "./runner.ts";

export { callsOf, clearCalls, MissingAnswerError, mock, reset } from "./mock/mock.ts";
export type { DoubleOptions } from "./mock/mock.ts";

export { anything, capture, isMatcher, matching } from "./mock/matcher.ts";
export type { ArgumentMatcher, Capture } from "./mock/matcher.ts";

export { when } from "./mock/stub.ts";
export type { Answers } from "./mock/stub.ts";

export { VerificationError, verify, verifyInOrder, verifyNever, verifyNoMoreInteractions } from "./mock/verify.ts";
export type { Checked } from "./mock/verify.ts";

export { NoCallReadError } from "./mock/recorder.ts";
export type { Invocation } from "./mock/recorder.ts";

export { MemoryFileSystem, MemoryFileSystemDriver, MissingFileError } from "./memory/files.ts";
export { MemoryCache, MemoryCaches } from "./memory/cache.ts";
export { MemoryQueue, MemoryQueues } from "./memory/queue.ts";
export { MemoryHook, MemoryHooks } from "./memory/hook.ts";
export { MemoryCrons } from "./memory/cron.ts";
export { MemoryTrigger, MemoryTriggers } from "./memory/trigger.ts";
export { MemoryRateLimiter, MemoryRateLimiters } from "./memory/rate_limit.ts";

export { checkCacheDriver } from "./conformity/cache.ts";
export { FixedNow } from "./memory/now.ts";
export { SequentialUuids } from "./memory/uuids.ts";
