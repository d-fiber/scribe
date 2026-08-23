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

export { Future, unawaited } from "./src/async/future.ts";
export type { FutureOr } from "./src/async/future.ts";
export { Completer } from "./src/async/stream.ts";
export type { Stream } from "./src/async/stream.ts";
export { Bytes } from "./src/value/bytes.ts";
export type { Comparable } from "./src/value/comparable.ts";
export { DateTime, Now } from "./src/value/date_time.ts";
export type { NowSource } from "./src/value/date_time.ts";
export { Duration } from "./src/value/duration.ts";
export type { LatLng } from "./src/value/lat_lng.ts";
export type { List, UnmodifiableList } from "./src/value/list.ts";
export { Stopwatch } from "./src/value/stopwatch.ts";
export type { Uri } from "./src/value/uri.ts";
export { Uuid, Uuids } from "./src/value/uuid.ts";
export type { UuidSource } from "./src/value/uuid.ts";
export type { Expando, Finalizer, WeakReference } from "./src/value/weak.ts";

export { Pagination } from "./src/value/pagination.ts";
export type { PaginationJson } from "./src/value/pagination.ts";
export { Failure, Ok, okay } from "./src/value/result.ts";
export type { Result } from "./src/value/result.ts";

export { BindingError, Slot } from "./src/bind/slot.ts";

export { base64, base64Url, hex, json, utf8 } from "./src/value/convert.ts";
export type { Codec } from "./src/value/convert.ts";

export { ExponentialBackoff } from "./src/async/backoff.ts";
export { TimeoutException, withDeadline } from "./src/async/deadline.ts";
export { runPooled } from "./src/async/pool.ts";
export { Semaphore } from "./src/async/semaphore.ts";
export type { Release } from "./src/async/semaphore.ts";

export { Current, Currents } from "./src/scope/current.ts";
export type { CurrentDriver, CurrentStore } from "./src/scope/current.ts";

export { FormatException } from "./src/error/format_exception.ts";
export { Refusal, REFUSAL_KINDS } from "./src/error/refusal.ts";
export type { RefusalKind } from "./src/error/refusal.ts";
export { ScribeError } from "./src/error/scribe_error.ts";

export { DeclarationError, DEFAULT_DESCRIPTION, Package } from "./src/package/package.ts";
export type {
  AwaitingDependencies,
  AwaitingDescription,
  AwaitingFramework,
  AwaitingVersion,
  Buildable,
  Dependencies,
} from "./src/package/package.ts";

export { mount } from "./src/package/manifest.ts";
export type { Lifecycle, LifecycleStep, LifecycleSteps, Manifest, MountedPackage } from "./src/package/manifest.ts";

export { isValidPackageName, packageNameProblem, RESERVED_PACKAGE_NAMES } from "./src/package/name.ts";

export { isPackageDirectory, MANIFEST, MANIFEST_KEYS, PACKAGE_LAYOUT, requiredEntries } from "./src/package/layout.ts";
export type { PackageDirectory } from "./src/package/layout.ts";

export { Constraint } from "./src/package/constraint.ts";
export { Version, VersionError } from "./src/package/version.ts";

export { DuplicateDeclarationError, Registry } from "./src/declare/registry.ts";

export { cron, Crons, forgetCrons, installCrons } from "./src/port/cron.ts";
export type { Cron, CronDriver, CronOptions, Schedule, TimeOfDay } from "./src/port/cron.ts";
export { forgetHooks, hook, Hooks, openHooks } from "./src/port/hook.ts";
export type { Hook, HookDriver, HookOptions } from "./src/port/hook.ts";
export { forgetQueues, installQueues, queue, Queues } from "./src/port/queue.ts";
export type { Queue, QueueDriver, QueueMessage, QueueOptions } from "./src/port/queue.ts";
export { forgetTriggers, installTriggers, trigger, Triggers } from "./src/port/trigger.ts";
export type {
  Change,
  ChangeBase,
  ChangeHandler,
  DeleteChange,
  FieldChange,
  InsertChange,
  Transition,
  Trigger,
  TriggerDriver,
  TriggerOp,
  TriggerOptions,
  UpdateChange,
} from "./src/port/trigger.ts";

export { rateLimit, RateLimiters } from "./src/port/rate_limit.ts";
export type { RateLimiter, RateLimiterDriver, RateLimitOptions, RateLimitOutcome } from "./src/port/rate_limit.ts";
export { cache, Caches, DEFAULT_CACHE_DEADLINE } from "./src/port/cache.ts";
export type { Cache, CacheDriver, CacheOptions } from "./src/port/cache.ts";

export { FileSystems } from "./src/port/files.ts";
export type { FileSystem, FileSystemDriver, FileSystemEntity } from "./src/port/files.ts";

export { renderError } from "./src/diagnostic/render.ts";
export type { RenderOptions } from "./src/diagnostic/render.ts";
export { foldFrames, framesOf } from "./src/diagnostic/stack.ts";
export type { Frame } from "./src/diagnostic/stack.ts";

export { Databases, schema } from "./src/port/database.ts";
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
  Tables,
  TableShape,
} from "./src/port/database.ts";

export { ListOf, Nested, Required } from "./src/api/body/mod.ts";
export type { BodyFromSchema, BodySchema, FormFromSchema, FormSchema, PrimitiveType } from "./src/api/body/mod.ts";
