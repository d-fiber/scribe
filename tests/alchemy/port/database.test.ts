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
import { equals, expect, isFalse, isTrue, Scribe } from "@scribe/alchemy/test";
import type { DatabaseDriver, DeclaredDatabaseSchema, Query } from "@scribe/alchemy";
import { Databases, Failure, Ok, Refusal, schema } from "@scribe/alchemy";

interface Member {
  readonly account_id: string;
  readonly audience: string;
  readonly since: number;
}

interface Schema extends DeclaredDatabaseSchema {
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

  select(): Query<Member, never> {
    return this.#then("select") as unknown as Query<Member, never>;
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

  insert(): Promise<Ok<number> | Failure> {
    this.steps.push("insert");
    return Promise.resolve(new Ok(1));
  }

  insertOne(): Promise<Ok<Member> | Failure> {
    this.steps.push("insertOne");
    return Promise.resolve(new Ok(ada));
  }

  update(): Promise<Ok<number> | Failure> {
    this.steps.push("update");
    return Promise.resolve(new Failure(Refusal.conflict("the row moved.")));
  }

  delete(): Promise<Ok<number> | Failure> {
    this.steps.push("delete");
    return Promise.resolve(new Ok(2));
  }

  deleteOne(): Promise<Ok<Member> | Failure> {
    this.steps.push("deleteOne");
    return Promise.resolve(new Failure(Refusal.missing("no such row.")));
  }
}

class OneTable implements DatabaseDriver {
  readonly asked: string[] = [];
  readonly query = new Recorded();

  table<S extends DeclaredDatabaseSchema, K extends keyof S & string>(name: K): Query<S[K]["row"] & object> {
    this.asked.push(name);
    return this.query as unknown as Query<S[K]["row"] & object>;
  }
}

Scribe.test("declaring a table touches nothing, so an import before boot is safe", () => {
  const members = schema<Schema>().table("__audience_members__");

  expect(typeof members.where, equals("function"), "declaring a table did not hand back a query");
});

Scribe.test("a table is asked for at the first row, not at the declaration", async () => {
  const driver = new OneTable();
  const members = schema<Schema>().table("__audience_members__");

  Databases.use(driver);
  expect(driver.asked, equals([]), "the table was asked for before anything read it");

  await members.where((f) => f.account_id.eq("ada")).getOne();
  expect(driver.asked, equals(["__audience_members__"]), "the table was not asked for by the first read");
});

Scribe.test("narrowing a query carries every step through to the driver", async () => {
  const driver = new OneTable();
  Databases.use(driver);

  await schema<Schema>().table("__audience_members__")
    .where((f) => f.account_id.eq("ada"))
    .order("since")
    .limit(10)
    .get();

  expect(
    driver.query.steps,
    equals(["where(account_id=ada)", "order(since)", "limit(10)", "get"]),
    "the steps reached the driver in another order, or one was lost",
  );
});

Scribe.test("reading answers rows, and a write answers an outcome rather than a yes or a no", async () => {
  Databases.use(new OneTable());
  const members = schema<Schema>().table("__audience_members__");

  expect(await members.get(), equals([ada]), "the read did not hand back what the driver answered");

  const written = await members.insert({ account_id: "ada" });
  expect(written.ok, isTrue, "a write that went through did not say so");
  expect(written.ok ? written.data : -1, equals(1), "a write that went through did not say how many rows it touched");
});

Scribe.test("a write the backend refused carries why, so a caller knows whether to try again", async () => {
  Databases.use(new OneTable());
  const members = schema<Schema>().table("__audience_members__");

  const refused = await members.update({ since: 2 });

  expect(refused.ok, isFalse, "a refused write claimed to have gone through");
  expect(refused.ok ? "" : refused.error.kind, equals("conflict"), "the refusal did not say what kind it was");
});

Scribe.test("a delete that removed nothing says which nothing it was", async () => {
  Databases.use(new OneTable());
  const members = schema<Schema>().table("__audience_members__");

  const removed = await members.deleteOne();

  expect(removed.ok, isFalse);
  expect(removed.ok ? "" : removed.error.kind, equals("missing"));
});
