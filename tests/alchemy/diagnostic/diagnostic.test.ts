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

import "@scribe/runtime/scholium/runner.ts";
import { contains, equals, expect, isFalse, isTrue, Scribe } from "@scribe/alchemy/test";
import { foldFrames, framesOf, renderError, ScribeError } from "@scribe/alchemy";

const STACK = [
  "Error: nothing there",
  "    at open (file:///home/ada/scribe/host/core/kernel/http/serve/mod.ts:41:11)",
  "    at ext:deno_web/02_timers.js:66:10",
  "    at ext:core/01_core.js:178:7",
  "    at answer (file:///home/ada/scribe/host/boot/bootstrap.ts:12:3)",
].join("\n");

const ROOTS = ["/home/ada/scribe"];

Scribe.test("a frame under a root is shown relative to it", () => {
  const frames = framesOf(STACK, ROOTS);

  expect(frames[0].own, isTrue, "a frame under a root was called foreign");
  expect(frames[0].text, contains("host/core/kernel/http/serve/mod.ts:41:11"));
  expect(frames[0].text.includes("/home/ada"), isFalse, "the root was left on the front of the frame");
});

Scribe.test("a frame under no root is left exactly as it stands", () => {
  const frames = framesOf(STACK, ROOTS);

  expect(frames[1].own, isFalse, "a runtime frame was called ours");
  expect(frames[1].text, equals("ext:deno_web/02_timers.js:66:10"), "a foreign frame was rewritten");
});

Scribe.test("a root written as a file URL is read like a plain path", () => {
  const frames = framesOf(STACK, ["file:///home/ada/scribe/"]);

  expect(frames[0].own, isTrue, "a root written as a URL matched nothing");
});

Scribe.test("a stack read against no root has no frame of its own", () => {
  expect(framesOf(STACK, []).some((frame) => frame.own), isFalse, "a frame was called ours with no root given");
});

Scribe.test("a run of foreign frames is folded into a count", () => {
  const lines = foldFrames(framesOf(STACK, ROOTS));

  expect(lines.length, equals(3), "the foreign frames were not folded into one line");
  expect(lines[1], contains("2 frames elsewhere"));
});

Scribe.test("a single foreign frame is counted in the singular", () => {
  const folded = foldFrames([{ text: "ext:core/01_core.js:1:1", own: false }]);

  expect(folded, equals(["... 1 frame elsewhere"]), "one hidden frame was counted in the plural");
});

Scribe.test("something raised on purpose is boxed and shown without a trace", () => {
  const written = renderError(new ScribeError('nothing is held at "/gone".'), { scope: "storage" });

  expect(written, contains("┌─ scribe ─ storage "));
  expect(written, contains('nothing is held at "/gone".'));
  expect(written.includes("    at "), isFalse, "a ScribeError was shown with a trace");
});

Scribe.test("a box drawn without a scope still names the framework", () => {
  expect(renderError(new ScribeError("gone")), contains("┌─ scribe "));
});

Scribe.test("a long sentence is wrapped rather than run past the rule", () => {
  const written = renderError(new ScribeError("word ".repeat(60).trim()), { width: 40 });

  expect(written.split("\n").every((line) => line.length <= 40), isTrue, "a line ran past the width it was given");
});

Scribe.test("a fault in the code keeps its trace, folded down to the frames that are ours", () => {
  const raised = new Error("nothing there");
  raised.stack = STACK;

  const written = renderError(raised, { roots: ROOTS });

  expect(written, contains("Error: nothing there"));
  expect(written, contains("host/boot/bootstrap.ts:12:3"));
  expect(written, contains("2 frames elsewhere"));
  expect(written.includes("┌─"), isFalse, "a fault in the code was boxed");
});

Scribe.test("something raised that is not an error at all is still said in a box", () => {
  expect(renderError("gone"), contains("gone"));
});
