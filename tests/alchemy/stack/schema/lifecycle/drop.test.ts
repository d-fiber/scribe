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
import { allOf, equals, expect, isA, Scribe, throwsA, withMessage } from "@scribe/alchemy/test";
import type { DeclaredDrop, SchemaNode } from "@scribe/alchemy";
import {
  declaredDrops,
  Drop,
  DropDeclaration,
  DuplicateDeclarationError,
  forgetSchemas,
  Schema,
  SchemaMigration,
} from "@scribe/alchemy";

function dropOf(node: SchemaNode): DeclaredDrop {
  if (node.bucket !== "drop") throw new Error(`expected a drop node, got "${node.bucket}"`);
  return node.value;
}

Scribe.test("a table name declared twice as a drop is refused", () => {
  forgetSchemas();

  @Schema()
  class DropTableConflict {
    @SchemaMigration()
    a(): DropDeclaration {
      return Drop("drop_table_conflict").table();
    }
    @SchemaMigration()
    b(): DropDeclaration {
      return Drop("drop_table_conflict").table();
    }
  }
  void DropTableConflict;

  expect(
    () => declaredDrops("migrations"),
    throwsA(allOf(isA(DuplicateDeclarationError), withMessage("declared twice"))),
  );
});

Scribe.test("an index name declared twice as a drop is refused", () => {
  forgetSchemas();

  @Schema()
  class DropIndexConflict {
    @SchemaMigration()
    a(): DropDeclaration {
      return Drop("drop_index_conflict").index();
    }
    @SchemaMigration()
    b(): DropDeclaration {
      return Drop("drop_index_conflict").index();
    }
  }
  void DropIndexConflict;

  expect(
    () => declaredDrops("migrations"),
    throwsA(allOf(isA(DuplicateDeclarationError), withMessage("declared twice"))),
  );
});

Scribe.test("a type name declared twice as a drop is refused", () => {
  forgetSchemas();

  @Schema()
  class DropTypeConflict {
    @SchemaMigration()
    a(): DropDeclaration {
      return Drop("drop_type_conflict").type();
    }
    @SchemaMigration()
    b(): DropDeclaration {
      return Drop("drop_type_conflict").type();
    }
  }
  void DropTypeConflict;

  expect(
    () => declaredDrops("migrations"),
    throwsA(allOf(isA(DuplicateDeclarationError), withMessage("declared twice"))),
  );
});

Scribe.test("an extension name declared twice as a drop is refused", () => {
  forgetSchemas();

  @Schema()
  class DropExtensionConflict {
    @SchemaMigration()
    a(): DropDeclaration {
      return Drop("drop_extension_conflict").extension();
    }
    @SchemaMigration()
    b(): DropDeclaration {
      return Drop("drop_extension_conflict").extension();
    }
  }
  void DropExtensionConflict;

  expect(
    () => declaredDrops("migrations"),
    throwsA(allOf(isA(DuplicateDeclarationError), withMessage("declared twice"))),
  );
});

Scribe.test("a policy dropped twice under the same table is refused", () => {
  forgetSchemas();

  @Schema()
  class DropPolicyConflict {
    @SchemaMigration()
    a(): DropDeclaration {
      return Drop("drop_policy_conflict").policy("drop_policy_table");
    }
    @SchemaMigration()
    b(): DropDeclaration {
      return Drop("drop_policy_conflict").policy("drop_policy_table");
    }
  }
  void DropPolicyConflict;

  expect(
    () => declaredDrops("migrations"),
    throwsA(allOf(isA(DuplicateDeclarationError), withMessage("declared twice"))),
  );
});

Scribe.test("a policy dropped under two different tables, same name, does not collide", () => {
  forgetSchemas();

  @Schema()
  class DropPolicySharedName {
    @SchemaMigration()
    a(): DropDeclaration {
      return Drop("drop_policy_shared_name").policy("drop_policy_table_a");
    }
    @SchemaMigration()
    b(): DropDeclaration {
      return Drop("drop_policy_shared_name").policy("drop_policy_table_b");
    }
  }
  void DropPolicySharedName;

  const drops = declaredDrops("migrations");

  expect(
    drops.some((drop) =>
      drop.kind === "policy" && drop.name === "drop_policy_shared_name" && drop.table === "drop_policy_table_a"
    ),
    equals(true),
  );
  expect(
    drops.some((drop) =>
      drop.kind === "policy" && drop.name === "drop_policy_shared_name" && drop.table === "drop_policy_table_b"
    ),
    equals(true),
  );
});

Scribe.test("a table drop and an index drop sharing the same textual name do not collide", () => {
  forgetSchemas();

  @Schema()
  class DropSharedKindName {
    @SchemaMigration()
    table(): DropDeclaration {
      return Drop("drop_shared_kind_name").table();
    }
    @SchemaMigration()
    index(): DropDeclaration {
      return Drop("drop_shared_kind_name").index();
    }
  }
  void DropSharedKindName;

  const drops = declaredDrops("migrations");

  expect(drops.some((drop) => drop.kind === "table" && drop.name === "drop_shared_kind_name"), equals(true));
  expect(drops.some((drop) => drop.kind === "index" && drop.name === "drop_shared_kind_name"), equals(true));
});

Scribe.test("cascade is off unless called, and reflected on the declared drop once it is", () => {
  const uncascaded = dropOf(Drop("drop_no_cascade").table().declaration);
  const cascaded = dropOf(new DropDeclaration("table", "drop_with_cascade").cascade().declaration);

  expect(uncascaded.cascade, equals(false));
  expect(cascaded.cascade, equals(true));
});

Scribe.test("declaredDrops filters by the moment it was declared for", () => {
  forgetSchemas();

  @Schema()
  class DropMoments {
    @SchemaMigration()
    migrations(): DropDeclaration {
      return Drop("drop_moment_migrations").table();
    }
  }
  void DropMoments;

  const migrations = declaredDrops("migrations").map((drop) => drop.name);
  const init = declaredDrops("init").map((drop) => drop.name);

  expect(migrations.includes("drop_moment_migrations"), equals(true));
  expect(init.includes("drop_moment_migrations"), equals(false));
});
