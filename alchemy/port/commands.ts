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

/**
 * What a program left behind once it exited.
 *
 * @remarks
 * The output is handed back as raw bytes: a caller that wanted text can decode it, and a caller
 * that wanted bytes cannot undo a decode. The two streams are kept apart the way the program
 * wrote them.
 */
export interface CommandResult {
  /** The exit code the program returned. Zero is success, by the convention every shell keeps. */
  readonly code: number;

  /** Every byte the program wrote to its standard output. */
  readonly stdout: Uint8Array;

  /** Every byte the program wrote to its standard error. */
  readonly stderr: Uint8Array;
}

/**
 * What a program is given when it is run, beyond its arguments.
 *
 * @remarks
 * There is one field. More are added here rather than as parameters of {@link Command.run} when a
 * caller needs them, a working directory and an environment being the likely next two.
 */
export interface CommandOptions {
  /** The bytes to hand the program on its standard input. Nothing is written to it when this is left out. */
  readonly stdin?: Uint8Array;
}

/**
 * A way to run a program that is not this process and wait for it to finish.
 *
 * @remarks
 * A package that shells out to a tool names the tool and its arguments through this, never through
 * the runtime under it. The one implementation that starts a real subprocess lives beside the
 * other drivers, in `foundation`, so this file names nothing that runs and a test can stand a
 * fixed answer behind it.
 *
 * It is for a tool that runs once and stops, not one that streams: {@link Command.run} waits for
 * the program to exit and reads its output whole.
 */
export interface Command {
  /**
   * Runs `program` with `args` and waits for it to exit.
   *
   * @param program - The name of the program, looked up on the path, or an absolute path to it.
   * @param args - The arguments, each its own string, never a line something else splits.
   * @param options - What to hand the program beyond its arguments.
   * @returns What the program left behind once it exited.
   * @throws When the program is not found, or when the process is not allowed to start it. A
   * program that starts and exits non-zero answers with its code rather than throwing.
   */
  run(program: string, args: readonly string[], options?: CommandOptions): Future<CommandResult>;
}

/**
 * What answers a package that needs to run a program.
 *
 * @remarks
 * The host fills this once, at boot, with the runner of real subprocesses, and a test fills it
 * with one that answers from memory, so that nothing a test checks depends on a binary being
 * installed on the machine running it. Nothing declares against it: a command is run, not
 * declared, and a caller reaches it while a request is in flight, by which time the host is up.
 *
 * @example
 * ```ts ignore
 * Commands.use(new MemoryCommands({ code: 0, stdout: rawFrame }));
 * ```
 */
export const Commands: Slot<Command> = new Slot<Command>("Commands");
