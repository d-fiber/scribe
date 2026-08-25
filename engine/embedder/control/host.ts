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

import { Hono } from "hono";
import { majorOf, PROTOCOL_VERSION } from "@scribe/sdk";
import type { Manifest, NodeDeclaration } from "@scribe/sdk/gen/scribe/protocol/manifest_pb.ts";
import { workerSettings } from "@scribe/runtime/support/settings/worker.ts";
import { capabilityServer } from "../capabilities/server.ts";
import { CapabilityTokens } from "../capabilities/tokens.ts";
import { LogRoutes } from "@scribe/kernel/observability/log_routing.ts";
import { WorkerLogSinks } from "./log_sinks.ts";
import { mountManifest, NodeMountError } from "./mount.ts";
import { NodeSurfaces } from "./node_surfaces.ts";
import { WorkerClient } from "./client.ts";

const BOOTSTRAP_TTL_MS = 86_400_000;

const BOOTSTRAP_REQUEST = new Request("http://worker.bootstrap/");

let attached: Manifest | null = null;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ownCallbackUrl(port: number): string {
  return `http://${Deno.hostname()}:${port}`;
}

async function handshake(client: WorkerClient, token: string): Promise<Manifest> {
  const { callbackUrl, callbackPort, handshakeAttempts, handshakeDelayMs } = workerSettings.get();
  const address = callbackUrl ?? ownCallbackUrl(callbackPort);
  console.log(`[worker-host] announcing ${address} as this replica's callback address`);

  let last: unknown = null;
  for (let attempt = 1; attempt <= handshakeAttempts; attempt += 1) {
    try {
      return await client.describe(address, token);
    } catch (cause) {
      last = cause;
      console.warn(`[worker-host] handshake attempt ${attempt} failed, retrying.`);
      await wait(handshakeDelayMs);
    }
  }

  const message = last instanceof Error ? last.message : String(last);
  throw new Error(`[worker-host] the worker never answered Describe: ${message}`);
}

function rejectIncompatible(manifest: Manifest): void {
  if (majorOf(manifest.protocolVersion) === majorOf(PROTOCOL_VERSION)) return;

  throw new Error(
    `[worker-host] the worker speaks protocol ${manifest.protocolVersion}, the host speaks ${PROTOCOL_VERSION}.`,
  );
}

/**
 * The app a node is mounted on, one fresh Hono per node.
 *
 * Every node is treated alike. The host used to hand back two apps of its own
 * for the nodes called `admin` and `app`, because it served endpoints there
 * itself; it serves none now, so a name carries no privilege and a project
 * names its nodes as it likes.
 */
function resolver(): (node: NodeDeclaration) => Hono {
  const exposed = new Set(workerSettings.get().publicNodes);

  return (node) => {
    if (exposed.has(node.name) && !node.public) {
      throw new NodeMountError(
        `The node "${node.name}" declares itself internal, but the gateway exposes /${node.name} publicly.`,
      );
    }

    if (node.public && !exposed.has(node.name)) {
      console.warn(
        `[worker-host] node "${node.name}" is public but the gateway has no route for /${node.name}: ` +
          `it stays unreachable from outside until one is declared.`,
      );
    }

    const app = new Hono();
    NodeSurfaces.register(node.name, app);
    return app;
  };
}

export const WorkerHost = {
  enabled(): boolean {
    return workerSettings.configured && workerSettings.get().endpoint !== null;
  },

  manifest(): Manifest | null {
    return attached;
  },

  async attach(): Promise<void> {
    const settings = workerSettings.get();
    const endpoint = settings.endpoint;
    if (endpoint === null) return;

    const server = capabilityServer();
    Deno.serve(
      { port: settings.callbackPort, hostname: "0.0.0.0" },
      (request) => server.handle(request),
    );

    const token = CapabilityTokens.issue(
      {
        request: BOOTSTRAP_REQUEST,
        bodyBytes: new Uint8Array(),
        identity: null,
        traceId: "",
        invocationId: "",
      },
      BOOTSTRAP_TTL_MS,
    );

    const client = new WorkerClient(endpoint);
    const manifest = await handshake(client, token);
    rejectIncompatible(manifest);

    const mounted = mountManifest(resolver(), manifest, client);
    attached = manifest;
    LogRoutes.use(new WorkerLogSinks(client, manifest));

    const described = manifest.nodes
      .map((node) => `${node.name}${node.public ? "" : " (internal)"}`)
      .join(", ");

    console.log(
      `[worker-host] ${manifest.workerLanguage} worker attached: ${mounted} routes on ${described}, ` +
        `${manifest.queues.length} queues, ${manifest.hooks.length} hooks, ${manifest.crons.length} crons.`,
    );

    const sinks = manifest.nodes.filter((node) => node.logSink).map((node) => node.name);
    if (sinks.length > 0 || manifest.rootLogSink) {
      console.log(
        `[worker-host] the project takes its own logs: ${
          [...sinks, ...(manifest.rootLogSink ? ["the project root"] : [])].join(", ")
        }.`,
      );
    }
  },
};
