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

import {
  type Extension,
  ExtensionRegistry,
} from "@scribe/core/runtime/support/extensions/registry.ts";
import { isMissingModule } from "@scribe/core/runtime/support/extensions/missing_module.ts";
import { OptionalExtension } from "@scribe/core/runtime/support/extensions/optional_extension.ts";
import { assert, assertEquals, assertFalse, assertThrows } from "@std/assert";

class CountingExtension implements Extension {
  calls = 0;

  constructor(
    readonly name: string,
    private readonly value: unknown = { loaded: true },
  ) {}

  load(): Promise<unknown | null> {
    this.calls++;
    return Promise.resolve(this.value);
  }
}

Deno.test("ExtensionRegistry loads a registered extension", async () => {
  const registry = new ExtensionRegistry();
  const extension = new CountingExtension("cron");
  registry.register(extension);

  assertEquals(await registry.load("cron"), { loaded: true });
  assertEquals(extension.calls, 1);
});

Deno.test("ExtensionRegistry loads each extension at most once", async () => {
  const registry = new ExtensionRegistry();
  const extension = new CountingExtension("searcher");
  registry.register(extension);

  const [first, second, third] = await Promise.all([
    registry.load("searcher"),
    registry.load("searcher"),
    registry.load("searcher"),
  ]);

  assertEquals(extension.calls, 1);
  assertEquals(first, second);
  assertEquals(second, third);
});

Deno.test("ExtensionRegistry returns null for an unregistered name", async () => {
  const registry = new ExtensionRegistry();

  assertEquals(await registry.load("nothing"), null);
});

Deno.test("ExtensionRegistry refuses a duplicate registration", () => {
  const registry = new ExtensionRegistry();
  registry.register(new CountingExtension("cron"));

  assertThrows(
    () => registry.register(new CountingExtension("cron")),
    Error,
    "already registered",
  );
});

Deno.test("ExtensionRegistry lists what it knows", () => {
  const registry = new ExtensionRegistry();
  registry.register(new CountingExtension("queue"));
  registry.register(new CountingExtension("cron"));

  assertEquals([...registry.registered()].sort(), ["cron", "queue"]);
});

Deno.test("OptionalExtension swallows a missing module and yields null", async () => {
  const extension = new OptionalExtension("absent", () => {
    throw new Error("Module not found \"file:///nope.ts\".");
  });

  assertEquals(await extension.load(), null);
});

Deno.test("OptionalExtension yields null on a broken module too", async () => {
  const extension = new OptionalExtension("broken", () => {
    throw new TypeError("x is not a function");
  });

  assertEquals(await extension.load(), null);
});

Deno.test("OptionalExtension returns what the importer resolved", async () => {
  const module = { declared: 3 };
  const extension = new OptionalExtension("ok", () => Promise.resolve(module));

  assertEquals(await extension.load(), module);
});

Deno.test("isMissingModule recognises the shapes Deno reports", () => {
  assert(isMissingModule(new Error('Module not found "file:///a.ts".')));
  assert(isMissingModule(new Error("Cannot find module './a.ts'")));
  assert(isMissingModule(new Error("os error 2")));
  assert(isMissingModule("Module not found"));

  assertFalse(isMissingModule(new TypeError("x is not a function")));
  assertFalse(isMissingModule(new Error("boom")));
});
