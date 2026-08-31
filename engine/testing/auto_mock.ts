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

// deno-lint-ignore-file no-explicit-any
import "@scribe/testing/settings.ts";

/** A recording proxy over `real`, produced by `createAutoMock`, that answers calls through `when` or the real object. */
export interface AutoMock<T> {
  /** The proxied stand-in for `real`, recording every call and answering through a configured override when one exists. */
  readonly target: T;
  when(path: string, impl: (...args: any[]) => unknown): void;
  calls(path: string): unknown[][];
}

/**
 * How `createAutoMock` should answer a call nothing has configured.
 *
 * @remarks
 * Without `defaultImpl`, an unconfigured call throws rather than returning `undefined`, so a test
 * that reaches a method it never called `when` on fails loudly instead of silently proceeding with
 * a missing value. `defaultImpl` opts out of that for mocks where most calls are safe to no-op.
 */
export interface AutoMockOptions {
  defaultImpl?(path: string, args: unknown[]): unknown;
}

export function createAutoMock<T extends object>(
  real: T,
  options: AutoMockOptions = {},
): AutoMock<T> {
  const overrides = new Map<string, (...args: any[]) => unknown>();
  const calls = new Map<string, unknown[][]>();

  function wrap(node: object, path: string[]): unknown {
    return new Proxy(node, {
      get(target, prop) {
        if (typeof prop !== "string") return Reflect.get(target, prop);

        const value = Reflect.get(target, prop);
        const nextPath = [...path, prop];

        if (typeof value === "function") {
          return (...args: unknown[]) => {
            const key = nextPath.join(".");
            calls.set(key, [...(calls.get(key) ?? []), args]);

            const override = overrides.get(key);
            if (override) return override(...args);
            if (options.defaultImpl) return options.defaultImpl(key, args);

            throw new Error(
              `AutoMock: "${key}" was called but not configured call mock.when("${key}", impl) first.`,
            );
          };
        }

        if (value !== null && typeof value === "object") {
          return wrap(value, nextPath);
        }
        return value;
      },
    });
  }

  return {
    target: wrap(real, []) as T,
    when(path, impl) {
      overrides.set(path, impl);
    },
    calls(path) {
      return calls.get(path) ?? [];
    },
  };
}
