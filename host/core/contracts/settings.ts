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


export interface CacheSettings {
  readonly redisUrl: string;
}

export interface QueueSettings {
  readonly natsUrl: string;
}

export interface StorageSettings {
  readonly apiUrl: string;
  readonly serviceRoleKey: string;
  readonly publicBaseUrl: string;
  readonly privateBaseUrl: string;
}

export interface DatabaseSettings {
  readonly restUrl: string;
  readonly anonKey: string;
  readonly serviceRoleKey: string;
}

export interface IdentitySettings {
  readonly authUrl: string;
  readonly anonKey: string;
  readonly serviceRoleKey: string;
  readonly jwtSecret: string | undefined;
}

export interface FirewallSettings {
  readonly internalSecret: string;
}

export interface DeviceSettings {
  readonly payloadPrivateKeyHex: string;
}

export interface HttpSettings {
  readonly port: number;

  /**
   * The ceiling on request body bytes this process holds at once.
   *
   * It has to come from outside because only the deployment knows how much
   * memory the replica was given. Bodies live in external buffers that add up
   * with the V8 heap rather than fitting inside it, so a figure compiled into
   * the framework is either far above what a small replica can hold or far
   * below what a large one should admit.
   */
  readonly maxInflightBodyBytes: number;
}

export interface WorkerSettings {
  readonly endpoint: string | null;

  /**
   * The address this replica tells the worker to call back on, or `null` to
   * derive it from the replica's own hostname.
   *
   * Capability grants live in the memory of the process that issued them, so a
   * shared service name would send the worker to any replica and the grant
   * would be unknown there. Only override this when the worker cannot reach the
   * replica by hostname, meaning a host running outside the container network.
   */
  readonly callbackUrl: string | null;
  readonly callbackPort: number;
  readonly handshakeAttempts: number;
  readonly handshakeDelayMs: number;
  readonly publicNodes: readonly string[];
}

