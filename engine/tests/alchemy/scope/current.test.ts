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

import { equals, expect } from "@scribe/alchemy/test/mod.ts";
import { Current, type CurrentDriver, Currents, type CurrentStore } from "@scribe/alchemy/mod.ts";

function stacking(): CurrentDriver {
  return {
    open<T>(): CurrentStore<T> {
      const held: T[] = [];
      return {
        run<R>(value: T, body: () => R): R {
          held.push(value);
          try {
            return body();
          } finally {
            held.pop();
          }
        },
        get: () => (held.length === 0 ? null : held[held.length - 1]),
      };
    },
  };
}

Deno.test("a place nobody set answers nothing rather than refusing", () => {
  Currents.use(stacking());
  const caller = new Current<string>("caller");

  expect(caller.get(), equals(null));
});

Deno.test("a value is held for whoever runs under the body that set it", () => {
  Currents.use(stacking());
  const caller = new Current<string>("caller");

  const seen = caller.run("ada", () => caller.get());

  expect(seen, equals("ada"));
  expect(caller.get(), equals(null));
});

Deno.test("a place set inside another hides it, and gives it back on the way out", () => {
  Currents.use(stacking());
  const caller = new Current<string>("caller");

  const seen = caller.run("ada", () => {
    const inner = caller.run("grace", () => caller.get());
    return [inner, caller.get()];
  });

  expect(seen, equals(["grace", "ada"]));
});

Deno.test("two places named the same are two places", () => {
  Currents.use(stacking());
  const first = new Current<string>("caller");
  const second = new Current<string>("caller");

  first.run("ada", () => expect(second.get(), equals(null)));
});

Deno.test("nothing opens a store until the place is used", () => {
  let opened = 0;
  Currents.use({
    open<T>(): CurrentStore<T> {
      opened += 1;
      return { run: (_value, body) => body(), get: () => null };
    },
  });

  const caller = new Current<string>("caller");
  expect(opened, equals(0));

  caller.get();
  expect(opened, equals(1));
});
