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
 * The primitives every package and the framework itself are written with.
 *
 * @remarks
 * This is the vocabulary, and nothing in it reaches a disk, a network or a database. That is what
 * lets a package depend on it without depending on anything that runs: a package author imports
 * this and writes against it, the way a Flutter plugin imports the framework and never sees the
 * engine.
 *
 * What lives here is held to one rule: it must never break. A package compiled against one version
 * of these types is code nobody here can see, so a name that leaves changes what somebody else
 * already wrote.
 */

export { Time } from "./src/value/time.ts";
export { Size } from "./src/value/size.ts";
export type { Location, RequestIpLocation } from "./src/value/location.ts";

export { Failure, OK } from "./src/value/result.ts";
export type { Result } from "./src/value/result.ts";
export { emptyPagination, pagination } from "./src/value/pagination.ts";
export type { Pagination } from "./src/value/pagination.ts";

export { Slot } from "./src/bind/slot.ts";

export { fromHex, sha256Hex, toHex } from "./src/value/hash.ts";

export { ExponentialBackoff } from "./src/value/async/backoff.ts";
export { DeadlineExceededError, withDeadline } from "./src/value/async/deadline.ts";
export { runPooled } from "./src/value/async/pool.ts";
export { Semaphore } from "./src/value/async/semaphore.ts";
export { sleep } from "./src/value/async/sleep.ts";

export { ScribeError } from "./src/manifest/error.ts";

export { DeclarationError, DEFAULT_DESCRIPTION, Package } from "./src/manifest/package.ts";
export type {
  AwaitingDependencies,
  AwaitingDescription,
  AwaitingVersion,
  Buildable,
  Dependencies,
} from "./src/manifest/package.ts";

export { mount } from "./src/manifest/manifest.ts";
export type { Lifecycle, LifecycleStep, Manifest, MountedPackage } from "./src/manifest/manifest.ts";

export { isValidPackageName, packageNameProblem, RESERVED_PACKAGE_NAMES } from "./src/manifest/name.ts";

export { Constraint } from "./src/manifest/constraint.ts";
export { Version, VersionError } from "./src/manifest/version.ts";

export { DuplicateDeclarationError, Registry } from "./src/declare/registry.ts";

export { cache, Caches } from "./src/port/cache.ts";
export type { Cache, CacheDriver, CacheOptions } from "./src/port/cache.ts";
export { rateLimit, RateLimiters } from "./src/port/rate_limit.ts";
export type { RateLimiter, RateLimiterDriver, RateLimitOptions, RateLimitOutcome } from "./src/port/rate_limit.ts";

export { Databases, table } from "./src/port/database.ts";
export type {
  ColumnFilter,
  Columns,
  DatabaseDriver,
  DatabaseSchema,
  Filters,
  FilterSpec,
  OrderOptions,
  Projected,
  Query,
  TableShape,
} from "./src/port/database.ts";
