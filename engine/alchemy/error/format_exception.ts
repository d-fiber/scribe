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

import { ScribeError } from "./scribe_error.ts";

/** How much of the offending text a message shows before it is cut. */
/**
 * Text that does not have the shape it was read as.
 *
 * @remarks
 * It is what every codec raises, and what parsing a value out of text raises, so a caller catching
 * one name covers all of them. It descends from {@link ScribeError} because the message is the
 * whole point: the trace would name the parser, and the parser is not what is wrong.
 *
 * **The text that failed never travels with it.** What a codec is handed is very often the thing
 * worth least showing: `hex.decode` and `base64.decode` are given digests, tokens and signatures,
 * and a message quoting one puts it wherever the message goes, which is the log collector. What
 * travels instead is a description of the text, which locates the fault just as well and carries
 * nothing: how long it was, and where it stopped being what it claimed to be.
 */
export class FormatException extends ScribeError {
  /**
   * @param message - What was expected, said as a sentence.
   */
  constructor(message: string) {
    super(message);
  }
}

/**
 * How to describe `text` in a refusal without quoting any of it.
 *
 * @param length - How many characters were read.
 * @param at - Where it stopped holding, or null when the whole of it is wrong.
 */
export function describeText(length: number, at: number | null): string {
  return at === null
    ? `${length} characters read.`
    : `${length} characters read, the first one that does not hold is at ${at}.`;
}
