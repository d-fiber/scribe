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
import { ServerResponse } from "@scribe/alchemy/route";
import { environment } from "@scribe/runtime/scholium/env.ts";
import { FRAMEWORK_SECRETS } from "@scribe/contracts/secrets.ts";
import { readBoundedBody } from "@scribe/kernel/http/serve/body_reader.ts";
import { MAX_BODY_BYTES } from "@scribe/runtime/http/limits.ts";
import type { EdgePlatform } from "../platform.ts";
import type { WorkerDispatcher } from "./worker_dispatcher.ts";

export interface WorkerLimits {
  /** The memory ceiling given to the worker, in megabytes. */
  readonly memoryLimitMb: number;

  /** How long the worker has to answer before it is killed, in milliseconds. */
  readonly workerTimeoutMs: number;

  /** The import map path the worker resolves its imports against. */
  readonly importMapPath: string;
}

/**
 * The headers this side keeps, whatever the caller sent.
 *
 * @remarks
 * `x-internal-secret` is what proves a call comes from inside the deployment, and a function that
 * echoed it or wrote it to a log would hand any caller the `service` role everywhere. The worker is
 * the endpoint here, so the rest of what arrived is what it is answering and travels on.
 */
const WITHHELD_HEADERS: ReadonlySet<string> = new Set(["x-internal-secret"]);

/** `environment` without the variables the framework owns. */
function withoutSecrets(environment: readonly string[][]): string[][] {
  return environment.filter(([name]) => !FRAMEWORK_SECRETS.has(name)).map((pair) => [...pair]);
}

export class EdgeWorkerDispatcher implements WorkerDispatcher {
  readonly #platform: EdgePlatform;
  readonly #limits: WorkerLimits;
  readonly #envVars: string[][];

  constructor(
    platform: EdgePlatform,
    limits: WorkerLimits,
    envVars: string[][] = Object.entries(environment().toObject()),
  ) {
    this.#platform = platform;
    this.#limits = limits;
    this.#envVars = withoutSecrets(envVars);
  }

  async dispatch(request: Request, servicePath: string): Future<Response> {
    try {
      const forwarded = await this.#forward(request);
      if (forwarded === null) return ServerResponse.payloadTooLarge();

      const worker = await this.#platform.createWorker({
        servicePath,
        memoryLimitMb: this.#limits.memoryLimitMb,
        workerTimeoutMs: this.#limits.workerTimeoutMs,
        noModuleCache: false,
        importMapPath: this.#limits.importMapPath,
        envVars: this.#envVars,
      });

      this.#platform.tagRequest(request, forwarded);
      return await worker.fetch(forwarded);
    } catch (error) {
      console.error("[shell:edge] worker dispatch failed:", error);
      return ServerResponse.unexpected({ code: "internal_error" });
    }
  }

  /**
   * The request as the worker will see it, or `null` when its body is past what is accepted.
   *
   * @remarks
   * The body is read into memory here, and until it was bounded a caller decided how much: nothing
   * on this path is the admission control of `kernel/http/serve/`, which guards the other process.
   * The bound is the same hard ceiling, so what the gateway already refuses is refused here too,
   * and what reaches this side by another road no longer chooses its own size.
   *
   * Reading it also has to happen before a worker is asked for, or a refused body has already cost
   * an isolate.
   */
  async #forward(request: Request): Future<Request | null> {
    const carriesBody = request.method !== "GET" && request.method !== "HEAD";
    if (!carriesBody) return this.#rebuilt(request, null);

    const intake = await readBoundedBody(request, MAX_BODY_BYTES);
    if (!intake.ok) return null;

    return this.#rebuilt(request, intake.bytes);
  }

  #rebuilt(request: Request, body: Uint8Array | null): Request {
    const headers = new Headers();
    request.headers.forEach((value, name) => {
      if (!WITHHELD_HEADERS.has(name.toLowerCase())) headers.set(name, value);
    });
    headers.set("x-request-start", String(Date.now()));

    return new Request(request.url, {
      method: request.method,
      headers,
      body: body === null || body.byteLength === 0 ? null : (body as BodyInit),
    });
  }
}
