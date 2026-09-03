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

import { cacheSettings } from "@scribe/foundation/cache";
import { databaseSettings } from "@scribe/foundation/database";
import { queueSettings } from "@scribe/foundation/queue";
import type { QueueSettings } from "@scribe/foundation";
import { RedisRateLimiters } from "@scribe/foundation/rate_limit";
import { deviceSettings } from "@scribe/runtime/support/settings/device.ts";
import { runMounted } from "@scribe/runtime/support/packages/mounted.ts";
import { firewallSettings } from "@scribe/runtime/support/settings/firewall.ts";
import { httpSettings } from "@scribe/runtime/support/settings/http.ts";
import { identitySettings } from "@scribe/runtime/support/settings/identity.ts";
import type { Command, Environment, FileSystemDriver } from "@scribe/alchemy";
import { Commands, Environments, FileSystems, RateLimiters } from "@scribe/alchemy";
import { LocalCommands as BunCommands } from "@scribe/runtime/scholium/bun/commands.ts";
import { LocalEnvironment as BunEnvironment } from "@scribe/runtime/scholium/bun/env.ts";
import { LocalFileSystems as BunFileSystems } from "@scribe/runtime/scholium/bun/files.ts";
import { LocalListener as BunListener } from "@scribe/runtime/scholium/bun/listener.ts";
import { LocalProcess as BunProcess } from "@scribe/runtime/scholium/bun/process.ts";
import { LocalCommands as DenoCommands } from "@scribe/runtime/scholium/deno/commands.ts";
import { LocalEnvironment as DenoEnvironment } from "@scribe/runtime/scholium/deno/env.ts";
import { LocalFileSystems as DenoFileSystems } from "@scribe/runtime/scholium/deno/files.ts";
import { LocalListener as DenoListener } from "@scribe/runtime/scholium/deno/listener.ts";
import { LocalProcess as DenoProcess } from "@scribe/runtime/scholium/deno/process.ts";
import { environment, required } from "@scribe/runtime/scholium/env.ts";
import { currentStack } from "@scribe/runtime/scholium/host.ts";
import { type Listener, Listeners } from "@scribe/runtime/scholium/listener.ts";
import { type Process, Processes } from "@scribe/runtime/scholium/process.ts";
import { workerSettings } from "@scribe/runtime/support/settings/worker.ts";
import { KNOWN_JWT_ALGORITHMS } from "@scribe/kernel/identity/resolver/jwt_verifier.ts";

/**
 * The `Environment`, `FileSystemDriver` and `Command` this process's own stack provides.
 *
 * @remarks
 * A `node` stack has none yet: `engine/runtime/scholium/bun/` and `.../deno/` are the only two
 * sub-folders this framework ships, and reaching this on any other stack is a boot-time refusal
 * rather than a guess.
 *
 * @throws {Error} When {@link currentStack} answers `node`.
 */
function corePorts(): { environment: Environment; fileSystems: FileSystemDriver; commands: Command } {
  switch (currentStack()) {
    case "deno":
      return { environment: new DenoEnvironment(), fileSystems: new DenoFileSystems(), commands: new DenoCommands() };
    case "bun":
      return { environment: new BunEnvironment(), fileSystems: new BunFileSystems(), commands: new BunCommands() };
    case "node":
      throw new Error(`No scholium implementation ships for the "${currentStack()}" stack yet.`);
  }
}

/**
 * The `Listener` and `Process` this process's own stack provides.
 *
 * @remarks
 * Split from {@link corePorts} because these two wire later in this file, after settings that
 * only need `environment()` to already answer.
 *
 * @throws {Error} When {@link currentStack} answers `node`.
 */
function serverPorts(): { listener: Listener; process: Process } {
  switch (currentStack()) {
    case "deno":
      return { listener: new DenoListener(), process: new DenoProcess() };
    case "bun":
      return { listener: new BunListener(), process: new BunProcess() };
    case "node":
      throw new Error(`No scholium implementation ships for the "${currentStack()}" stack yet.`);
  }
}

const { environment: localEnvironment, fileSystems: localFileSystems, commands: localCommands } = corePorts();
Environments.use(localEnvironment);
FileSystems.use(localFileSystems);
Commands.use(localCommands);

/**
 * The port the persistent runtime listens on when the deployment names none.
 */
const DEFAULT_PORT = 3000;

/**
 * What the body budget falls back to when the deployment names no figure.
 *
 * This was the compiled-in ceiling before the compose learned to size it, so a
 * rendering made by an older CLI keeps the behaviour it already had instead of
 * losing its budget to a zero.
 */
const DEFAULT_MAX_INFLIGHT_BODY_MB = 256;

function maxInflightBodyBytes(): number {
  const declared = Number(environment().get("API_MAX_INFLIGHT_BODY_MB"));
  const megabytes = Number.isFinite(declared) && declared > 0 ? declared : DEFAULT_MAX_INFLIGHT_BODY_MB;

  return megabytes * 1024 * 1024;
}

/**
 * Which broker the queue is declared against, and what that broker needs to reach it.
 *
 * @remarks
 * `QUEUE_DRIVER` defaults to `"nats"`, so a deployment that has never heard of the other two
 * boots exactly as it did before this setting existed. Neither `sqs` nor `pubsub` reads a
 * credential from here: both SDKs resolve one from the identity the compute runs as, which is
 * the point of offering a queue that authenticates by IAM rather than by a secret this settings
 * object would otherwise have to carry.
 *
 * @throws {Error} When `QUEUE_DRIVER` names anything this framework does not carry a driver for.
 */
function queueSettingsFromEnvironment(): QueueSettings {
  const driver = environment().get("QUEUE_DRIVER") || "nats";

  switch (driver) {
    case "nats":
      return { driver: "nats", natsUrl: required("NATS_URL") };
    case "sqs":
      return { driver: "sqs", region: required("AWS_REGION") };
    case "pubsub":
      return { driver: "pubsub", projectId: required("GOOGLE_CLOUD_PROJECT") };
    default:
      throw new Error(
        `QUEUE_DRIVER names "${driver}", which this framework does not know. It knows nats, sqs, pubsub.`,
      );
  }
}

cacheSettings.use({ redisUrl: required("REDIS_URL") });
queueSettings.use(queueSettingsFromEnvironment());
databaseSettings.use({
  restUrl: required("REST_INTERNAL_URL"),
  anonKey: required("ANON_KEY"),
  serviceRoleKey: required("SERVICE_KEY"),
});
/**
 * The algorithms a bearer token may be signed with, as the deployment names them.
 *
 * @remarks
 * A name the framework does not know refuses at boot rather than being dropped: `ES256,RSA256` is
 * a typo that would otherwise narrow the deployment to one algorithm in silence, which is the
 * quietest way to lock every caller out at the next rotation.
 */
function jwtAlgorithms(): readonly string[] {
  const declared = environment().get("JWT_ALGORITHMS");
  if (!declared) return [];

  const named = declared.split(",").map((name) => name.trim()).filter((name) => name !== "");
  const unknown = named.filter((name) => !KNOWN_JWT_ALGORITHMS.includes(name));
  if (unknown.length > 0) {
    throw new Error(
      `JWT_ALGORITHMS names ${unknown.join(", ")}, which this framework cannot verify. ` +
        `It knows ${KNOWN_JWT_ALGORITHMS.join(", ")}.`,
    );
  }

  return named;
}

identitySettings.use({
  authUrl: environment().get("AUTH_INTERNAL_URL"),
  anonKey: required("ANON_KEY"),
  serviceRoleKey: required("SERVICE_KEY"),
  jwtSecret: environment().get("JWT_SECRET"),
  jwtAlgorithms: jwtAlgorithms(),
});
firewallSettings.use({ internalSecret: required("INTERNAL_SECRET") });
deviceSettings.use({ payloadPrivateKeyHex: required("DEVICE_PAYLOAD_PRIVATE_KEY") });
httpSettings.use({
  port: Number(environment().get("PORT") ?? DEFAULT_PORT),
  maxInflightBodyBytes: maxInflightBodyBytes(),
});

const { listener: localListener, process: localProcess } = serverPorts();
Listeners.use(localListener);
Processes.use(localProcess);

RateLimiters.use(new RedisRateLimiters());

const WORKER_CALLBACK_PORT = 4747;

/**
 * The interface the capability port binds to when the deployment names none.
 *
 * Every interface, which is what a container with one network needs. A deployment that has more
 * than one, or that publishes the port, names the address the worker calls instead.
 */
const WORKER_CALLBACK_HOSTNAME = "0.0.0.0";

const WORKER_HANDSHAKE_ATTEMPTS = 10;

const WORKER_HANDSHAKE_DELAY_MS = 1_000;

/**
 * The nodes the gateway routes publicly, as the deployment declares them.
 *
 * Empty when nothing is declared, and empty means the host presumes nothing.
 * It used to fall back to `admin` and `app`, which was a guess about a project
 * it cannot see: a node is named after a folder the project chose, so the two
 * names carried no more truth than any other. A node that declares itself
 * public without appearing here is only warned about; the refusal is reserved
 * for the other direction, a node that declares itself internal while the
 * gateway exposes it.
 */
function publicNodes(): readonly string[] {
  const declared = environment().get("GATEWAY_PUBLIC_NODES");
  if (!declared) return [];

  return declared.split(",").map((name) => name.trim()).filter((name) => name !== "");
}

workerSettings.use({
  endpoint: environment().get("WORKER_ENDPOINT") || null,
  callbackUrl: environment().get("WORKER_CALLBACK_URL") || null,
  callbackPort: Number(environment().get("WORKER_CALLBACK_PORT") ?? WORKER_CALLBACK_PORT),
  callbackHostname: environment().get("WORKER_CALLBACK_HOSTNAME") || WORKER_CALLBACK_HOSTNAME,
  handshakeAttempts: WORKER_HANDSHAKE_ATTEMPTS,
  handshakeDelayMs: WORKER_HANDSHAKE_DELAY_MS,
  publicNodes: publicNodes(),
});

/**
 * Runs the `wires` step of every package the project mounted.
 *
 * `@generated/registrations.ts` carries one entry per package, and the CLI writes it from
 * `config.yaml`. That indirection is the whole point: this file used to wire four modules by name,
 * so adding a fifth meant editing the framework, and a module could not be unmounted without
 * leaving a dangling import behind.
 *
 * Its absence is ordinary rather than an error: a checkout with no project has nothing to register,
 * and every port then answers as it does when nobody registered, each saying so at the first call
 * that needs it, naming itself.
 *
 * A file that exists and throws is the opposite, and the two used to be swallowed together. That
 * left every port unbound without a word: the process boots, listens, answers a health check, and
 * then dies on the first error path that tries to log, because the logger is one of the ports
 * nothing filled. It reads as a healthy start followed by an unexplained exit.
 */
await runMounted("wires");
