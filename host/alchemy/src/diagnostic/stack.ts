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

/** One line of a stack trace, once it is known whose code it names. */
export interface Frame {
  /** The frame as it should be shown, with any root it falls under taken off the front. */
  readonly text: string;

  /** Whether this frame names code under one of the roots it was read against. */
  readonly own: boolean;
}

const FRAME = /^\s*at\s+(.*)$/;
const LOCATION = /\(([^()]*)\)\s*$/;

/**
 * The frames of `stack`, each said to be own or foreign against `roots`.
 *
 * @remarks
 * A root is a directory whose code counts as yours. Knowing which ones those are is not something
 * this file can hold: it would be data about a particular repository, and this one has to stay
 * ignorant of any. So they arrive as an argument, written as plain paths or as file URLs, and both
 * are read the same way.
 *
 * A frame that falls under a root is shown relative to it, so a reader sees `host/core/kernel.ts`
 * where the runtime wrote an absolute URL. A frame under none of them is left as it stands, since
 * shortening a path nobody owns only hides where it came from.
 */
export function framesOf(stack: string, roots: UnmodifiableList<string>): List<Frame> {
  const shortened = roots
    .map(withoutScheme)
    .filter((root) => root !== "")
    .sort((a, b) => b.length - a.length);

  return stack
    .split("\n")
    .map((line) => FRAME.exec(line)?.[1])
    .filter((frame): frame is string => frame !== undefined)
    .map((frame) => against(frame, shortened));
}

/**
 * `frames` with every run of foreign ones replaced by a line saying how many were left out.
 *
 * @remarks
 * What a reader wants first is the last place their own code stood, and a trace that opens on
 * fifteen frames of a runtime buries it. Folding hides those by default and never denies them: the
 * count says exactly how many are behind the line.
 */
export function foldFrames(frames: UnmodifiableList<Frame>): List<string> {
  const lines: string[] = [];
  let hidden = 0;

  const flush = (): void => {
    if (hidden === 0) return;
    lines.push(
      hidden === 1 ? "... 1 frame elsewhere" : `... ${hidden} frames elsewhere`,
    );
    hidden = 0;
  };

  for (const frame of frames) {
    if (frame.own) {
      flush();
      lines.push(frame.text);
    } else {
      hidden += 1;
    }
  }

  flush();
  return lines;
}

function against(frame: string, roots: UnmodifiableList<string>): Frame {
  const location = LOCATION.exec(frame)?.[1] ?? frame;
  const path = withoutScheme(location);
  const root = roots.find((held) => path.startsWith(`${held}/`));

  if (root === undefined) return { text: frame, own: false };

  return {
    text: frame.replace(location, path.slice(root.length + 1)),
    own: true,
  };
}

function withoutScheme(path: string): string {
  const bare = path.startsWith("file://") ? decodeURIComponent(path.slice("file://".length)) : path;
  return bare.endsWith("/") ? bare.slice(0, -1) : bare;
}
