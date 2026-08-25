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
 * How a package answers the procedures its own contract declares.
 *
 * @remarks
 * A worker reaches the host over one wire, and what it may ask for is whatever the packages a
 * project mounted have declared. The host owns the wire and the token, and none of the answers, so
 * a package brings its handlers the way it brings its SQL and its containers.
 *
 * This replaces a list of services written by hand in the host. Four packages were named there, so
 * the framework did not compile without them, and a package nobody here wrote could not answer a
 * worker at all whatever its manifest said.
 *
 * It lives in `contracts` because both sides reach it and neither owns both ends: a package
 * registers, the host runs what was registered.
 */

/**
 * What a capability is handed so it can answer.
 *
 * @remarks
 * It is the transport's server narrowed to the one thing a package may do with it. The types are
 * loose on purpose: the shape of a request is decided by the generated stub a package names, and
 * the host has no business knowing which.
 */
export interface CapabilityWiring {
  /**
   * Answers `method` with `handler`, which is handed the request the worker sent.
   *
   * The call itself never reaches a package. What arrives with it is the token that says on whose
   * behalf the worker is asking, and replaying it is the host's job: a package that had to do it
   * would be one that could forget to.
   */
  // deno-lint-ignore no-explicit-any
  on(method: any, handler: (request: any) => Promise<any>): unknown;
}

/** What a package hands over so the host can give it the wire at boot. */
export type CapabilityRegistrant = (wiring: CapabilityWiring) => void;

/**
 * The packages that answer a worker, each adding itself and all of them read at boot.
 *
 * @remarks
 * A package registers inside its own `wires`, so the order is the one the project's manifest
 * names. A host with nothing mounted has an empty registry, which is the honest answer rather than
 * a refusal: the framework has to boot with no project on the other side.
 */
export class CapabilityRegistry {
  readonly #registered: CapabilityRegistrant[] = [];

  /** Adds `registrant`, to be handed the wire when the host builds its server. */
  register(registrant: CapabilityRegistrant): void {
    this.#registered.push(registrant);
  }

  /** Hands `wiring` to every package that registered, in the order they did. */
  wire(wiring: CapabilityWiring): void {
    for (const registrant of this.#registered) registrant(wiring);
  }

  /** How many packages answer a worker, which is what a boot line reports. */
  get count(): number {
    return this.#registered.length;
  }
}

/** The one registry a process has. */
export const capabilities: CapabilityRegistry = new CapabilityRegistry();
