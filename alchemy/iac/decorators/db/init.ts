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

import { DuplicateDeclarationError } from "../../../declare/registry.ts";
import type { Future } from "../../../async/future.ts";
import type { UnmodifiableList } from "../../../value/list.ts";

/** A declared one-time database job, and the handler that runs it. */
export interface RegisteredInitDb {
  /** The name this job was declared under, and the key a runner tracks it as having run under. */
  readonly name: string;

  /** The body to run the one time this job has never run before. */
  readonly handler: InitDbHandler;
}

/**
 * Every `InitDB` declared so far, indexed by name.
 *
 * The name has to be unique because it is the key the tracking table stores: two declarations
 * sharing one would be indistinguishable once either had run.
 */
export class InitDbRegistry {
  readonly #jobs = new Map<string, RegisteredInitDb>();

  /** Registers a job, and refuses a name already taken. */
  add(entry: RegisteredInitDb): void {
    if (this.#jobs.has(entry.name)) {
      throw new DuplicateDeclarationError(
        `new InitDB("${entry.name}"): this name is already declared. An init-db name is the key ` +
          `it is tracked by, it must be unique.`,
      );
    }
    this.#jobs.set(entry.name, entry);
  }

  /** The jobs declared so far, in declaration order. */
  list(): UnmodifiableList<RegisteredInitDb> {
    return [...this.#jobs.values()];
  }

  /** One line naming how many jobs are declared, printed before a runner plays them. */
  report(): string {
    const jobs = this.list();
    if (jobs.length === 0) {
      return "[init-db] no job declared";
    }

    return `[init-db] ${jobs.length} job(s) declared: ${jobs.map((entry) => entry.name).join(", ")}`;
  }
}

/** The registry every `InitDB` declaration writes into. */
export const initDbRegistry: InitDbRegistry = new InitDbRegistry();

/** The body of a one-time database job. Throwing stops a runner before it tracks this job as done. */
export type InitDbHandler = () => Future<void>;

/**
 * Marks a method as a job that runs once, ever, before any of a package's own schema exists —
 * the code counterpart of the `init` moment `Deploy({ db: { init: ... } })` declares in SQL, for
 * one-time database work no schema entry covers: seeding a row whose value has to be generated,
 * calling out to a service to mint a credential a first table depends on.
 *
 * ```ts
 * @DB()
 * export class Seeds {
 *   @InitDB()
 *   async seedDefaultAdmin(): Future<void> {
 *     await database.internal_t__admin_users().insertOne({ email: "admin@example.com" });
 *   }
 * }
 * ```
 *
 * The class it lives on must carry `@DB()`, which is what builds the instance this method needs
 * to run bound to `this`. A project or a package may write as many `@DB` classes as it likes,
 * each with its own `@InitDB` — but only one per class: the name it registers under is the
 * class's own name, so a second `@InitDB` on the same class collides with the first, the same way
 * a second `new Cron(...)` under a name already taken would.
 *
 * Registering here does not run anything: like `@Init`/`@Run` in `lifecycle/`, this only fills
 * `initDbRegistry`. Playing what it holds, once per stack and before a package's own `init`
 * schema, is a separate concern this module does not carry.
 *
 * @throws {Error} When applied to anything but an instance method.
 */
export function InitDB() {
  return function <This extends object, Fn extends InitDbHandler>(
    target: Fn,
    context: ClassMethodDecoratorContext<This, Fn>,
  ): void {
    if (context.kind !== "method" || context.static) {
      throw new Error(`@InitDB() on "${String(context.name)}": only an instance method can be marked.`);
    }

    context.addInitializer(function (this: This): void {
      const name = (this.constructor as { name: string }).name;
      initDbRegistry.add({ name, handler: () => target.call(this) });
    });
  };
}
