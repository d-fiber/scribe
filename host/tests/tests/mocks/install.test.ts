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

import { assertEquals } from "@std/assert";
import { installAllMock, installMock } from "@scribe/core/testing/install.ts";

Deno.test("installMock: swaps a value property and restore() puts the original back", () => {
  const target = { greet: () => "real" };
  const original = target.greet;

  const installed = installMock(target, "greet", () => "fake");
  assertEquals(target.greet(), "fake");

  installed.restore();
  assertEquals(target.greet, original);
});

Deno.test("installMock: restore() deletes the property if it didn't exist before", () => {
  const target: { extra?: () => string } = {};

  const installed = installMock(target, "extra", () => "fake");
  assertEquals(target.extra?.(), "fake");
  assertEquals(Object.prototype.hasOwnProperty.call(target, "extra"), true);

  installed.restore();
  assertEquals(Object.prototype.hasOwnProperty.call(target, "extra"), false);
});

Deno.test("installMock: preserves the original enumerable flag across install/restore", () => {
  const target: Record<string, unknown> = {};
  Object.defineProperty(target, "hidden", {
    value: "real",
    enumerable: false,
    configurable: true,
    writable: true,
  });

  const installed = installMock(target, "hidden", "fake");
  assertEquals(target.hidden, "fake");
  assertEquals(Object.getOwnPropertyDescriptor(target, "hidden")?.enumerable, false);

  installed.restore();
  assertEquals(target.hidden, "real");
  assertEquals(Object.getOwnPropertyDescriptor(target, "hidden")?.enumerable, false);
});

Deno.test("installMock: swaps a static getter and restore() re-installs the getter itself, not a frozen snapshot", () => {
  class Target {
    static #calls = 0;
    static get instance(): { call: number } {
      Target.#calls++;
      return { call: Target.#calls };
    }
  }
  const originalDescriptor = Object.getOwnPropertyDescriptor(Target, "instance");

  const installed = installMock(Target, "instance", { call: -1 });
  assertEquals(Target.instance, { call: -1 });
  assertEquals(Target.instance, { call: -1 });

  installed.restore();
  assertEquals(Object.getOwnPropertyDescriptor(Target, "instance"), originalDescriptor);
  assertEquals(Target.instance, { call: 1 });
  assertEquals(Target.instance, { call: 2 });
});

Deno.test("installAllMock: copies every own property except length/name/prototype/constructor and _-prefixed ones", () => {
  class Target {
    static a = "real-a";
    static _private = "real-private";
    static b(): string {
      return "real-b";
    }
  }
  const mockTarget = { a: "fake-a", _private: "fake-private", b: () => "fake-b" };

  const installed = installAllMock(Target, mockTarget as unknown as typeof Target);

  assertEquals(Target.a, "fake-a");
  assertEquals(Target.b(), "fake-b");
  assertEquals(Target._private, "real-private", "_-prefixed keys must not be swapped");

  installed.restore();
  assertEquals(Target.a, "real-a");
  assertEquals(Target.b(), "real-b");
});

Deno.test("installAllMock: restore() reverts every swapped property at once", () => {
  class Target {
    static a = 1;
    static b = 2;
  }
  const mockTarget = { a: 10, b: 20 };

  const installed = installAllMock(Target, mockTarget as unknown as typeof Target);
  assertEquals([Target.a, Target.b], [10, 20]);

  installed.restore();
  assertEquals([Target.a, Target.b], [1, 2]);
});
