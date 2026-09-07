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
import type { DeclaredExtension, SchemaNode } from "@scribe/alchemy";
import {
  declaredExtensions,
  DuplicateDeclarationError,
  Extension,
  forgetSchemas,
  Schema,
  SchemaInit,
  SchemaProvisioning,
} from "@scribe/alchemy";

function extensionOf(node: SchemaNode): DeclaredExtension {
  if (node.bucket !== "extension") throw new Error(`expected an extension node, got "${node.bucket}"`);
  return node.value;
}

Scribe.test("install with no modifier leaves schema, version and cascade all undefined", () => {
  const declared = extensionOf(Extension("pg_trgm").install());

  expect(
    declared,
    equals({
      name: "pg_trgm",
      options: { schema: undefined, version: undefined, cascade: undefined },
    }),
  );
});

Scribe.test("schema, version and cascade are carried through once set", () => {
  const declared = extensionOf(Extension("vector").schema("extensions").version("0.8.0").cascade().install());

  expect(declared.options, equals({ schema: "extensions", version: "0.8.0", cascade: true }));
});

Scribe.test("an extension name declared twice, even across two different moments, is refused", () => {
  forgetSchemas();

  @Schema()
  class ExtensionNameConflict {
    @SchemaProvisioning()
    a(): SchemaNode {
      return Extension("extension_name_conflict").install();
    }
    @SchemaInit()
    b(): SchemaNode {
      return Extension("extension_name_conflict").install();
    }
  }
  void ExtensionNameConflict;

  expect(
    () => declaredExtensions("init"),
    throwsA(
      allOf(isA(DuplicateDeclarationError), withMessage('extension "extension_name_conflict" is declared twice')),
    ),
  );
});

Scribe.test("declaredExtensions filters by the moment it was declared for", () => {
  forgetSchemas();

  @Schema()
  class ExtensionMoments {
    @SchemaProvisioning()
    pgcrypto(): SchemaNode {
      return Extension("pgcrypto").install();
    }
    @SchemaInit()
    citext(): SchemaNode {
      return Extension("citext").install();
    }
  }
  void ExtensionMoments;

  const provisioning = declaredExtensions("provisioning").map((entry) => entry.name);
  const init = declaredExtensions("init").map((entry) => entry.name);

  expect(provisioning.includes("pgcrypto"), equals(true));
  expect(provisioning.includes("citext"), equals(false));
  expect(init.includes("citext"), equals(true));
});
