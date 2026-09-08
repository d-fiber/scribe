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

import type { ScribePlugin as Plugin } from "@scribe/alchemy";
import type { CapabilityRegistrant } from "./capability.ts";

/**
 * What a package's `registerWith` step may register, handed in rather than reached for.
 *
 * @remarks
 * A package never reaches into a capability or extension registry by importing it: it is handed
 * the one object that lets it register itself, so a test can hand it a fake in place of the real
 * host and see exactly what a package tried to register.
 */
export interface PackageRegistrar {
  /** Registers a capability this package serves to a worker. */
  addCapability(handler: CapabilityRegistrant): void;

  /**
   * Registers `bucket` as the extension a project may declare `name` into, unless another package
   * already claimed `name`.
   */
  addExtension(name: string, bucket: string): void;
}

/**
 * A package's plugin, bound to the registrar this framework actually hands it.
 *
 * @remarks
 * Alchemy's own {@link Plugin} leaves its registrar generic, since it has no registrar of its own
 * to name. This is the shape every package entry writes against: `implements ScribePlugin`, one
 * name, no generic to repeat.
 */
export type ScribePlugin = Plugin<PackageRegistrar>;
