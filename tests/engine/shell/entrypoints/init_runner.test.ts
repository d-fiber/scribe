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
import { equals, expect, fail, isNotNull, Scribe } from "@scribe/alchemy/test";
import { type Future, Init, Lifecycle } from "@scribe/alchemy";
import { installInitDatabaseFake } from "@scribe/foundation/testing";
import { runDeclaredInits } from "@scribe/shell/entrypoints/init_runner.ts";

/** Calls `body`, and answers what it raised. */
async function caughtAsync(body: () => Future<void>): Future<unknown> {
  try {
    await body();
  } catch (raised) {
    return raised;
  }
  fail("it returned instead of raising");
}

Scribe.test("a method runs bound to its own instance, and may read its own state", async () => {
  let seen = false;

  @Lifecycle()
  class TestInitRunBound {
    ran = false;

    @Init()
    run(): Future<void> {
      this.ran = true;
      seen = this.ran;
      return Promise.resolve();
    }
  }
  void TestInitRunBound;

  const db = installInitDatabaseFake();
  try {
    await runDeclaredInits();

    expect(seen, equals(true));
  } finally {
    db.restore();
  }
});

Scribe.test("runDeclaredInits() runs a job that has never run before, then tracks it", async () => {
  let calls = 0;

  @Lifecycle()
  class TestInitRunOnce {
    @Init()
    run(): Future<void> {
      calls++;
      return Promise.resolve();
    }
  }
  void TestInitRunOnce;

  const db = installInitDatabaseFake();
  try {
    await runDeclaredInits();

    expect(calls, equals(1));
    expect(db.rows("__inits__").some((row) => row.name === "TestInitRunOnce"), equals(true));
  } finally {
    db.restore();
  }
});

Scribe.test("runDeclaredInits() skips a job already tracked", async () => {
  let calls = 0;

  @Lifecycle()
  class TestInitRunSkip {
    @Init()
    run(): Future<void> {
      calls++;
      return Promise.resolve();
    }
  }
  void TestInitRunSkip;

  const db = installInitDatabaseFake({
    __inits__: [{ name: "TestInitRunSkip", ran_at: "2026-01-01T00:00:00Z" }],
  });
  try {
    await runDeclaredInits();

    expect(calls, equals(0));
  } finally {
    db.restore();
  }
});

Scribe.test("runDeclaredInits() stops at the first failure without tracking it or running what is behind it", async () => {
  let ranAfter = false;

  @Lifecycle()
  class TestInitRunFails {
    @Init()
    run(): Future<void> {
      throw new Error("boom");
    }
  }
  @Lifecycle()
  class TestInitRunZzzAfter {
    @Init()
    run(): Future<void> {
      ranAfter = true;
      return Promise.resolve();
    }
  }
  void TestInitRunFails;
  void TestInitRunZzzAfter;

  const db = installInitDatabaseFake();
  try {
    expect(await caughtAsync(() => runDeclaredInits()), isNotNull);

    expect(ranAfter, equals(false));
    expect(db.rows("__inits__").some((row) => row.name === "TestInitRunFails"), equals(false));
  } finally {
    db.restore();
  }
});
