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
import type { SchemaNode } from "@scribe/alchemy";
import { declaredSchemaMembers, Extension, SchemaInit, SchemaMigration, SchemaProvisioning } from "@scribe/alchemy";

Scribe.test("declaredSchemaMembers() answers nothing for a class with no decorated method", () => {
  class Empty {}

  expect(declaredSchemaMembers(new Empty()), equals([]));
});

Scribe.test("a single @SchemaInit() method resolves to its own member, tagged with init", () => {
  class One {
    @SchemaInit()
    trigram(): SchemaNode {
      return Extension("pg_trgm").install();
    }
  }

  const members = declaredSchemaMembers(new One());
  expect(members, equals([{ moment: "init", member: Extension("pg_trgm").install() }]));
});

Scribe.test("several decorated methods resolve in the order they appear in the class body", () => {
  class Two {
    @SchemaInit()
    trigram(): SchemaNode {
      return Extension("pg_trgm").install();
    }

    @SchemaMigration()
    unaccent(): SchemaNode {
      return Extension("unaccent").install();
    }
  }

  const members = declaredSchemaMembers(new Two()).map((entry) => entry.moment);
  expect(members, equals(["init", "migrations"]));
});

Scribe.test("@SchemaInit(), @SchemaMigration() and @SchemaProvisioning() share one ordered list, not one per moment", () => {
  class Mixed {
    @SchemaInit()
    a(): SchemaNode {
      return Extension("pg_trgm").install();
    }

    @SchemaMigration()
    b(): SchemaNode {
      return Extension("unaccent").install();
    }

    @SchemaProvisioning()
    c(): SchemaNode {
      return Extension("pgcrypto").install();
    }
  }

  const members = declaredSchemaMembers(new Mixed());
  expect(members.map((entry) => entry.moment), equals(["init", "migrations", "provisioning"]));
});

Scribe.test("@SchemaInit() on a static method is refused", () => {
  expect(
    () => {
      class StaticMember {
        @SchemaInit()
        static trigram(): SchemaNode {
          return Extension("pg_trgm").install();
        }
      }
      void StaticMember;
    },
    throwsA(allOf(isA(Error), withMessage("only an instance method can be marked"))),
  );
});

Scribe.test("two unrelated classes each declaring a decorated method do not see each other's members", () => {
  class A {
    @SchemaInit()
    one(): SchemaNode {
      return Extension("pg_trgm").install();
    }
  }

  class B {
    @SchemaMigration()
    one(): SchemaNode {
      return Extension("unaccent").install();
    }
  }

  expect(declaredSchemaMembers(new A()).map((entry) => entry.moment), equals(["init"]));
  expect(declaredSchemaMembers(new B()).map((entry) => entry.moment), equals(["migrations"]));
});
