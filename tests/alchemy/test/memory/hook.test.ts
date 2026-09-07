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

import "@scribe/scholium/runner.ts";
import {
  contains,
  equals,
  expect,
  expectLater,
  having,
  isA,
  isNot,
  MemoryHook,
  MemoryHooks,
  same,
  Scribe,
  throwsA,
} from "@scribe/alchemy/test";

Scribe.test("emit keeps every payload in the order it was told", async () => {
  const hook = new MemoryHook<string>();

  await hook.emit("first");
  await hook.emit("second");

  expect(hook.emitted, equals(["first", "second"]));
});

Scribe.test("every listener is called in the order it asked, on every emit", async () => {
  const hook = new MemoryHook<number>();
  const heard: string[] = [];

  hook.on((payload) => {
    heard.push(`a:${payload}`);
  });
  hook.on((payload) => {
    heard.push(`b:${payload}`);
  });

  await hook.emit(1);
  await hook.emit(2);

  expect(heard, equals(["a:1", "b:1", "a:2", "b:2"]));
});

Scribe.test("a listener that raises stops the rest from hearing that emit", async () => {
  const hook = new MemoryHook<string>();
  const heard: string[] = [];

  hook.on(() => {
    heard.push("first");
  });
  hook.on(() => {
    throw new Error("the second listener refuses");
  });
  hook.on(() => {
    heard.push("third");
  });

  await expectLater(
    () => hook.emit("payload"),
    throwsA(having(isA(Error), (raised) => raised.message, "message", contains("refuses"))),
  );

  expect(heard, equals(["first"]));
});

Scribe.test("listeners counts how many are registered, not how many were called", () => {
  const hook = new MemoryHook<string>();

  expect(hook.listeners, equals(0));
  hook.on(() => {});
  hook.on(() => {});

  expect(hook.listeners, equals(2));
});

Scribe.test("opening the same event twice answers the same hook", () => {
  const driver = new MemoryHooks();

  const first = driver.open<string>({ event: "audience.signed_up" });
  const second = driver.open<string>({ event: "audience.signed_up" });

  expect(first, same(second));
});

Scribe.test("two different events open two different hooks", () => {
  const driver = new MemoryHooks();

  const signedUp = driver.open<string>({ event: "audience.signed_up" });
  const signedOut = driver.open<string>({ event: "audience.signed_out" });

  expect(signedUp, isNot(same(signedOut)));
  expect(driver.opened.size, equals(2));
});
