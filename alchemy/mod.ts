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

export { Future, unawaited } from "./async/future.ts";
export type { FutureOr } from "./async/future.ts";
export { Completer } from "./async/stream.ts";
export type { Stream } from "./async/stream.ts";
export { Bytes } from "./value/bytes.ts";
export type { Comparable } from "./value/comparable.ts";
export { DateTime, Now } from "./value/date_time.ts";
export type { NowSource } from "./value/date_time.ts";
export { Duration } from "./value/duration.ts";
export type { LatLng } from "./value/lat_lng.ts";
export type { List, UnmodifiableList } from "./value/list.ts";
export { Stopwatch } from "./value/stopwatch.ts";
export type { Uri } from "./value/uri.ts";
export { Uuid, Uuids } from "./value/uuid.ts";
export type { UuidSource } from "./value/uuid.ts";
export type { Expando, Finalizer, WeakReference } from "./value/weak.ts";

export { Pagination } from "./value/pagination.ts";
export type { PageRequest, PaginationJson } from "./value/pagination.ts";
export { Failure, Ok, okay } from "./value/result.ts";
export type { Result } from "./value/result.ts";

export { BindingError, Slot } from "./bind/slot.ts";

export { base64, base64Url, hex, json, utf8 } from "./value/convert.ts";
export type { BytesCodec, Codec } from "./value/convert.ts";

export { ExponentialBackoff } from "./async/backoff.ts";
export { TimeoutException, withDeadline } from "./async/deadline.ts";
export { runPooled } from "./async/pool.ts";
export { Semaphore } from "./async/semaphore.ts";
export type { Release } from "./async/semaphore.ts";

export { Current, Currents } from "./scope/current.ts";
export type { CurrentDriver, CurrentStore } from "./scope/current.ts";

export { FormatException } from "./error/format_exception.ts";
export { Refusal, REFUSAL_KINDS } from "./error/refusal.ts";
export type { RefusalKind } from "./error/refusal.ts";
export { ScribeError } from "./error/scribe_error.ts";

export { DeclarationError, DEFAULT_DESCRIPTION, Package } from "./package/package.ts";
export type {
  AwaitingDependencies,
  AwaitingDescription,
  AwaitingFramework,
  AwaitingVersion,
  Buildable,
  Dependencies,
} from "./package/package.ts";

export { mount } from "./package/manifest.ts";
export type { Lifecycle, LifecycleStep, LifecycleSteps, Manifest, MountedPackage } from "./package/manifest.ts";

export { isValidPackageName, packageNameProblem, RESERVED_PACKAGE_NAMES } from "./package/name.ts";

export {
  DATABASE_MOMENTS,
  DECLARES_EXPORT,
  DEPLOY,
  DEPLOY_ENTRIES,
  REQUIRED_DATABASE_MOMENTS,
  SERVICE_FRAGMENTS,
} from "./package/deploy.ts";

export { isPackageDirectory, MANIFEST, MANIFEST_KEYS, PACKAGE_LAYOUT, requiredEntries } from "./package/layout.ts";
export type { PackageDirectory } from "./package/layout.ts";

export { Constraint } from "./package/constraint.ts";
export { Version, VersionError } from "./package/version.ts";

export { DuplicateDeclarationError, Registry } from "./declare/registry.ts";

export { cron, Crons, forgetCrons, installCrons } from "./port/cron.ts";
export type { CronDriver, CronOptions, DeclaredCron, DeclaredSchedule, DeclaredTimeOfDay } from "./port/cron.ts";
export { forgetHooks, hook, Hooks, openHooks } from "./port/hook.ts";
export type { DeclaredHook, HookDriver, HookOptions } from "./port/hook.ts";
export { forgetQueues, installQueues, queue, Queues } from "./port/queue.ts";
export type { DeclaredQueue, DeclaredQueueOptions, QueueDriver, QueueMessage } from "./port/queue.ts";
export { forgetTriggers, installTriggers, trigger, Triggers } from "./port/trigger.ts";
export type {
  Change,
  DeclaredChangeBase,
  DeclaredChangeHandler,
  DeclaredDeleteChange,
  DeclaredFieldChange,
  DeclaredInsertChange,
  DeclaredTransition,
  DeclaredTrigger,
  DeclaredTriggerOp,
  DeclaredTriggerOptions,
  DeclaredUpdateChange,
  TriggerDriver,
} from "./port/trigger.ts";

export { rateLimit, RateLimiters } from "./port/rate_limit.ts";
export type { RateLimiter, RateLimiterDriver, RateLimitOptions, RateLimitOutcome } from "./port/rate_limit.ts";
export { cache, Caches, DEFAULT_CACHE_DEADLINE } from "./port/cache.ts";
export type { Cache, CacheDriver, CacheOptions } from "./port/cache.ts";
export { claimOnce, Claims } from "./port/claim.ts";
export type { ClaimDriver, ClaimOptions, WhenUnavailable } from "./port/claim.ts";

export { FileSystems } from "./port/files.ts";
export type { FileSystem, FileSystemDriver, FileSystemEntity } from "./port/files.ts";

export { Environments } from "./port/env.ts";
export type { Environment } from "./port/env.ts";

export { renderError } from "./diagnostic/render.ts";
export type { RenderOptions } from "./diagnostic/render.ts";
export { foldFrames, framesOf } from "./diagnostic/stack.ts";
export type { Frame } from "./diagnostic/stack.ts";

export { Databases, schema } from "./port/database.ts";
export type {
  ColumnFilter,
  Columns,
  DatabaseDriver,
  DeclaredDatabaseSchema,
  DeclaredFilterSpec,
  DeclaredTableShape,
  Filters,
  OrderOptions,
  Projected,
  Query,
  Tables,
} from "./port/database.ts";

export { ListOf, Nested, Required } from "./api/body/mod.ts";
export type { BodyFromSchema, BodySchema, FormFromSchema, FormSchema, PrimitiveType } from "./api/body/mod.ts";
