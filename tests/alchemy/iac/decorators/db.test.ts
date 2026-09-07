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
import { equals, expect, isNotNull, Scribe, throwsA } from "@scribe/alchemy/test";
import type { Future } from "@scribe/alchemy";
import {
  DB,
  InitDB,
  initDbRegistry,
  MigrationDB,
  migrationDbRegistry,
  ProvisioningDB,
  provisioningDbRegistry,
} from "@scribe/alchemy";

Scribe.test("@DB() with @InitDB() registers the method under the class name, in initDbRegistry only", () => {
  @DB()
  class TestDbInitBasic {
    @InitDB()
    async seed(): Future<void> {}
  }
  void TestDbInitBasic;

  expect(initDbRegistry.list().some((entry) => entry.name === "TestDbInitBasic"), equals(true));
  expect(migrationDbRegistry.list().some((entry) => entry.name === "TestDbInitBasic"), equals(false));
  expect(provisioningDbRegistry.list().some((entry) => entry.name === "TestDbInitBasic"), equals(false));
});

Scribe.test("@DB() with @MigrationDB() registers the method under the class name, in migrationDbRegistry only", () => {
  @DB()
  class TestDbMigrationBasic {
    @MigrationDB()
    async backfill(): Future<void> {}
  }
  void TestDbMigrationBasic;

  expect(migrationDbRegistry.list().some((entry) => entry.name === "TestDbMigrationBasic"), equals(true));
  expect(initDbRegistry.list().some((entry) => entry.name === "TestDbMigrationBasic"), equals(false));
  expect(provisioningDbRegistry.list().some((entry) => entry.name === "TestDbMigrationBasic"), equals(false));
});

Scribe.test(
  "@DB() with @ProvisioningDB() registers the method under the class name, in provisioningDbRegistry only",
  () => {
    @DB()
    class TestDbProvisioningBasic {
      @ProvisioningDB()
      async reserveName(): Future<void> {}
    }
    void TestDbProvisioningBasic;

    expect(provisioningDbRegistry.list().some((entry) => entry.name === "TestDbProvisioningBasic"), equals(true));
    expect(initDbRegistry.list().some((entry) => entry.name === "TestDbProvisioningBasic"), equals(false));
    expect(migrationDbRegistry.list().some((entry) => entry.name === "TestDbProvisioningBasic"), equals(false));
  },
);

Scribe.test("a class may carry one of each: InitDB, MigrationDB and ProvisioningDB together", () => {
  @DB()
  class TestDbAllThree {
    @InitDB()
    async seed(): Future<void> {}

    @MigrationDB()
    async backfill(): Future<void> {}

    @ProvisioningDB()
    async reserveName(): Future<void> {}
  }
  void TestDbAllThree;

  expect(initDbRegistry.list().some((entry) => entry.name === "TestDbAllThree"), equals(true));
  expect(migrationDbRegistry.list().some((entry) => entry.name === "TestDbAllThree"), equals(true));
  expect(provisioningDbRegistry.list().some((entry) => entry.name === "TestDbAllThree"), equals(true));
});

Scribe.test("a second @InitDB() on the same class is refused, the same rule @Init() follows", () => {
  expect(() => {
    @DB()
    class TestDbInitDuplicate {
      @InitDB()
      async first(): Future<void> {}

      @InitDB()
      async second(): Future<void> {}
    }
    void TestDbInitDuplicate;
  }, throwsA(isNotNull));
});
