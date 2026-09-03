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

import "@scribe/runtime/scholium/runner.ts";
import { Scribe } from "@scribe/alchemy/test";
import { assertEquals, assertThrows } from "@std/assert";
import { createAutoMock } from "@scribe/testing/auto_mock.ts";

class Leaf {
  ping(value: string): string {
    return `real:${value}`;
  }
}

class Branch {
  get leaf(): Leaf {
    return new Leaf();
  }
}

class Root {
  get branch(): Branch {
    return new Branch();
  }
}

Scribe.test("createAutoMock: throws on an unconfigured call", () => {
  const mock = createAutoMock(new Root());
  assertThrows(
    () => mock.target.branch.leaf.ping("a"),
    Error,
    'branch.leaf.ping" was called but not configured',
  );
});

Scribe.test("createAutoMock: when() overrides a specific nested path", () => {
  const mock = createAutoMock(new Root());
  mock.when("branch.leaf.ping", (value: string) => `fake:${value}`);

  assertEquals(mock.target.branch.leaf.ping("a"), "fake:a");
});

Scribe.test("createAutoMock: never calls the real implementation", () => {
  const mock = createAutoMock(new Root());
  mock.when("branch.leaf.ping", () => "fake");

  assertEquals(mock.target.branch.leaf.ping("a"), "fake");
});

Scribe.test("createAutoMock: defaultImpl handles any unconfigured call", () => {
  const mock = createAutoMock(new Root(), { defaultImpl: () => "default" });

  assertEquals(mock.target.branch.leaf.ping("a"), "default");
});

Scribe.test(
  "createAutoMock: calls() records every invocation's arguments",
  () => {
    const mock = createAutoMock(new Root(), { defaultImpl: () => "default" });

    mock.target.branch.leaf.ping("a");
    mock.target.branch.leaf.ping("b");

    assertEquals(mock.calls("branch.leaf.ping"), [["a"], ["b"]]);
    assertEquals(mock.calls("branch.leaf.other"), []);
  },
);

class LazyResource {
  _cache: { calls: number } | null = null;
  get instance(): { calls: number } {
    this._cache ??= { calls: 0 };
    this._cache.calls++;
    return this._cache;
  }
}

Scribe.test(
  "createAutoMock: reads a real getter with the real object as `this`, keeping its lazy cache intact",
  () => {
    const real = new LazyResource();
    const mock = createAutoMock(real);

    assertEquals(mock.target.instance.calls, 1);
    assertEquals(mock.target.instance.calls, 2);
    assertEquals(
      real._cache?.calls,
      2,
      "the cache must live on the real object, not on the proxy",
    );
  },
);
