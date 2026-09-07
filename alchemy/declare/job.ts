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

import type { Future } from "../async/future.ts";
import { DuplicateDeclarationError } from "./registry.ts";
import type { UnmodifiableList } from "../value/list.ts";

/** The body of a job a `jobDecorator` method can mark: no arguments, an asynchronous result. */
export type JobHandler = () => Future<void>;

/** A declared job, and the handler that runs it. */
export interface RegisteredJob {
  /** The name this job was declared under: the class the decorator was written on. */
  readonly name: string;

  /** The body a runner calls to play this job. */
  readonly handler: JobHandler;
}

/**
 * Every job one decorator has declared so far, indexed by the class name it was written on.
 *
 * @remarks
 * `Init`, `Run`, `InitDB`, `MigrationDB` and `ProvisioningDB` each open one of these, never share
 * one: mixing two decorators' jobs into a single registry would let an `@Init` and a `@Run` on the
 * same class collide, when the two answer to different runners entirely. The name a job is
 * declared under has to be unique within its own registry because it is either the key a tracking
 * table stores (`Init`, `InitDB`, `ProvisioningDB`) or simply what tells two declarations apart
 * (`Run`, `MigrationDB`) — a collision would mean one job is silently never run, or
 * indistinguishable from the other once either had.
 */
export class JobRegistry {
  readonly #label: string;
  readonly #jobs = new Map<string, RegisteredJob>();

  /** Opens a registry that reports itself as `label`, the tag `report()` prints in brackets. */
  constructor(label: string) {
    this.#label = label;
  }

  /** Registers a job, and refuses a name already taken. */
  add(entry: RegisteredJob): void {
    if (this.#jobs.has(entry.name)) {
      throw new DuplicateDeclarationError(
        `"${entry.name}" already declared a [${this.#label}] job. A class carries at most one.`,
      );
    }
    this.#jobs.set(entry.name, entry);
  }

  /** The jobs declared so far, in declaration order. */
  list(): UnmodifiableList<RegisteredJob> {
    return [...this.#jobs.values()];
  }

  /** One line naming how many jobs are declared, printed before a runner plays them. */
  report(): string {
    const jobs = this.list();
    if (jobs.length === 0) {
      return `[${this.#label}] no job declared`;
    }

    return `[${this.#label}] ${jobs.length} job(s) declared: ${jobs.map((entry) => entry.name).join(", ")}`;
  }
}

/**
 * Builds the method decorator behind `Init`, `Run`, `InitDB`, `MigrationDB` and `ProvisioningDB` —
 * each of the five calls this once, naming its own `registry` and its own `decoratorName`, rather
 * than hand-rolling its own `addInitializer`.
 *
 * @remarks
 * Before this existed, the five were the same file copied five times, differing only in a
 * registry's own label and the name an error message printed. A sixth job decorator, for a moment
 * this module does not yet know about, is one call to this rather than a sixth copy.
 *
 * The class the decorated method sits on must be built by something — `@Lifecycle()` most often,
 * `@DB()` for a database job — since `addInitializer` only runs once an instance actually exists.
 * A class built no other way never registers its job at all, the same silent nothing as any other
 * value nothing constructs.
 *
 * @param decoratorName - The decorator's own name, `"Init"` or `"InitDB"` for example, used only
 * to name it in the error this raises.
 * @throws {Error} When applied to anything but an instance method.
 */
export function jobDecorator(registry: JobRegistry, decoratorName: string) {
  return function <This extends object, Fn extends JobHandler>(
    target: Fn,
    context: ClassMethodDecoratorContext<This, Fn>,
  ): void {
    if (context.kind !== "method" || context.static) {
      throw new Error(
        `@${decoratorName}() on "${String(context.name)}": only an instance method can be marked.`,
      );
    }

    context.addInitializer(function (this: This): void {
      const name = (this.constructor as { name: string }).name;
      registry.add({ name, handler: () => target.call(this) });
    });
  };
}
