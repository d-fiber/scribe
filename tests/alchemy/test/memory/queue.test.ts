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
  MemoryQueue,
  MemoryQueues,
  same,
  Scribe,
  throwsA,
} from "@scribe/alchemy/test";
import type { QueueMessage } from "@scribe/alchemy";

Scribe.test("push and pushMany keep everything in the order it arrived", async () => {
  const queue = new MemoryQueue<string>({ key: "orders" });

  await queue.push("a");
  await queue.pushMany(["b", "c"]);

  expect(queue.pushed, equals(["a", "b", "c"]));
});

Scribe.test("delivering without a declared handler does nothing and does not raise", async () => {
  const queue = new MemoryQueue<string>({ key: "orders" });
  await queue.push("a");

  await queue.deliver(0);
});

Scribe.test("delivering hands the handler the message, counting attempts from one", async () => {
  const seen: QueueMessage<never>[] = [];
  const queue = new MemoryQueue<string>({
    key: "orders",
    handle: (message) => {
      seen.push(message);
    },
  });
  await queue.push("a");

  await queue.deliver(0);
  await queue.deliver(0);

  expect(seen.length, equals(2));
  expect(seen[0].data, equals("a"));
  expect(seen[0].attempts, equals(1));
  expect(seen[1].attempts, equals(2));
  expect(seen[1].id, equals(seen[0].id));
});

Scribe.test("a handler that raises leaves the attempt already counted and the raise reaches the caller", async () => {
  let attemptsSeen = 0;
  const queue = new MemoryQueue<string>({
    key: "orders",
    handle: (message) => {
      attemptsSeen = message.attempts;
      throw new Error("the handler refuses this message");
    },
  });
  await queue.push("a");

  await expectLater(
    () => queue.deliver(0),
    throwsA(having(isA(Error), (raised) => raised.message, "message", contains("refuses"))),
  );

  expect(attemptsSeen, equals(1));
});

Scribe.test("opening the same key twice answers the same queue", () => {
  const driver = new MemoryQueues();

  const first = driver.open<string>({ key: "orders" });
  const second = driver.open<string>({ key: "orders" });

  expect(first, same(second));
});

Scribe.test("consume records the key it was asked to drain, without draining anything itself", () => {
  const driver = new MemoryQueues();

  driver.consume({ key: "orders" });

  expect(driver.draining, equals(["orders"]));
});

Scribe.test("two different keys open two different queues", () => {
  const driver = new MemoryQueues();

  const orders = driver.open<string>({ key: "orders" });
  const invites = driver.open<string>({ key: "invites" });

  expect(orders, isNot(same(invites)));
});
