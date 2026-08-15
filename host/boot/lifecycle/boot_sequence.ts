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

import type { Bootstrapper } from "./bootstrapper.ts";

export class BootSequence {
  readonly #runtime: string;
  readonly #bootstrappers: readonly Bootstrapper[];
  readonly #booted: Bootstrapper[] = [];
  #shuttingDown = false;

  constructor(runtime: string, bootstrappers: readonly Bootstrapper[]) {
    this.#runtime = runtime;
    this.#bootstrappers = bootstrappers;
  }

  async boot(): Promise<void> {
    for (const bootstrapper of this.#bootstrappers) {
      try {
        await bootstrapper.boot();
        this.#booted.push(bootstrapper);
      } catch (error) {
        console.error(
          `[boot:${this.#runtime}] ${bootstrapper.name} failed:`,
          error,
        );
        await this.shutdown();
        throw error;
      }
    }
    console.info(
      `[boot:${this.#runtime}] ${this.#booted.length} bootstrapper(s) ready.`,
    );
  }

  async shutdown(): Promise<void> {
    if (this.#shuttingDown) return;
    this.#shuttingDown = true;

    for (const bootstrapper of [...this.#booted].reverse()) {
      if (bootstrapper.shutdown === undefined) continue;
      try {
        await bootstrapper.shutdown();
      } catch (error) {
        console.error(
          `[boot:${this.#runtime}] ${bootstrapper.name} shutdown failed:`,
          error,
        );
      }
    }
    this.#booted.length = 0;
  }
}
