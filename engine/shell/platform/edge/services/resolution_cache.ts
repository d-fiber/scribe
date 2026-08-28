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

const MAX_CACHED_RESOLUTIONS = 512;

/**
 * Where each service name was found on disk, or the fact that it was not found at all.
 *
 * @remarks
 * Three answers and not two, the same way {@link PlaintextCache} holds three: `undefined` is a name
 * this process has not looked up, `null` is one it looked up and did not find.
 *
 * It holds no expiry, unlike the table `runtime/support/cache/ttl_lru.ts` carries, because what it
 * remembers is the layout of a directory that is baked into the image: an entry that has stopped
 * being true means the image changed under a running process, which it does not.
 *
 * The oldest entry goes when the table is full, one at a time. Emptying it at the limit meant a
 * caller asking for five hundred names that do not exist threw away every real resolution at a
 * stroke, and every service on the box paid a directory walk again.
 */
export class ResolutionCache {
  readonly #entries = new Map<string, string | null>();
  readonly #limit: number;

  constructor(limit: number = MAX_CACHED_RESOLUTIONS) {
    this.#limit = Math.max(1, limit);
  }

  /** Where `service` was found, or `undefined` when this process has not looked. */
  lookup(service: string): string | null | undefined {
    return this.#entries.get(service);
  }

  /** Holds where `service` was found, dropping the oldest entry if it has to. */
  remember(service: string, servicePath: string | null): void {
    this.#entries.delete(service);
    this.#entries.set(service, servicePath);

    if (this.#entries.size <= this.#limit) return;

    const oldest = this.#entries.keys().next();
    if (!oldest.done) this.#entries.delete(oldest.value);
  }

  /** How many names are held. */
  get size(): number {
    return this.#entries.size;
  }
}
