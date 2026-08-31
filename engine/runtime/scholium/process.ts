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

import { Slot } from "@scribe/alchemy";

/** A signal this process can be asked to shut down on. */
export type ShutdownSignal = "SIGTERM" | "SIGINT";

/** What runs when a watched signal arrives. */
export type SignalHandler = () => void;

/**
 * The process this code runs in, as far as the shell needs to reach it.
 *
 * @remarks
 * A caller never reads the platform directly. It asks {@link Processes} for this instead, so the
 * same shell code reports a resident size and answers a shutdown signal whatever this process
 * actually runs on, today or after it changes.
 */
export interface Process {
  /** This replica's own address, as the host names it. */
  hostname(): string;

  /** Resident memory this process holds, in bytes. */
  residentMemoryBytes(): number;

  /**
   * Runs `handler` when `signal` arrives.
   *
   * @throws {Error} When the host has no such signal to watch. A caller that wants to keep running
   * regardless catches it, the way {@link SignalWatcher} does.
   */
  onShutdownSignal(signal: ShutdownSignal, handler: SignalHandler): void;

  /** Ends this process with `code`. Never returns. */
  exit(code: number): never;
}

/**
 * What answers the shell when it needs to reach the process it runs in.
 *
 * @remarks
 * The host fills this once, at boot, with whatever this process actually runs on. Nothing above
 * `engine/runtime/scholium/` names that host directly: swapping it for another one is a change
 * confined to this folder, because everything else only ever reaches {@link Process}.
 */
export const Processes: Slot<Process> = new Slot<Process>("Processes");

/**
 * The process this code actually runs in, as the port describes one.
 *
 * @remarks
 * It is the only file in this folder that knows how a signal is watched here or how memory is
 * read here. Whatever this process actually runs on decides what that means; the day it changes,
 * this class is rewritten and nothing that calls {@link Processes} notices.
 */
export class LocalProcess implements Process {
  /** The {@link Process.hostname} implementation: the host's own hostname. */
  hostname(): string {
    return Deno.hostname();
  }

  /** The {@link Process.residentMemoryBytes} implementation: the host's own resident set size. */
  residentMemoryBytes(): number {
    return Deno.memoryUsage().rss;
  }

  /** The {@link Process.onShutdownSignal} implementation: registers `handler` on the host's own signal listener. */
  onShutdownSignal(signal: ShutdownSignal, handler: SignalHandler): void {
    Deno.addSignalListener(signal, handler);
  }

  /** The {@link Process.exit} implementation: ends the host process with `code`. */
  exit(code: number): never {
    Deno.exit(code);
  }
}
