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

import { Registry } from "../../wiring/declare/registry.ts";
import type { UnmodifiableList } from "../../primitives/value/list.ts";

/** A class built with no arguments — what `@Schema` requires, the same shape `@Proto` requires of a protocol contract. */
type SchemaConstructor = new () => object;

/** A `@Schema()` class, exactly as its decorator recorded it. */
export interface RegisteredSchema {
  /** The name this class was declared under: its own class name. */
  readonly name: string;

  /** The class itself, not yet instantiated — `schema.ts`'s own collection step builds it and reads `declaredNodes(instance)` once it is ready to answer a package's own declarations. */
  readonly source: SchemaConstructor;
}

/** Every `@Schema` class declared so far, by the class name it took. */
const declared = new Registry<RegisteredSchema>("schema");

/**
 * Marks a class as one file of a package's own `db` schema.
 *
 * @remarks
 * Never calls `new target()`: nothing here needs an instance yet, only the class itself, since
 * every `@SchemaInit`/`@SchemaMigration`/`@SchemaProvisioning` method is called later, by whatever
 * reads {@link declaredSchemas} — `schema.ts`'s own `declaredTables`, `declaredGrants` and the rest,
 * or a future `scribe forge`. A class registered here but never read by one declares nothing to
 * anyone, the same as any other value nothing reads. Unlike `@Proto`, this takes no module slug: a
 * package's own schema is always read one whole package at a time, so there is no family to tell
 * apart the way a `.proto` file's own `scribe.v1`/`scribe.runtime.*`/`scribe.clients.*` needs one.
 *
 * @throws {DuplicateDeclarationError} When a class of this name is already declared.
 */
export function Schema() {
  return function (target: SchemaConstructor, _context: ClassDecoratorContext<SchemaConstructor>): void {
    declared.declare(target.name, { name: target.name, source: target });
  };
}

/** Every `@Schema` class declared so far, in declaration order. */
export function declaredSchemas(): UnmodifiableList<RegisteredSchema> {
  return declared.all();
}

/** Forgets every declared schema class, which is what a test does between cases. */
export function forgetSchemas(): void {
  declared.forget();
}
