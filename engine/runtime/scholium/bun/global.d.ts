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

/**
 * Just enough of Bun's global surface for this folder to type-check under `deno check`, which
 * knows nothing about Bun the way it knows `Deno.*` and `node:*` on its own.
 *
 * @remarks
 * Kept narrow on purpose: only the members `commands.ts`, `env.ts` and `listener.ts` actually
 * call. A member Bun's own types would add and this repository never uses is a member nobody
 * would notice going out of date.
 *
 * Written as a module, `export {}` at the bottom, and imported for its side effect by every file
 * here that names `Bun`, rather than left as a free-standing ambient script: `deno check <dir>`
 * walks every file under a directory and would find it either way, but `deno test` only
 * type-checks what a test file's own import graph reaches, and nothing reaches a file nobody
 * imports.
 */
declare global {
  namespace Bun {
    /** What `Bun.serve` hands back once a socket is bound. */
    interface Server {
      /** The port this socket actually bound to, resolved even when the caller asked for any. */
      readonly port: number;

      /** The address a request arrived from, or null when the connection carries none. */
      requestIP(request: Request): { readonly address: string } | null;

      /** Stops answering requests, closing every open connection when `closeActiveConnections` is true. */
      stop(closeActiveConnections?: boolean): void;
    }

    /** What `Bun.serve` accepts to bind a socket. */
    interface ServeOptions {
      /** The port to bind. Left to Bun's own default, an ephemeral one, when absent. */
      readonly port?: number;

      /** The address to bind. Left to Bun's own default when absent. */
      readonly hostname?: string;

      /** Answers a request as it arrives, told which socket it arrived on. */
      fetch(request: Request, server: Server): Response | Promise<Response>;
    }

    /** What a subprocess `Bun.spawn` started hands back. */
    interface Subprocess {
      /** The subprocess's standard input, present because `stdin` was asked for as `"pipe"`. */
      readonly stdin: { write(chunk: Uint8Array): void; end(): void };

      /** The subprocess's standard output, a stream because `stdout` was asked for as `"pipe"`. */
      readonly stdout: ReadableStream<Uint8Array>;

      /** The subprocess's standard error, a stream because `stderr` was asked for as `"pipe"`. */
      readonly stderr: ReadableStream<Uint8Array>;

      /** Settles with the exit code once the subprocess ends. */
      readonly exited: Promise<number>;
    }

    /** What `Bun.spawn` accepts to start a subprocess. */
    interface SpawnOptions {
      /** How the subprocess's standard input is wired. `"ignore"` writes nothing to it. */
      readonly stdin?: "ignore" | "pipe";

      /** How the subprocess's standard output is wired. */
      readonly stdout?: "pipe";

      /** How the subprocess's standard error is wired. */
      readonly stderr?: "pipe";
    }
  }

  var Bun: {
    /** Every name and value the process was started with. */
    readonly env: Record<string, string | undefined>;

    /** Binds a socket and starts answering requests with it. */
    serve(options: Bun.ServeOptions): Bun.Server;

    /** Starts `cmd` as a subprocess. */
    spawn(cmd: readonly string[], options?: Bun.SpawnOptions): Bun.Subprocess;
  };
}

export {};
