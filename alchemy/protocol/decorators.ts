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

import { Registry } from "../wiring/declare/registry.ts";
import type { UnmodifiableList } from "../primitives/value/list.ts";
import type { ProtoBuilder } from "./builder.ts";

/** A class built with no arguments, whose instances extend {@link ProtoBuilder} — what `@Proto` requires. */
type ProtocolConstructor = new () => ProtoBuilder;

/** A `@Proto(...)` class, exactly as its decorator recorded it. */
export interface RegisteredProtocol {
  /** The name this class was declared under: its own class name. */
  readonly name: string;

  /**
   * The module slug `@Proto` was given, absent for the socle contract.
   *
   * @remarks
   * Carries no proto package or file path of its own: which family a class belongs to —
   * `scribe.v1`, `scribe.runtime.*` or `scribe.clients.*` — is read from where its own source file
   * sits in the repository, the same way a package's `deploy/` needs no key in `package.yaml` to
   * say what it tends to the stack. That reading is a generation step's job, still to be written.
   */
  readonly module?: string;

  /** The class itself, not yet instantiated — a generation step builds it and calls `imports()`/`builder()` once it is ready to render this class's own output. */
  readonly source: ProtocolConstructor;
}

/** Every `@Proto` class declared so far, by the class name it took. */
const declared = new Registry<RegisteredProtocol>("protocol");

/**
 * Marks a class as one contract of the host↔worker protocol, named `module` when it belongs to a
 * package rather than the socle.
 *
 * @remarks
 * Unlike `@Lifecycle`, this never calls `new target()`: nothing here needs an instance yet, only
 * the class itself, since `imports()` and each decorated method are called later, by whatever
 * generation step reads {@link declaredProtocols}. A class registered here but never read by one
 * declares nothing to anyone, the same as any other value nothing reads.
 *
 * @throws {DuplicateDeclarationError} When a class of this name is already declared.
 */
export function Proto(module?: string) {
  return function (target: ProtocolConstructor, _context: ClassDecoratorContext<ProtocolConstructor>): void {
    declared.declare(target.name, { name: target.name, module, source: target });
  };
}

/** Every `@Proto` class declared so far, in declaration order. */
export function declaredProtocols(): UnmodifiableList<RegisteredProtocol> {
  return declared.all();
}

/** Forgets every declared protocol class, which is what a test does between cases. */
export function forgetProtocols(): void {
  declared.forget();
}
