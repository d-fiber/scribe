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

import { Registration } from "../../gen/scribe/protocol/manifest_pb.ts";
import { Worker as WorkerService } from "../../gen/scribe/protocol/invocation_pb.ts";
import { QueueDispatch } from "../../gen/scribe/host/core/runtime/event_driven/queue/protocol/queue_pb.ts";
import { HookDispatch } from "../../gen/scribe/host/core/runtime/event_driven/hook/protocol/hook_pb.ts";
import { CronDispatch } from "../../gen/scribe/host/core/runtime/event_driven/cron/protocol/cron_pb.ts";
import { host } from "../capabilities/channel.ts";
import { describeWorker } from "../manifest/encode.ts";
import type { WorkerDefinition } from "../manifest/worker.ts";
import { PROTOCOL_VERSION, speaksSameContract } from "../protocol/version.ts";
import { TransportFailure } from "../transport/failure.ts";
import { UnaryServer } from "../transport/server.ts";
import { handleBatch, handleEvent, invoke, triggerCron } from "./dispatch.ts";
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
      });

      return describeWorker(worker);
    })
    .on(WorkerService.method.invoke, (invocation) => invoke(worker, invocation))
    .on(QueueDispatch.method.handle, (batch) => handleBatch(worker, batch))
    .on(HookDispatch.method.handle, (event) => handleEvent(worker, event))
    .on(CronDispatch.method.trigger, (trigger) => triggerCron(worker, trigger));
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
