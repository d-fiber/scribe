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

import type { List, UnmodifiableList } from "../value/list.ts";
import { ScribeError } from "../error/scribe_error.ts";
import { foldFrames, framesOf } from "./stack.ts";

/** What the shape of a rendered error depends on. */
export interface RenderOptions {
  /** The directories whose code counts as yours, which is what decides a frame is worth showing. */
  readonly roots?: UnmodifiableList<string>;

  /** The module the error came out of, shown in the rule at the top. It is left out when absent. */
  readonly scope?: string;

  /** How wide the rules are drawn. It is 76 when left out. */
  readonly width?: number;
}

const DEFAULT_WIDTH = 76;

/**
 * `raised` written the way it should reach a terminal.
 *
 * @remarks
 * Two shapes, and which one is used is decided by the class and not by the caller. A
 * {@link ScribeError} is a fault in what somebody wrote, so it is boxed and shown as its sentence
 * with no trace at all: the stack would name this code, and this code is not where the mistake is.
 * Anything else is a fault in the code, so it keeps its trace, folded down to the frames that fall
 * under one of the roots.
 *
 * The box is what makes an error recognisable before it is read, which is the whole point of
 * putting it here rather than leaving each caller to print what it likes.
 */
export function renderError(raised: unknown, options: RenderOptions = {}): string {
  const width = options.width ?? DEFAULT_WIDTH;

  if (raised instanceof ScribeError) return boxed(raised.message, options.scope, width);

  if (!(raised instanceof Error)) return boxed(String(raised), options.scope, width);

  const trace = raised.stack === undefined ? [] : foldFrames(framesOf(raised.stack, options.roots ?? []));
  const heading = `${raised.name}: ${raised.message}`;

  return [heading, ...trace.map((line) => `    ${line}`)].join("\n");
}

function boxed(message: string, scope: string | undefined, width: number): string {
  const title = scope === undefined ? " scribe " : ` scribe ─ ${scope} `;
  const opening = `┌─${title}`;
  const top = `${opening}${"─".repeat(Math.max(0, width - visibleLength(opening)))}`;
  const bottom = `└${"─".repeat(Math.max(0, width - 1))}`;

  const body = wrapText(message, width - 4).map((line) => `  ${line}`);

  return [top, "", ...body, "", bottom].join("\n");
}

function wrapText(message: string, width: number): List<string> {
  const lines: string[] = [];

  for (const paragraph of message.split("\n")) {
    let line = "";

    for (const word of paragraph.split(/\s+/).filter((held) => held !== "")) {
      if (line === "") line = word;
      else if (line.length + 1 + word.length <= width) line = `${line} ${word}`;
      else {
        lines.push(line);
        line = word;
      }
    }

    lines.push(line);
  }

  return lines;
}

function visibleLength(text: string): number {
  return [...text].length;
}
