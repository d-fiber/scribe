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

/**
 * The keys and the JWKS address this deployment verifies a bearer token against.
 *
 * @remarks
 * `authUrl` is the only field that can be absent: a project that mounts no identity package has
 * no service to ask for a JWKS, so the token verifier falls back to refusing every asymmetric
 * token instead of blocking the process from starting without one.
 */
export interface IdentitySettings {
  /**
   * The address of the service that publishes the JWKS, when one is mounted.
   *
   * Undefined for a project that mounts no identity package: there is no service
   * to ask, and the verifier answers by refusing asymmetric tokens instead of
   * keeping the process from starting.
   */
  readonly authUrl: string | undefined;

  /** The key a caller with no session is given, as the gateway hands it out. */
  readonly anonKey: string;

  /** The key that bypasses row level security, held by the engine alone. */
  readonly serviceRoleKey: string;

  /** The shared secret symmetric tokens are signed with, when there is one. */
  readonly jwtSecret: string | undefined;

  /**
   * The signing algorithms this deployment accepts on a bearer token.
   *
   * @remarks
   * Empty means whatever there is key material for, which is what a deployment that has not
   * thought about it gets. That default is wider than it looks: `JWT_SECRET` is held by PostgREST,
   * by the edge gateway and by the auth package, so a deployment whose identity service signs
   * ES256 still takes an HS256 token forged with a secret three other components hold, and had no
   * way to say otherwise.
   *
   * Naming them closes that, and naming both is what a rotation does while the old tokens live
   * out their hour.
   */
  readonly jwtAlgorithms: readonly string[];
}

/** The secret an internal call carries to prove it originated inside the deployment. */
export interface FirewallSettings {
  /** The shared secret that marks a call as coming from inside the deployment, not from an outside caller. */
  readonly internalSecret: string;
}

/** The key this deployment decrypts an incoming device payload with. */
export interface DeviceSettings {
  /** The device payload's private key, hex-encoded, used to decrypt what a device encrypted with it. */
  readonly payloadPrivateKeyHex: string;
}

/** What this process listens on, and how much of a request body it will hold in memory at once. */
export interface HttpSettings {
  /** The TCP port this process listens on. */
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

/**
 * How this replica finds its worker, and how the worker calls back into it.
 *
 * @remarks
 * A deployment that runs no worker leaves `endpoint` `null` and the rest of the shape unused.
 * When there is a worker, the callback fields exist because a capability grant lives only in the
 * memory of the replica that issued it: the worker has to reach that exact replica back, never a
 * shared service name that a load balancer could route to a different one.
 */
export interface WorkerSettings {
  /** The worker's own address, or `null` when this deployment runs no worker. */
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

  /** The port the callback address falls back to deriving from the replica's own hostname when `callbackUrl` is unset. */
  readonly callbackPort: number;

  /**
   * The interface the capability port binds to.
   *
   * @remarks
   * That port is the host's own capability surface: whoever reaches it and holds a token reads and
   * writes through the service role. `0.0.0.0` is what a container with one network needs and it is
   * the default, but it is a default and not a law: a replica sitting on more than one network, or
   * one whose port is published, wants the address the worker actually calls and nothing else.
   */
  readonly callbackHostname: string;

  /** How many times the host retries the worker's `Describe` call during the handshake before giving up. */
  readonly handshakeAttempts: number;

  /** How long the host waits between handshake attempts, in milliseconds. */
  readonly handshakeDelayMs: number;

  /**
   * The node names the gateway routes publicly, as the deployment declares them.
   *
   * @remarks
   * A node absent here that declares itself internal is left alone; only the other direction, a
   * node marked internal that the gateway exposes anyway, is refused.
   */
  readonly publicNodes: readonly string[];
}
