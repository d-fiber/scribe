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

import "@scribe/core/testing/settings.ts";
import "./settings.ts";

export interface InstalledMock {
  restore(): void;
}

export function installMock<T extends object, K extends keyof T>(
  target: T,
  property: K,
  value: T[K],
): InstalledMock {
  const original = Object.getOwnPropertyDescriptor(target, property);

  Object.defineProperty(target, property, {
    value,
    configurable: true,
    writable: true,
    enumerable: original?.enumerable ?? true,
  });

  return {
    restore(): void {
      if (original) Object.defineProperty(target, property, original);
      else delete (target as Record<PropertyKey, unknown>)[property as string];
    },
  };
}

// Accessor variant, for singletons whose surface is exposed by getters carried
// by the *prototype* (`rest`, `broadcast.device`): `installMock` would set a
// value frozen at install time, whereas a mock must stay dynamic (`DatabaseMock.user`
// only becomes non-null after `asUser()`). Since `Object.getOwnPropertyDescriptor`
// returns `undefined` for a prototype getter, `restore()` simply deletes the own
// property and the original getter reappears.
export function installGetterMock<T extends object, K extends keyof T>(
  target: T,
  property: K,
  get: () => T[K],
): InstalledMock {
  const original = Object.getOwnPropertyDescriptor(target, property);

  Object.defineProperty(target, property, {
    get,
    configurable: true,
    enumerable: original?.enumerable ?? true,
  });

  return {
    restore(): void {
      if (original) Object.defineProperty(target, property, original);
      else delete (target as Record<PropertyKey, unknown>)[property as string];
    },
  };
}

export function installAllMock<T extends object>(
  target: T,
  mockTarget: T,
): InstalledMock {
  const keys = Object.getOwnPropertyNames(target).filter(
    (key) =>
      !["length", "name", "prototype", "constructor"].includes(key) &&
      !key.startsWith("_"),
  );

  const installed = keys.map((key) =>
    installMock(
      target as unknown as Record<string, unknown>,
      key,
      (mockTarget as unknown as Record<string, unknown>)[key],
    )
  );

  return {
    restore(): void {
      for (const mock of installed) mock.restore();
    },
  };
}
