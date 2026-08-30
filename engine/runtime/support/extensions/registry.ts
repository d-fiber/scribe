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

import { type Future, Registry } from "@scribe/alchemy";

export interface Extension {
  /** This extension's registered name, looked up by `ExtensionRegistry.load`. */
  readonly name: string;
  load(): Future<unknown | null>;
}

export class ExtensionRegistry {
  readonly #declared = new Registry<Extension>("extension");
  readonly #loaded = new Map<string, Future<unknown | null>>();

  register(extension: Extension): void {
    this.#declared.declare(extension.name, extension);
  }

  /** Whether something already answers for `name`. */
  declares(name: string): boolean {
    return this.#declared.named(name) !== null;
  }

  load(name: string): Future<unknown | null> {
    const memoized = this.#loaded.get(name);
    if (memoized !== undefined) return memoized;

    const extension = this.#declared.named(name);
    if (extension === null) {
      console.info(`[extensions] ${name} not registered, skipped.`);
      return Promise.resolve(null);
    }

    const loading = extension.load();
    this.#loaded.set(name, loading);
    return loading;
  }

  registered(): readonly string[] {
    return this.#declared.all().map((extension) => extension.name);
  }
}

export const extensions: ExtensionRegistry = new ExtensionRegistry();
