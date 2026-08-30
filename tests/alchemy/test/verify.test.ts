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
import {
  anything,
  capture,
  contains,
  equals,
  expect,
  having,
  isA,
  mock,
  NoCallReadError,
  Scribe,
  throwsA,
  VerificationError,
  verify,
  verifyInOrder,
  verifyNever,
  verifyNoMoreInteractions,
  when,
} from "@scribe/alchemy/test";

interface Log {
  write(line: string): void;
  flush(): void;
}

function logging(): Log {
  const log = mock<Log>({ named: "log" });
  when(() => log.write(anything<string>())).thenReturn(undefined);
  when(() => log.flush()).thenReturn(undefined);
  return log;
}

Scribe.test("a call that never happened refuses, and the refusal lists what did happen", () => {
  const log = logging();
  log.write("started");

  expect(
    () => verify(() => log.flush()),
    throwsA(having(
      isA(VerificationError),
      (raised) => raised.message,
      "message",
      contains('write("started")'),
    )),
  );
});

Scribe.test("once refuses when the call was made twice", () => {
  const log = logging();
  log.write("a");
  log.write("a");

  expect(
    () => verify(() => log.write("a")).once(),
    throwsA(having(isA(VerificationError), (raised) => raised.message, "message", contains("was called twice"))),
  );
});

Scribe.test("times, atLeast and atMost each answer for the count they name", () => {
  const log = logging();
  log.write("a");
  log.write("a");
  log.write("a");

  verify(() => log.write("a")).times(3).atLeast(2).atMost(3);
});

Scribe.test("a check claims every call it matched, so a second check of it finds nothing left", () => {
  const log = logging();
  log.write("a");
  log.write("a");

  verify(() => log.write("a")).twice();
  expect(
    () => verify(() => log.write("a")),
    throwsA(having(isA(VerificationError), (raised) => raised.message, "message", contains("was never called"))),
  );
});

Scribe.test("verifyNever refuses when the call was made, claimed or not", () => {
  const log = logging();
  log.write("a");
  verify(() => log.write("a")).once();

  expect(
    () => verifyNever(() => log.write("a")),
    throwsA(having(isA(VerificationError), (raised) => raised.message, "message", contains("expected never to be"))),
  );
});

Scribe.test("verifyNever holds when the call was never made", () => {
  const log = logging();
  log.write("a");

  verifyNever(() => log.write("b"));
});

Scribe.test("verifyInOrder holds when the calls came in the order given, whatever sat between", () => {
  const log = logging();
  log.write("first");
  log.write("noise");
  log.write("second");

  verifyInOrder([() => log.write("first"), () => log.write("second")]);
});

Scribe.test("verifyInOrder refuses when the calls came the other way round", () => {
  const log = logging();
  log.write("second");
  log.write("first");

  expect(
    () => verifyInOrder([() => log.write("first"), () => log.write("second")]),
    throwsA(having(
      isA(VerificationError),
      (raised) => raised.message,
      "message",
      contains("was not called in the order given"),
    )),
  );
});

Scribe.test("verifyNoMoreInteractions refuses when a call no check claimed is left", () => {
  const log = logging();
  log.write("a");
  log.write("b");
  verify(() => log.write("a")).once();

  expect(
    () => verifyNoMoreInteractions(log),
    throwsA(having(isA(VerificationError), (raised) => raised.message, "message", contains('write("b")'))),
  );
});

Scribe.test("verifyNoMoreInteractions holds once every call has been claimed", () => {
  const log = logging();
  log.write("a");
  verify(() => log.write("a")).once();

  verifyNoMoreInteractions(log);
});

Scribe.test("a capture collects the calls a declared answer matched", () => {
  const line = capture<string>();
  const log = mock<Log>({ named: "log" });
  when(() => log.write(line.arg)).thenReturn(undefined);

  log.write("a");
  log.write("b");

  expect(line.values, equals(["a", "b"]));
});

Scribe.test("a check clears what a capture kept before counting, so it answers for itself alone", () => {
  const line = capture<string>();
  const log = mock<Log>({ named: "log" });
  when(() => log.write(line.arg)).thenReturn(undefined);

  log.write("a");
  log.write("b");
  verify(() => log.write("a")).once();

  verify(() => log.write(line.arg)).once();
  expect(line.values, equals(["b"]));
});

Scribe.test("verify refuses a function that called nothing on a double", () => {
  expect(
    () => verify(() => 1 + 1),
    throwsA(
      having(isA(NoCallReadError), (raised) => raised.message, "message", contains("called nothing on a double")),
    ),
  );
});

Scribe.test("a check never reaches the answers, so it records nothing itself", () => {
  const log = logging();
  log.write("a");

  verify(() => log.write("a")).once();
  verifyNoMoreInteractions(log);
});
