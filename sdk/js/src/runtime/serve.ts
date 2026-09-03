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

/** How the worker's server binds and how it can be shut down. */
export interface ServeOptions {
  /** The port to listen on. Left to the runtime's own default when omitted. */
  readonly port?: number;

  /** The host address to bind to. Left to the runtime's own default when omitted. */
  readonly hostname?: string;

  /** A signal that shuts the server down when aborted. Runs until the process exits when omitted. */
  readonly signal?: AbortSignal;

  /** Called once the server is actually bound and listening. */
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

/** The path an orchestrator asks for to know whether this worker is up. */
const HEALTH_PATH = "/_health";

/**
 * Wires `worker`'s dispatch methods, registration, invocation, queue, hook, cron and log delivery,
 * onto a fresh {@link UnaryServer}.
 *
 * @remarks
 * The registration handshake is refused outright when the host speaks a different protocol
 * version, since nothing past that point could be trusted to decode correctly. Every other
 * handler runs its own `CallScope.run` for the one call it is answering, but the handshake itself
 * happens before any of those, so it also `adopt`s the token it was handed as the process-wide
 * fallback `CallScope.current` reads when nothing more specific is in flight.
 */
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
        hostEndpoint: handshake.hostEndpoint,
        node: "",
      });

      return describeWorker(worker);
    })
    .on(WorkerService.method.invoke, (invocation, call) => invoke(worker, invocation, call.hostEndpoint))
    .on(QueueDispatch.method.handle, (batch, call) => handleBatch(worker, batch, call.hostEndpoint))
    .on(HookDispatch.method.handle, (event, call) => handleEvent(worker, event, call.hostEndpoint))
    .on(CronDispatch.method.trigger, (trigger, call) => triggerCron(worker, trigger, call.hostEndpoint))
    .on(LogDispatch.method.handle, (delivery) => deliverLogs(worker, delivery));
}

/**
 * The handler a worker answers every request with.
 *
 * `GET /_health` is answered here rather than by the protocol server: the port
 * speaks the registration protocol, which is POST only, so an orchestrator
 * probing it with a plain GET is told the method is not allowed and never sees
 * the worker come up, however well it is running.
 */
export function workerHandler(
  worker: WorkerDefinition,
): (request: Request) => Promise<Response> {
  const server = workerServer(worker);

  return (request) => {
    if (request.method === "GET" && new URL(request.url).pathname === HEALTH_PATH) {
      return Promise.resolve(new Response("ok", { headers: { "content-type": "text/plain" } }));
    }

    return server.handle(request);
  };
}

/**
 * Serves `worker` over HTTP, port and hostname read from `options` or their defaults, until the
 * server stops.
 *
 * @remarks
 * `ScribeServer` calls this to actually bind and listen. It only runs on a runtime `serveRuntime`
 * recognizes; `workerHandler` is the escape hatch for embedding the same request handling inside a
 * server this function does not know how to start on its own.
 */
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

/**
 * The runtime's own `serve`, read off `globalThis` rather than imported, so this file loads
 * without error on a runtime that has no such global.
 *
 * @remarks
 * `Deno.serve` is the only implementation this looks for today, but reading it dynamically rather
 * than importing `Deno` directly is what lets {@link workerHandler} still work as a plain fetch
 * handler on a runtime that has no global server to bind, without this function's own absence
 * breaking that path.
 */
function serveRuntime(): ServeRuntime {
  const candidate = (globalThis as { Deno?: ServeRuntime }).Deno;
  if (!candidate) {
    throw TransportFailure.internal(
      "This runtime cannot serve the worker on its own: use workerHandler() to plug it into a server.",
    );
  }
  return candidate;
}
