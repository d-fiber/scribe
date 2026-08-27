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

import { CallScope } from "../runtime/scope.ts";
import { UnaryClient } from "../transport/client.ts";
import { TransportFailure } from "../transport/failure.ts";

/**
 * The address the last handshake announced, or null when none has happened.
 *
 * It answers calls made outside any dispatch, which is what the worker's own wiring and its
 * background tasks make: those carry the standing credential the same handshake adopted, so the
 * two stay a pair.
 */
let announced: string | null = null;

/** The way back to the host, and the handshake around it. */
export interface HostChannel {
  /**
   * Remembers `endpoint` as the host to call when a call names none, replacing the one before it.
   *
   * @remarks
   * The handshake is what calls it, and every replica of the host handshakes with the same worker,
   * so the address kept here is the last one to have introduced itself. That is only ever the
   * address of a call made outside any dispatch, which carries the standing credential the same
   * handshake adopted: the two are adopted together and cannot come apart.
   */
  connect(endpoint: string): void;

  /** Forgets the remembered host, which puts every ambient capability out of reach. */
  disconnect(): void;

  /** Whether a host is reachable, which is what tells a caller that a capability can answer. */
  connected(): boolean;

  /**
   * The client every capability sends its calls through.
   *
   * @remarks
   * It answers the replica whose token the call in flight is carrying, and falls back to the
   * remembered one when no call is in flight. A single channel fixed at the handshake would send
   * every callback to the last replica that attached, where every token but its own is unknown.
   *
   * @throws {TransportFailure} When neither the call nor a handshake names a host, because a
   * capability has nowhere to send its call before the host is known.
   */
  client(): UnaryClient;
}

function endpointOf(): string | null {
  return CallScope.current().hostEndpoint || announced;
}

export const host: HostChannel = {
  connect(endpoint: string): void {
    announced = endpoint;
  },

  disconnect(): void {
    announced = null;
  },

  connected(): boolean {
    return endpointOf() !== null;
  },

  client(): UnaryClient {
    const endpoint = endpointOf();
    if (endpoint === null) {
      throw TransportFailure.unavailable(
        "The worker is not connected to a host: capabilities are unreachable until the handshake happens.",
      );
    }

    return new UnaryClient(endpoint, () => CallScope.credentials());
  },
};
