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

import { assertEquals, assertThrows } from "@std/assert";
import { createAutoMock } from "@scribe/core/testing/auto_mock.ts";

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

Deno.test("createAutoMock: throws on an unconfigured call", () => {
  const mock = createAutoMock(new Root());
  assertThrows(
    () => mock.target.branch.leaf.ping("a"),
    Error,
    'branch.leaf.ping" was called but not configured',
  );
});

Deno.test("createAutoMock: when() overrides a specific nested path", () => {
  const mock = createAutoMock(new Root());
  mock.when("branch.leaf.ping", (value: string) => `fake:${value}`);

  assertEquals(mock.target.branch.leaf.ping("a"), "fake:a");
});

Deno.test("createAutoMock: never calls the real implementation", () => {
  const mock = createAutoMock(new Root());
  mock.when("branch.leaf.ping", () => "fake");

  assertEquals(mock.target.branch.leaf.ping("a"), "fake");
});

Deno.test("createAutoMock: defaultImpl handles any unconfigured call", () => {
  const mock = createAutoMock(new Root(), { defaultImpl: () => "default" });

  assertEquals(mock.target.branch.leaf.ping("a"), "default");
});

Deno.test(
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

Deno.test(
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
