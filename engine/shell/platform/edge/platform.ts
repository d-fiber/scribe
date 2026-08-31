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

import type { Future } from "@scribe/alchemy";

/**
 * A running worker isolate, answering requests handed to it one at a time.
 *
 * @remarks
 * `fetch` is the whole surface because it is the whole surface the platform's own isolate exposes:
 * this interface names nothing the edge platform does not already give back from
 * `EdgeRuntime.userWorkers.create`, so the dispatcher that calls it never has to know it is
 * talking to a vendor object rather than one of our own.
 */
export interface EdgeWorker {
  fetch(request: Request): Future<Response>;
}

/**
 * What spinning up an {@link EdgeWorker} isolate takes.
 *
 * @remarks
 * Mirrors the shape `EdgeRuntime.userWorkers.create` itself accepts, field for field, so that
 * building one of these is the whole job of turning an {@link EdgeConfig} and a resolved service
 * into a call the platform understands, with nothing left to translate at the call site.
 */
export interface EdgeWorkerOptions {
  /** The on-disk path of the service this worker serves, under the functions root. */
  readonly servicePath: string;

  /** The memory ceiling given to this worker isolate, in megabytes. */
  readonly memoryLimitMb: number;

  /** How long this worker isolate has to answer before it is killed, in milliseconds. */
  readonly workerTimeoutMs: number;

  /** Whether this worker skips the platform's module cache, forcing every import to resolve fresh. */
  readonly noModuleCache: boolean;

  /** The import map this worker resolves its imports against, or `null` to use the platform default. */
  readonly importMapPath: string | null;

  /** The environment variables this worker starts with, each entry a `[name, value]` pair. */
  readonly envVars: string[][];
}

/**
 * What this edge host offers: spinning up a worker isolate, and tagging a request forwarded to one.
 *
 * @remarks
 * The seam exists so that nothing else in `engine/shell/platform/edge/` names the global
 * `EdgeRuntime` directly. That global is injected by the vendor's own runtime, not something a
 * test can construct, so `EdgeFunctionsRuntime` is built against this interface and a test hands
 * it a fake instead of needing the real edge environment to run at all.
 */
export interface EdgePlatform {
  createWorker(options: EdgeWorkerOptions): Future<EdgeWorker>;

  /**
   * Ties `forwarded`, the request actually sent to the worker, back to `original`, the one the
   * caller sent, in whatever way the platform's own observability tooling expects.
   *
   * @remarks
   * The dispatcher builds `forwarded` as a new `Request` object, so without this call the platform
   * has no way to know the two are the same invocation: a trace that ends at `original` and a
   * worker log that starts at `forwarded` would read as two unrelated events instead of one
   * request's path through the system.
   */
  tagRequest(original: Request, forwarded: Request): void;
}

declare const EdgeRuntime: {
  userWorkers: {
    create(options: EdgeWorkerOptions): Future<EdgeWorker>;
  };
  applySupabaseTag(original: Request, forwarded: Request): void;
};

/**
 * The {@link EdgePlatform} this deployment runs on.
 *
 * @remarks
 * `EdgeRuntime` is not imported: it is a global the platform's own runtime injects before this
 * module runs, declared here only so the compiler knows its shape. Wrapping it in a class rather
 * than reaching it directly is what lets `EdgeFunctionsRuntime` depend on {@link EdgePlatform}
 * instead, and never notice the difference between the real thing and a test double.
 */
export class SupabaseEdgePlatform implements EdgePlatform {
  /**
   * The {@link EdgePlatform.createWorker} implementation.
   *
   * @remarks
   * Delegates straight to the platform's own `userWorkers.create`, since `EdgeWorkerOptions` was
   * already shaped to match what that call expects: there is nothing left for this method to
   * translate, only to name.
   */
  createWorker(options: EdgeWorkerOptions): Future<EdgeWorker> {
    return EdgeRuntime.userWorkers.create(options);
  }

  /**
   * The {@link EdgePlatform.tagRequest} implementation.
   *
   * @remarks
   * Delegates to the platform's own `applySupabaseTag`, the specific mechanism this vendor's
   * runtime exposes for linking a forwarded request back to the one that arrived; a platform with
   * a different tracing hook would only need a new {@link EdgePlatform}, never a change here.
   */
  tagRequest(original: Request, forwarded: Request): void {
    EdgeRuntime.applySupabaseTag(original, forwarded);
  }
}
