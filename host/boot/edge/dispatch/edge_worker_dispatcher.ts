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

import { ServerResponse } from "@scribe/core/kernel/http/response/json.ts";
import type { EdgePlatform } from "../platform.ts";
import type { WorkerDispatcher } from "./worker_dispatcher.ts";

export interface WorkerLimits {
  readonly memoryLimitMb: number;
  readonly workerTimeoutMs: number;
  readonly importMapPath: string;
}

export class EdgeWorkerDispatcher implements WorkerDispatcher {
  readonly #platform: EdgePlatform;
  readonly #limits: WorkerLimits;
  readonly #envVars: string[][];

  constructor(
    platform: EdgePlatform,
    limits: WorkerLimits,
    envVars: string[][] = Object.entries(Deno.env.toObject()),
  ) {
    this.#platform = platform;
    this.#limits = limits;
    this.#envVars = envVars;
  }

  async dispatch(request: Request, servicePath: string): Promise<Response> {
    try {
      const worker = await this.#platform.createWorker({
        servicePath,
        memoryLimitMb: this.#limits.memoryLimitMb,
        workerTimeoutMs: this.#limits.workerTimeoutMs,
        noModuleCache: false,
        importMapPath: this.#limits.importMapPath,
        envVars: this.#envVars,
      });

      const forwarded = await this.#forward(request);
      this.#platform.tagRequest(request, forwarded);
      return await worker.fetch(forwarded);
    } catch (error) {
      console.error("[boot:edge] worker dispatch failed:", error);
      return ServerResponse.unexpected({ code: "internal_error" });
    }
  }

  async #forward(request: Request): Promise<Request> {
    const carriesBody = request.method !== "GET" && request.method !== "HEAD";
    return new Request(request.url, {
      method: request.method,
      headers: new Headers({
        ...Object.fromEntries(request.headers),
        "x-request-start": String(Date.now()),
      }),
      body: carriesBody ? await request.arrayBuffer() : null,
    });
  }
}
