// Copyright (C) 2026 Fiber
//
// This file is part of scribe and is made available under the PolyForm Shield
// License 1.0.0. The full terms are in the LICENSE file at the root of this
// repository, and at https://polyformproject.org/licenses/shield/1.0.0
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
//
// The one thing you may not do:
// - Use it to provide any product that competes with scribe, or with any
//   product Fiber or its affiliates provide using scribe. Products compete
//   even when they are offered free of charge, through a different kind of
//   interface, or for a different technical platform.
//
// If you pass this software on:
// - Anyone who receives any part of it from you must also receive these terms,
//   or the URL above, together with the "Required Notice" line carried by the
//   LICENSE file.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE COMES AS IS, WITHOUT ANY WARRANTY OR
// CONDITION, AND THE LICENSOR WILL NOT BE LIABLE TO YOU FOR ANY DAMAGES ARISING
// OUT OF THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY KIND OF
// LEGAL CLAIM.
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
