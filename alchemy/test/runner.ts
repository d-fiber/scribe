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
import { Slot } from "../bind/slot.ts";
import { closeScope, openScope } from "./mock/mock.ts";
import { forgetIntent } from "./mock/recorder.ts";

/** The body of one case. It may answer a promise, and the case ends when that promise settles. */
export type CaseBody = () => void | Future<void>;

/**
 * What actually holds the cases and runs them.
 *
 * @remarks
 * Three members and nothing else, because every place that wants to run these tests has to
 * implement all three. What a case is called and what it does are decided here; when it runs, and
 * what is printed while it does, belong to whoever fills this.
 */
export interface TestRunner {
  /** Holds `body` under `name` and runs it. */
  test(name: string, body: CaseBody): void;

  /** Holds `body` under `name` and does not run it. */
  skip(name: string, body: CaseBody): void;

  /** Holds `body` under `name`, and narrows the file to the cases declared this way. */
  only(name: string, body: CaseBody): void;
}

/**
 * What runs the cases declared through {@link Scribe}.
 *
 * @remarks
 * Nothing in this repository runs, and a runner is a thing that runs, so the lexicon is here and
 * the runner is filled from outside. That is the same shape every capability takes: an interface to
 * write against, a slot somebody else fills.
 *
 * It is read when a case is declared rather than when one runs, because a runner has to be told
 * about a case before anything starts. So whatever fills it has to do so before the first test
 * module is imported, which in practice means the entry that a test file imports fills it on its
 * way in.
 */
export const Runners: Slot<TestRunner> = new Slot<TestRunner>("Runners");

const groups: string[] = [];

/** The name a case is held under, with the groups it sits in written in front of it. */
function fullName(name: string): string {
  return [...groups, name].join(": ");
}

/**
 * Runs `body` with the doubles built inside it owned by this case, whatever happens in it.
 *
 * @remarks
 * The two things put back afterwards are the doubles, which are emptied so nothing reaches the next
 * case, and the reading state, which a body that raised in the middle of a `when` would otherwise
 * leave open.
 */
function held(body: CaseBody): CaseBody {
  return async () => {
    openScope();
    try {
      await body();
    } finally {
      forgetIntent();
      closeScope();
    }
  };
}

/** The four ways a case is declared. */
export interface Declarations {
  /** Declares one case, which runs. */
  test(name: string, body: CaseBody): void;

  /**
   * Declares one case that is held and never runs.
   *
   * @param name - What the case is called, as a sentence saying what it proves.
   * @param reason - Why it is held. It is required, and it is written beside the name, because a
   * case nobody runs and nobody can explain is a case that stays held forever.
   * @param body - The body, kept so that it still has to compile while it is held.
   */
  skip(name: string, reason: string, body: CaseBody): void;

  /**
   * Declares one case, and narrows its file to the cases declared this way.
   *
   * It is meant for the minute somebody is working on one case, never for something that is
   * committed: a file that reaches the branch carrying one silently stops running everything else
   * it holds.
   */
  only(name: string, body: CaseBody): void;

  /**
   * Gathers the cases `body` declares under `name`.
   *
   * `body` runs where it is written, so the cases inside are declared as the file is read, exactly
   * as they would be without the group. All a group does is put its name in front of theirs.
   */
  group(name: string, body: () => void): void;
}

/**
 * How a case is declared, and the only name a test file needs to import to declare one.
 *
 * @example
 * ```ts ignore
 * Scribe.group("discovery", () => {
 *   Scribe.test("sorts what it finds by name", async () => {
 *     const files = mock<FileSystem>({ named: "files" });
 *     when(() => files.list("/packages")).thenResolve(["realtime", "audience"]);
 *
 *     assertEquals(await discover(files), ["audience", "realtime"]);
 *     verify(() => files.list("/packages")).once();
 *   });
 * });
 * ```
 */
export const Scribe: Declarations = {
  test(name: string, body: CaseBody): void {
    Runners.get().test(fullName(name), held(body));
  },

  skip(name: string, reason: string, body: CaseBody): void {
    Runners.get().skip(`${fullName(name)} (held: ${reason})`, held(body));
  },

  only(name: string, body: CaseBody): void {
    Runners.get().only(fullName(name), held(body));
  },

  group(name: string, body: () => void): void {
    groups.push(name);
    try {
      body();
    } finally {
      groups.pop();
    }
  },
};
