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
import type { List } from "../primitives/value/list.ts";
import type { Future } from "../primitives/async/future.ts";
import type { ProtocolBuilder } from "./protocol.ts";

/**
 * Which of the three proto `package` families a `@CoreProtocol`/`@RuntimeProtocol`/`@ClientProtocol`
 * class belongs to — `protocol.md`'s own "Le `package` déclaré dans un `.proto` ne suit pas le
 * chemin du fichier" names the three: `v1` for the socle, shared by everything under `protocol/`;
 * `runtime` for what `foundation` gives a worker; `clients` for what an optional package gives one.
 */
export type ProtoFamily = "v1" | "runtime" | "clients";

/**
 * What a `@CoreProtocol`/`@RuntimeProtocol`/`@ClientProtocol` class must implement — checked by
 * the type of the decorator itself, so a class missing either method is refused where the
 * decorator is written, never later.
 */
export interface ProtocolSource {
  /** The `.proto` files this contract needs an `import` for, by path — `"scribe/protocol/common.proto"` for example. Never derived: proto3 requires the statement, so the author names it, the same reason a `Message` field never derives a foreign key's target. */
  imports(): List<string>;

  /** The messages, enums and services this class declares, resolved through `protocol.builder`. */
  build(): Future<ProtocolBuilder>;
}

/** A class built with no arguments, whose instances satisfy `ProtocolSource` — what every family decorator requires. */
type ProtocolConstructor = new () => ProtocolSource;

/** A `@CoreProtocol`/`@RuntimeProtocol`/`@ClientProtocol` class, exactly as its decorator recorded it. */
export interface RegisteredProtocol {
  /** The name this class was declared under: its own class name. */
  readonly name: string;

  /** The proto package family this class belongs to. */
  readonly family: ProtoFamily;

  /** The class itself, not yet instantiated — a generation step builds it and calls `imports()`/`build()` once it is ready to render this class's own output. */
  readonly source: ProtocolConstructor;
}

/** Every `@CoreProtocol`/`@RuntimeProtocol`/`@ClientProtocol` class declared so far, by the class name it took. */
const declared = new Registry<RegisteredProtocol>("protocol");

/**
 * Builds the class decorator behind `CoreProtocol`, `RuntimeProtocol` and `ClientProtocol` — each
 * names its own `family` and calls this once, rather than hand-rolling its own registration, the
 * same split `lifecycle/job.ts`'s own `jobDecorator` gives `Init`/`Run`/`InitDB`/`MigrationDB`/
 * `ProvisioningDB`.
 *
 * @remarks
 * Unlike `@Lifecycle`, this never calls `new target()`: nothing here needs an instance yet, only
 * the class itself, since `imports()` and `build()` are called later, by whatever generation step
 * reads `declaredProtocols()` — a class registered here but never read by one declares nothing to
 * anyone, the same as any other value nothing reads.
 *
 * Three names rather than one `Protocol(family)` taking a string: a family is a fact the
 * generation step must be able to read from the decorator itself, at a glance, the same reason
 * `@DB` exists next to `@Lifecycle` — see that decorator's own remarks.
 */
export function protocolDecorator(family: ProtoFamily) {
  return function (target: ProtocolConstructor, _context: ClassDecoratorContext<ProtocolConstructor>): void {
    declared.declare(target.name, { name: target.name, family, source: target });
  };
}

/**
 * Marks a class as the socle contract, `scribe.v1` — the `.proto` files under `protocol/` itself,
 * shared by every worker regardless of which packages it mounts.
 *
 * @throws {DuplicateDeclarationError} When a class of this name is already declared, under any of
 * the three family decorators.
 */
export function CoreProtocol() {
  return protocolDecorator("v1");
}

/**
 * Marks a class as part of what `foundation` gives a worker, `scribe.runtime.*` — the primitives
 * every project mounts, since `foundation` cannot be left out.
 *
 * @throws {DuplicateDeclarationError} When a class of this name is already declared, under any of
 * the three family decorators.
 */
export function RuntimeProtocol() {
  return protocolDecorator("runtime");
}

/**
 * Marks a class as part of what an optional package gives a worker, `scribe.clients.*` — `auth`,
 * `storage`, `realtime` and `search` today.
 *
 * @throws {DuplicateDeclarationError} When a class of this name is already declared, under any of
 * the three family decorators.
 */
export function ClientProtocol() {
  return protocolDecorator("clients");
}

/** Every `@CoreProtocol`/`@RuntimeProtocol`/`@ClientProtocol` class declared so far, in declaration order. */
export function declaredProtocols(): UnmodifiableList<RegisteredProtocol> {
  return declared.all();
}

/** Forgets every declared protocol class, which is what a test does between cases. */
export function forgetProtocols(): void {
  declared.forget();
}
