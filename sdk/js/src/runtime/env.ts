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

interface EnvReader {
  get(name: string): string | undefined;
}

interface EnvHolder {
  env?: EnvReader;
}

function reader(): EnvReader | null {
  const runtime = (globalThis as { Deno?: EnvHolder }).Deno;
  return runtime?.env ?? null;
}

export const env = {
  get(name: string): string | null {
    return reader()?.get(name) ?? null;
  },

  number(name: string, fallback: number): number {
    const raw = env.get(name);
    if (raw === null) return fallback;

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  },

  required(name: string): string {
    const value = env.get(name);
    if (value === null) {
      throw new Error(`The setting "${name}" is missing from the worker environment.`);
    }
    return value;
  },
};
