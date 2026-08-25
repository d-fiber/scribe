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

import type { Future } from "@scribe/alchemy";
import { FilesystemModuleProbe, type ModuleProbe } from "./module_probe.ts";
import { ResolutionCache } from "./resolution_cache.ts";
import type { ResolvedService, ServiceResolver } from "./service_resolver.ts";

const API_PREFIXES = ["api/", "api/public/", "api/internal/"] as const;

const NAMESPACED_PREFIXES: readonly string[] = ["", ...API_PREFIXES];
const FLAT_PREFIXES: readonly string[] = API_PREFIXES;

export class DirectoryServiceResolver implements ServiceResolver {
  readonly #root: string;
  readonly #probe: ModuleProbe;
  readonly #namespacedMatches: ResolutionCache;
  readonly #flatMatches: ResolutionCache;

  constructor(
    root: string,
    probe: ModuleProbe = new FilesystemModuleProbe(),
    namespacedMatches: ResolutionCache = new ResolutionCache(),
    flatMatches: ResolutionCache = new ResolutionCache(),
  ) {
    this.#root = root;
    this.#probe = probe;
    this.#namespacedMatches = namespacedMatches;
    this.#flatMatches = flatMatches;
  }

  async resolve(pathname: string): Future<ResolvedService | null> {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return null;

    if (segments.length >= 2) {
      const namespaced = await this.#cachedMatch(
        `${segments[0]}/${segments[1]}`,
        NAMESPACED_PREFIXES,
        this.#namespacedMatches,
      );
      if (namespaced !== null) return namespaced;
    }

    const service = segments[0];
    const flat = await this.#cachedMatch(
      service,
      FLAT_PREFIXES,
      this.#flatMatches,
    );
    if (flat !== null) return flat;

    return { service, servicePath: `${this.#root}/${service}` };
  }

  async #cachedMatch(
    service: string,
    prefixes: readonly string[],
    cache: ResolutionCache,
  ): Future<ResolvedService | null> {
    const remembered = cache.lookup(service);
    if (remembered !== undefined) {
      return remembered === null ? null : { service, servicePath: remembered };
    }

    const match = await this.#firstMatch(service, prefixes);
    cache.remember(service, match === null ? null : match.servicePath);
    return match;
  }

  async #firstMatch(
    service: string,
    prefixes: readonly string[],
  ): Future<ResolvedService | null> {
    for (const prefix of prefixes) {
      const servicePath = `${this.#root}/${prefix}${service}`;
      if (await this.#probe.hasModule(servicePath)) {
        return { service, servicePath };
      }
    }
    return null;
  }
}
