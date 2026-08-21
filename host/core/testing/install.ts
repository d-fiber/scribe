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
