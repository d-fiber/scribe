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

  async resolve(pathname: string): Promise<ResolvedService | null> {
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
  ): Promise<ResolvedService | null> {
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
  ): Promise<ResolvedService | null> {
    for (const prefix of prefixes) {
      const servicePath = `${this.#root}/${prefix}${service}`;
      if (await this.#probe.hasModule(servicePath)) {
        return { service, servicePath };
      }
    }
    return null;
  }
}
