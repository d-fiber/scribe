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

import { Registration } from "../../gen/scribe/protocol/manifest_pb.ts";
import { Worker as WorkerService } from "../../gen/scribe/protocol/invocation_pb.ts";
import { QueueDispatch } from "../../gen/scribe/packages/foundation/protocol/queue_pb.ts";
import { HookDispatch } from "../../gen/scribe/packages/foundation/protocol/hook_pb.ts";
import { CronDispatch } from "../../gen/scribe/packages/foundation/protocol/cron_pb.ts";
import { LogDispatch } from "../../gen/scribe/protocol/logs_pb.ts";
import { host } from "../capabilities/channel.ts";
import { describeWorker } from "../manifest/encode.ts";
import type { WorkerDefinition } from "../manifest/worker.ts";
import { PROTOCOL_VERSION, speaksSameContract } from "../protocol/version.ts";
import { TransportFailure } from "../transport/failure.ts";
import { UnaryServer } from "../transport/server.ts";
import { deliverLogs, handleBatch, handleEvent, invoke, triggerCron } from "./dispatch.ts";
import { CallScope } from "./scope.ts";

export interface ServeOptions {
  readonly port?: number;
  readonly hostname?: string;
  readonly signal?: AbortSignal;
  readonly onListen?: (address: { port: number; hostname: string }) => void;
}

interface ServeRuntime {
  serve(
    options: {
      port: number;
      hostname: string;
      signal?: AbortSignal;
      onListen?: (address: { port: number; hostname: string }) => void;
    },
    handler: (request: Request) => Promise<Response>,
  ): { finished: Promise<void> };
}

const DEFAULT_PORT = 8787;

const DEFAULT_HOSTNAME = "0.0.0.0";

export function workerServer(worker: WorkerDefinition): UnaryServer {
  return new UnaryServer()
    .on(Registration.method.describe, (handshake) => {
      if (!speaksSameContract(handshake.hostProtocolVersion)) {
        throw TransportFailure.badRequest(
          `Host speaks protocol ${handshake.hostProtocolVersion}, this worker speaks ${PROTOCOL_VERSION}.`,
        );
      }

      if (handshake.hostEndpoint !== "") host.connect(handshake.hostEndpoint);

      CallScope.adopt({
        capabilityToken: handshake.capabilityToken,
        traceId: "",
        invocationId: "",
        node: "",
      });

      return describeWorker(worker);
    })
    .on(WorkerService.method.invoke, (invocation) => invoke(worker, invocation))
    .on(QueueDispatch.method.handle, (batch) => handleBatch(worker, batch))
    .on(HookDispatch.method.handle, (event) => handleEvent(worker, event))
    .on(CronDispatch.method.trigger, (trigger) => triggerCron(worker, trigger))
    .on(LogDispatch.method.handle, (delivery) => deliverLogs(worker, delivery));
}

export function workerHandler(
  worker: WorkerDefinition,
): (request: Request) => Promise<Response> {
  const server = workerServer(worker);
  return (request) => server.handle(request);
}

export function serveWorker(
  worker: WorkerDefinition,
  options: ServeOptions = {},
): Promise<void> {
  const handler = workerHandler(worker);
  const port = options.port ?? DEFAULT_PORT;
  const hostname = options.hostname ?? DEFAULT_HOSTNAME;

  const server = serveRuntime().serve(
    {
      port,
      hostname,
      signal: options.signal,
      onListen: options.onListen ?? announce,
    },
    handler,
  );

  return server.finished;
}

function announce(address: { port: number; hostname: string }): void {
  console.log(`[worker] listening on ${address.hostname}:${address.port}`);
}

function serveRuntime(): ServeRuntime {
  const candidate = (globalThis as { Deno?: ServeRuntime }).Deno;
  if (!candidate) {
    throw TransportFailure.internal(
      "This runtime cannot serve the worker on its own: use workerHandler() to plug it into a server.",
    );
  }
  return candidate;
}
