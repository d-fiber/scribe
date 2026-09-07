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
import { equals, expect, isNot, MemoryTrigger, MemoryTriggers, same, Scribe } from "@scribe/alchemy/test";
import { DateTime } from "@scribe/alchemy";
import type {
  DeclaredDeleteChange,
  DeclaredFieldChange,
  DeclaredInsertChange,
  DeclaredUpdateChange,
} from "@scribe/alchemy";

interface OrderRow {
  status: string;
  total: number;
}

const AT = DateTime.epoch;

Scribe.test("sawInsert calls every registered handler, in registration order", async () => {
  const trigger = new MemoryTrigger<OrderRow>();
  const heard: string[] = [];
  trigger.onInsert(() => {
    heard.push("first");
  });
  trigger.onInsert(() => {
    heard.push("second");
  });

  const change: DeclaredInsertChange<OrderRow> = {
    op: "insert",
    table: "orders",
    key: "1",
    at: AT,
    after: { status: "pending", total: 10 },
  };
  await trigger.sawInsert(change);

  expect(heard, equals(["first", "second"]));
});

Scribe.test("sawUpdate calls every registered handler with the change it was given", async () => {
  const trigger = new MemoryTrigger<OrderRow>();
  const seen: DeclaredUpdateChange<OrderRow>[] = [];
  trigger.onUpdate((change) => {
    seen.push(change);
  });

  const change: DeclaredUpdateChange<OrderRow> = {
    op: "update",
    table: "orders",
    key: "1",
    at: AT,
    before: { status: "pending", total: 10 },
    after: { status: "paid", total: 10 },
  };
  await trigger.sawUpdate(change);

  expect(seen, equals([change]));
});

Scribe.test("sawDelete calls every registered handler with the change it was given", async () => {
  const trigger = new MemoryTrigger<OrderRow>();
  const seen: DeclaredDeleteChange<OrderRow>[] = [];
  trigger.onDelete((change) => {
    seen.push(change);
  });

  const change: DeclaredDeleteChange<OrderRow> = {
    op: "delete",
    table: "orders",
    key: "1",
    at: AT,
    before: { status: "paid", total: 10 },
  };
  await trigger.sawDelete(change);

  expect(seen, equals([change]));
});

Scribe.test("sawField only calls the handlers registered for that field", async () => {
  const trigger = new MemoryTrigger<OrderRow>();
  const statusHeard: string[] = [];
  const totalHeard: string[] = [];
  trigger.onField("status", () => {
    statusHeard.push("status moved");
  });
  trigger.onField("total", () => {
    totalHeard.push("total moved");
  });

  const change: DeclaredFieldChange<OrderRow, "status"> = {
    op: "update",
    table: "orders",
    key: "1",
    at: AT,
    field: "status",
    before: "pending",
    after: "paid",
    row: { status: "paid", total: 10 },
  };
  await trigger.sawField("status", change);

  expect(statusHeard, equals(["status moved"]));
  expect(totalHeard, equals([]));
});

Scribe.test("several handlers on the same field are all called, in order", async () => {
  const trigger = new MemoryTrigger<OrderRow>();
  const heard: string[] = [];
  trigger.onField("status", () => {
    heard.push("a");
  });
  trigger.onField("status", () => {
    heard.push("b");
  });

  const change: DeclaredFieldChange<OrderRow, "status"> = {
    op: "update",
    table: "orders",
    key: "1",
    at: AT,
    field: "status",
    before: "pending",
    after: "paid",
    row: { status: "paid", total: 10 },
  };
  await trigger.sawField("status", change);

  expect(heard, equals(["a", "b"]));
});

Scribe.test("opening the same name twice answers the same watch, so both references share handlers", async () => {
  const driver = new MemoryTriggers();

  const first = driver.watch<OrderRow>("orders");
  const second = driver.watch<OrderRow>("orders");
  expect(first, same(second));

  const heard: string[] = [];
  first.onInsert(() => {
    heard.push("heard through the first reference");
  });

  const change: DeclaredInsertChange<OrderRow> = {
    op: "insert",
    table: "orders",
    key: "1",
    at: AT,
    after: { status: "pending", total: 10 },
  };
  await (second as MemoryTrigger<OrderRow>).sawInsert(change);

  expect(heard, equals(["heard through the first reference"]));
});

Scribe.test("a watch named explicitly answers to that name rather than to the table", () => {
  const driver = new MemoryTriggers();

  const byName = driver.watch<OrderRow>("orders", { name: "orders_high_value" });
  const byTable = driver.watch<OrderRow>("orders");

  expect(byName, isNot(same(byTable)));
  expect(driver.opened.has("orders_high_value"), equals(true));
});
