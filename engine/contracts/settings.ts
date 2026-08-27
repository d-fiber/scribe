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
  readonly handshakeAttempts: number;
  readonly handshakeDelayMs: number;
  readonly publicNodes: readonly string[];
}
