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

import { Hono } from "hono";
import { majorOf, PROTOCOL_VERSION } from "@scribe/sdk";
import type { Manifest, NodeDeclaration } from "@scribe/sdk/gen/scribe/protocol/manifest_pb.ts";
import { workerSettings } from "@scribe/core/runtime/support/settings/worker.ts";
import { capabilityServer } from "./capability_server.ts";
import { CapabilityTokens } from "./capability_tokens.ts";
import { mountManifest, NodeMountError } from "./mount.ts";
import { NodeSurfaces } from "./node_surfaces.ts";
import { WorkerClient } from "./worker_client.ts";

const BOOTSTRAP_TTL_MS = 86_400_000;

const BOOTSTRAP_REQUEST = new Request("http://worker.bootstrap/");

export interface HostSurfaces {
  readonly admin: Hono;
  readonly app: Hono;
}

let attached: Manifest | null = null;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handshake(client: WorkerClient, token: string): Promise<Manifest> {
  const { callbackUrl, handshakeAttempts, handshakeDelayMs } = workerSettings.get();

  let last: unknown = null;
  for (let attempt = 1; attempt <= handshakeAttempts; attempt += 1) {
    try {
      return await client.describe(callbackUrl, token);
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

function resolver(surfaces: HostSurfaces): (node: NodeDeclaration) => Hono {
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

    if (node.name === "admin") return surfaces.admin;
    if (node.name === "app") return surfaces.app;

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

  async attach(surfaces: HostSurfaces): Promise<void> {
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

    const mounted = mountManifest(resolver(surfaces), manifest, client);
    attached = manifest;

    const described = manifest.nodes
      .map((node) => `${node.name}${node.public ? "" : " (internal)"}`)
      .join(", ");

    console.log(
      `[worker-host] ${manifest.workerLanguage} worker attached: ${mounted} routes on ${described}, ` +
        `${manifest.queues.length} queues, ${manifest.hooks.length} hooks, ${manifest.crons.length} crons.`,
    );
  },
};
