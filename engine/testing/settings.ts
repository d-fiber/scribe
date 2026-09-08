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
import { scribe } from "@scribe/foundation";
import { queueSettings } from "@scribe/foundation/queue";
import { deviceSettings, firewallSettings, httpSettings, identitySettings } from "@scribe/runtime/settings.ts";
import type { Command, Environment, FileSystemDriver } from "@scribe/alchemy";
import { Commands, Environments, FileSystems } from "@scribe/alchemy";
import { LocalCommands as BunCommands } from "@scribe/scholium/bun/commands.ts";
import { LocalEnvironment as BunEnvironment } from "@scribe/scholium/bun/env.ts";
import { LocalFileSystems as BunFileSystems } from "@scribe/scholium/bun/files.ts";
import { LocalCommands as DenoCommands } from "@scribe/scholium/deno/commands.ts";
import { LocalEnvironment as DenoEnvironment } from "@scribe/scholium/deno/env.ts";
import { LocalFileSystems as DenoFileSystems } from "@scribe/scholium/deno/files.ts";
import { environment, optional } from "@scribe/scholium/env.ts";
import { currentStack } from "@scribe/scholium/host.ts";
import { pickStack } from "@scribe/scholium/stack.ts";
import { testRegistrar } from "./registrar.ts";

/**
 * The `Environment`, `FileSystemDriver` and `Command` this process's own stack provides.
 *
 * @remarks
 * A `node` stack has none yet: `engine/scholium/bun/` and `.../deno/` are the only two
 * sub-folders this framework ships, and reaching this on any other stack is a refusal rather than
 * a guess.
 *
 * @throws {Error} When {@link currentStack} answers `node`.
 */
function corePorts(): { environment: Environment; fileSystems: FileSystemDriver; commands: Command } {
  return pickStack<{ environment: Environment; fileSystems: FileSystemDriver; commands: Command }>(
    {
      deno: () => ({
        environment: new DenoEnvironment(),
        fileSystems: new DenoFileSystems(),
        commands: new DenoCommands(),
      }),
      bun: () => ({
        environment: new BunEnvironment(),
        fileSystems: new BunFileSystems(),
        commands: new BunCommands(),
      }),
    },
    `No scholium implementation ships for the "${currentStack()}" stack yet.`,
  );
}

/**
 * Fills every settings slot a suite needs from the environment, with a local fallback for each,
 * and does nothing on a second call.
 *
 * @remarks
 * The guard is `cacheSettings.configured`: once one slot is filled, all of them are, so a suite
 * that wired its own settings before importing this module is left alone rather than overwritten.
 * This runs at import, the last line of the file calling it directly, because a slot refuses to
 * be read before something calls `.use()` on it and a test cannot be trusted to call this itself
 * before touching a setting.
 */
export function installTestSettings(): void {
  if (cacheSettings.configured) return;

  const { environment: localEnvironment, fileSystems: localFileSystems, commands: localCommands } = corePorts();
  Environments.use(localEnvironment);
  FileSystems.use(localFileSystems);
  Commands.use(localCommands);

  scribe.registerWith?.(testRegistrar);

  cacheSettings.use({ redisUrl: optional("REDIS_URL", "redis://localhost:6379") });
  queueSettings.use({ natsUrl: optional("NATS_URL", "nats://localhost:4222") });
  databaseSettings.use({
    restUrl: optional("REST_INTERNAL_URL", "http://localhost:3000"),
    anonKey: optional("ANON_KEY", "anon"),
    serviceRoleKey: optional("SERVICE_KEY", "service"),
  });
  identitySettings.use({
    authUrl: optional("AUTH_INTERNAL_URL", "http://localhost:9999"),
    anonKey: optional("ANON_KEY", "anon"),
    serviceRoleKey: optional("SERVICE_KEY", "service"),
    jwtSecret: environment().get("JWT_SECRET"),
    jwtAlgorithms: [],
  });
  firewallSettings.use({ internalSecret: optional("INTERNAL_SECRET", "internal") });
  deviceSettings.use({
    payloadPrivateKeyHex: optional("DEVICE_PAYLOAD_PRIVATE_KEY", ""),
  });
  httpSettings.use({
    port: Number(optional("PORT", "3000")),
    maxInflightBodyBytes: Number(optional("API_MAX_INFLIGHT_BODY_MB", "256")) * 1024 * 1024,
  });
}

installTestSettings();
