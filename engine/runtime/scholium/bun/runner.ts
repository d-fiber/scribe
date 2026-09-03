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

import { test } from "bun:test";

import type { CaseBody, TestRunner } from "@scribe/alchemy/test";

/**
 * The {@link TestRunner} that hands every case declared through `Scribe` to `bun:test`.
 *
 * @remarks
 * It is the one seam between a case and the host, and it lives in the framework rather than in a
 * package because that is the whole point of the split: a package writes against `Scribe` and
 * `expect`, and what actually holds a case and runs it is the framework's to provide. A case body
 * arrives already wrapped by `Scribe`, so there is nothing to do here but register it.
 */
export class TestWrapperRunner implements TestRunner {
  /** Registers `body` under `name` as a case that runs. */
  test(name: string, body: CaseBody): void {
    test(name, body);
  }

  /** Registers `body` under `name` as a case the host holds and does not run. */
  skip(name: string, body: CaseBody): void {
    test.skip(name, body);
  }

  /** Registers `body` under `name` and narrows the file to the cases marked this way. */
  only(name: string, body: CaseBody): void {
    test.only(name, body);
  }
}
