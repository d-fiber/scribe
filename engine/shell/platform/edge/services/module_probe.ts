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

import type { Future } from "@scribe/alchemy";
import { FileSystems } from "@scribe/alchemy";

/**
 * Whether a directory the resolver is considering actually holds a runnable service.
 *
 * @remarks
 * A seam of its own so `DirectoryServiceResolver` never touches a filesystem API directly: a test
 * hands it a probe that answers from memory, which is what keeps resolver tests from needing a
 * real directory tree on disk to run against.
 */
export interface ModuleProbe {
  hasModule(directory: string): Future<boolean>;
}

/** The {@link ModuleProbe} that checks the real filesystem, the one the resolver uses outside a test. */
export class FilesystemModuleProbe implements ModuleProbe {
  readonly #entryFile: string;

  constructor(entryFile = "index.ts") {
    this.#entryFile = entryFile;
  }

  /**
   * The {@link ModuleProbe.hasModule} implementation.
   *
   * @remarks
   * `directory` must exist, be a directory, and contain this probe's entry file, so a path that
   * merely happens to share a name with an unrelated file is never mistaken for a service. Any
   * read failure answers `false` rather than throwing, since the resolver is only ever asking
   * whether a guess panned out, and a filesystem error answering the same as a directory that
   * simply is not there lets the resolver fall through to its next guess instead of crashing on one.
   */
  async hasModule(directory: string): Future<boolean> {
    try {
      const disk = FileSystems.get().open();
      const found = await disk.describe(directory);
      if (found === null || !found.isDirectory) return false;
      return (await disk.describe(`${directory}/${this.#entryFile}`)) !== null;
    } catch {
      return false;
    }
  }
}
