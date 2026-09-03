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

import { Slot } from "../bind/slot.ts";
import { Registry } from "../declare/registry.ts";
import type { Future } from "../async/future.ts";
import type { UnmodifiableList } from "../value/list.ts";
import type { Duration } from "../value/duration.ts";

/** A time of day, told in whole hours and minutes. */
export interface DeclaredTimeOfDay {
  /** The hour, from 0 to 23. */
  readonly hour: number;

  /** The minute, from 0 to 59. Zero when left out. */
  readonly minute?: number;
}

/**
 * When something runs, told one of three ways.
 *
 * @remarks
 * The three are not interchangeable and the choice says something. `every` says how often and
 * nothing about when, so the first run lands wherever the process started. `at` says when in the
 * day and leaves the day alone. `expression` says everything, in the notation a scheduler already
 * knows, and it is the only one that can say "the first Monday of the month".
 */
export type DeclaredSchedule =
  | { readonly every: Duration }
  | { readonly at: DeclaredTimeOfDay }
  | { readonly expression: string };

/** What declaring a scheduled run takes. */
export interface CronOptions {
  /** The name this run answers to, which is what keeps two of them apart. */
  readonly key: string;

  /** When it runs. */
  readonly schedule: DeclaredSchedule;

  /**
   * Which zone the schedule is read in. UTC when left out.
   *
   * It matters for {@link DeclaredTimeOfDay} and for an expression, and not at all for `every`: an interval
   * is the same length wherever it is read.
   */
  readonly timezone?: string;

  /**
   * What runs when the schedule fires.
   *
   * @remarks
   * It is declared here rather than found by the host from the key, because a key is a name and a
   * name is not a body: a package that could only announce work and never say what does it left
   * every host to invent its own way of finding the other half.
   */
  readonly run: () => void | Future<void>;
}

/**
 * Something that runs on its own, on a schedule, with nobody asking.
 *
 * @remarks
 * A declaration is all a package writes. What fires it is the host's business, and a test fires it
 * by hand rather than waiting.
 *
 * **Nothing promises it runs exactly once.** Two replicas, a restart at the wrong moment, a
 * schedule that fires while the last run is still going: a handler that cannot bear being run twice
 * has to say so itself, usually by taking a lock.
 */
export interface DeclaredCron {
  /** The name this run answers to. */
  readonly key: string;

  /** When it runs. */
  readonly schedule: DeclaredSchedule;
}

/** What holds a scheduled run and fires it. */
export interface CronDriver {
  /** Takes the run `options` describes and fires it from then on. */
  schedule(options: CronOptions): DeclaredCron;
}

/**
 * What answers a package that needs something to run on its own.
 *
 * The host fills it once, at boot, and a test fills it with something that keeps what was declared
 * so a case can fire it where it likes.
 */
export const Crons: Slot<CronDriver> = new Slot<CronDriver>("Crons");

/** Every scheduled run a package has declared, by the key it answers to. */
const declared = new Registry<CronOptions>("cron");

/**
 * Declares the scheduled run `options` describes, without reaching anything.
 *
 * @remarks
 * It records the declaration and answers a handle. Nothing is scheduled until the host calls
 * {@link installCrons}, which is the same shape every other port takes: a package writes its
 * declarations at module scope, before the host is up, and importing one is safe.
 *
 * Reading the slot here instead would throw in every package that declares a run, because a package
 * entry is imported so the host can read its lifecycle and that import necessarily comes before the
 * host has filled anything.
 *
 * @throws {DuplicateDeclarationError} When `options.key` has already been declared, raised where the
 * second declaration is written.
 *
 * @example
 * ```ts ignore
 * cron({ key: "audience:sweep", schedule: { every: Duration.hours(1) }, run: () => sweep() });
 * ```
 */
export function cron(options: CronOptions): DeclaredCron {
  declared.declare(options.key, options);
  return { key: options.key, schedule: options.schedule };
}

/**
 * Hands every declared run to the driver, and answers what it took.
 *
 * @remarks
 * The host calls it once, after it has filled {@link Crons} and before it starts serving. It is the
 * moment the declarations of every mounted package become something that fires.
 */
export function installCrons(): UnmodifiableList<DeclaredCron> {
  const driver = Crons.get();
  return declared.all().map((options) => driver.schedule(options));
}

/** Forgets every declared run, which is what a test does between cases. */
export function forgetCrons(): void {
  declared.forget();
}
