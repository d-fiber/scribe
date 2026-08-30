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

export interface EdgeWorker {
  fetch(request: Request): Future<Response>;
}

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

export interface EdgePlatform {
  createWorker(options: EdgeWorkerOptions): Future<EdgeWorker>;
  tagRequest(original: Request, forwarded: Request): void;
}

declare const EdgeRuntime: {
  userWorkers: {
    create(options: EdgeWorkerOptions): Future<EdgeWorker>;
  };
  applySupabaseTag(original: Request, forwarded: Request): void;
};

export class SupabaseEdgePlatform implements EdgePlatform {
  createWorker(options: EdgeWorkerOptions): Future<EdgeWorker> {
    return EdgeRuntime.userWorkers.create(options);
  }

  tagRequest(original: Request, forwarded: Request): void {
    EdgeRuntime.applySupabaseTag(original, forwarded);
  }
}
