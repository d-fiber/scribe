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

import { assertEquals, assertFalse } from "@std/assert";
import type { DatabaseDriver, DatabaseSchema, Query } from "../mod.ts";
import { Databases, table } from "../mod.ts";

interface Member {
  readonly account_id: string;
  readonly audience: string;
  readonly since: number;
}

interface Schema extends DatabaseSchema {
  readonly __audience_members__: { readonly row: Member };
}

const ada: Member = { account_id: "ada", audience: "editors", since: 1 };

class Recorded implements Query<Member> {
  readonly steps: string[];

  constructor(steps: string[] = []) {
    this.steps = steps;
  }

  #then(step: string): Query<Member> {
    this.steps.push(step);
    return this;
  }

  unscoped(): Query<Member> {
    return this.#then("unscoped");
  }

  select(): Query<Member, never> {
    return this.#then("select") as unknown as Query<Member, never>;
  }

  selectRaw<R extends object = Member>(columns: string): Query<Member, R> {
    return this.#then(`selectRaw(${columns})`) as unknown as Query<Member, R>;
  }

  where(build: (filters: never) => unknown): Query<Member> {
    const filters = { account_id: { eq: (v: string) => ({ column: `account_id=${v}` }) } };
    const spec = build(filters as never) as { column: string };
    return this.#then(`where(${spec.column})`);
  }

  order(column: string): Query<Member> {
    return this.#then(`order(${column})`);
  }

  limit(count: number): Query<Member> {
    return this.#then(`limit(${count})`);
  }

  range(from: number, to: number): Query<Member> {
    return this.#then(`range(${from},${to})`);
  }

  get(): Promise<Member[]> {
    this.steps.push("get");
    return Promise.resolve([ada]);
  }

  getOne(): Promise<Member | null> {
    this.steps.push("getOne");
    return Promise.resolve(ada);
  }

  insert(): Promise<boolean> {
    this.steps.push("insert");
    return Promise.resolve(true);
  }

  insertOne(): Promise<Member | null> {
    this.steps.push("insertOne");
    return Promise.resolve(ada);
  }

  update(): Promise<boolean> {
    this.steps.push("update");
    return Promise.resolve(false);
  }

  delete(): Promise<boolean> {
    this.steps.push("delete");
    return Promise.resolve(true);
  }

  deleteOne(): Promise<Member | null> {
    this.steps.push("deleteOne");
    return Promise.resolve(null);
  }
}

class OneTable implements DatabaseDriver {
  readonly asked: string[] = [];
  readonly query = new Recorded();

  table<S extends DatabaseSchema, K extends keyof S & string>(name: K): Query<S[K]["row"] & object> {
    this.asked.push(name);
    return this.query as unknown as Query<S[K]["row"] & object>;
  }
}

Deno.test("declaring a table touches nothing, so an import before boot is safe", () => {
  const members = table<Schema, "__audience_members__">("__audience_members__");

  assertEquals(typeof members.where, "function", "declaring a table did not hand back a query");
});

Deno.test("a table is asked for at the first row, not at the declaration", async () => {
  const driver = new OneTable();
  const members = table<Schema, "__audience_members__">("__audience_members__");

  Databases.use(driver);
  assertEquals(driver.asked, [], "the table was asked for before anything read it");

  await members.where((f) => f.account_id.eq("ada")).getOne();
  assertEquals(driver.asked, ["__audience_members__"], "the table was not asked for by the first read");
});

Deno.test("narrowing a query carries every step through to the driver", async () => {
  const driver = new OneTable();
  Databases.use(driver);

  await table<Schema, "__audience_members__">("__audience_members__")
    .unscoped()
    .where((f) => f.account_id.eq("ada"))
    .order("since")
    .limit(10)
    .get();

  assertEquals(
    driver.query.steps,
    ["unscoped", "where(account_id=ada)", "order(since)", "limit(10)", "get"],
    "the steps reached the driver in another order, or one was lost",
  );
});

Deno.test("reading answers rows and writing answers whether it went through", async () => {
  Databases.use(new OneTable());
  const members = table<Schema, "__audience_members__">("__audience_members__");

  assertEquals(await members.get(), [ada], "the read did not hand back what the driver answered");
  assertEquals(await members.insert({ account_id: "ada" }), true, "the write did not answer its outcome");
  assertFalse(await members.update({ since: 2 }), "a refused write claimed to have gone through");
  assertEquals(await members.deleteOne(), null, "a delete that removed nothing answered a row");
});
