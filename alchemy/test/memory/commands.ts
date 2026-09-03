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

import type { Command, CommandOptions, CommandResult } from "../../port/commands.ts";

/** One run a {@link MemoryCommands} was asked for. */
export interface RanCommand {
  /** The program that was named. */
  readonly program: string;

  /** The arguments it was given, in order. */
  readonly args: readonly string[];

  /** The bytes handed to its standard input, or undefined when none were. */
  readonly stdin: Uint8Array | undefined;
}

/**
 * What a {@link MemoryCommands} answers with: the fields it should fill, or a function of the run.
 *
 * @remarks
 * A fixed object answers every run the same way. A function is for a test where the answer depends
 * on which program or which arguments were used, such as a first call that yields nothing and a
 * fallback that yields a frame.
 */
export type CommandAnswer =
  | Partial<CommandResult>
  | ((program: string, args: readonly string[]) => Partial<CommandResult>);

/**
 * A command runner that answers from memory and keeps every run it was asked for.
 *
 * @remarks
 * It is what a test fills {@link Commands} with, so that what it checks does not depend on a binary
 * being installed on the machine running it. A field left out of the answer takes its empty value:
 * `code` is zero, `stdout` and `stderr` are empty.
 *
 * @example
 * ```ts ignore
 * Commands.use(new MemoryCommands({ code: 1, stderr: new TextEncoder().encode("no such file") }));
 * ```
 */
export class MemoryCommands implements Command {
  /** Every run this was asked for, in order. */
  readonly seen: RanCommand[] = [];

  /** What this answers with. */
  readonly #answer: CommandAnswer;

  /**
   * Builds a runner that answers with `answer`.
   *
   * @param answer - The result to fill in, or a function of the program and its arguments. Left
   * out, every run succeeds with no output.
   */
  constructor(answer: CommandAnswer = {}) {
    this.#answer = answer;
  }

  /** The one run this was asked for, for a case that expects exactly one. */
  get only(): RanCommand {
    if (this.seen.length !== 1) {
      throw new Error(`Expected one command, got ${this.seen.length}.`);
    }
    return this.seen[0];
  }

  /** Records the run and answers with what this was built with. */
  run(program: string, args: readonly string[], options?: CommandOptions): Promise<CommandResult> {
    this.seen.push({ program, args: [...args], stdin: options?.stdin });

    const given = typeof this.#answer === "function" ? this.#answer(program, args) : this.#answer;
    return Promise.resolve({
      code: given.code ?? 0,
      stdout: given.stdout ?? new Uint8Array(0),
      stderr: given.stderr ?? new Uint8Array(0),
    });
  }
}
