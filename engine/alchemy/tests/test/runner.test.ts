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

import {
  callsOf,
  type CaseBody,
  equals,
  expect,
  isA,
  isNotNull,
  MissingAnswerError,
  mock,
  Runners,
  Scribe,
  type TestRunner,
  throwsA,
  when,
} from "../../test/mod.ts";

interface Clock {
  now(): number;
}

interface Declared {
  readonly kind: "test" | "skip" | "only";
  readonly name: string;
  readonly body: CaseBody;
}

function collecting(): { runner: TestRunner; declared: Declared[] } {
  const declared: Declared[] = [];
  const runner: TestRunner = {
    test: (name, body) => void declared.push({ kind: "test", name, body }),
    skip: (name, body) => void declared.push({ kind: "skip", name, body }),
    only: (name, body) => void declared.push({ kind: "only", name, body }),
  };
  return { runner, declared };
}

Deno.test("a case reaches the runner it was declared against", () => {
  const { runner, declared } = collecting();
  Runners.use(runner);

  Scribe.test("sorts what it finds by name", () => {});

  expect(declared.length, equals(1));
  expect(declared[0].kind, equals("test"));
  expect(declared[0].name, equals("sorts what it finds by name"));
});

Deno.test("a group writes its name in front of the cases it holds", () => {
  const { runner, declared } = collecting();
  Runners.use(runner);

  Scribe.group("discovery", () => {
    Scribe.group("sorting", () => {
      Scribe.test("orders by name", () => {});
    });
    Scribe.test("finds every package", () => {});
  });
  Scribe.test("stands on its own", () => {});

  expect(
    declared.map((one) => one.name),
    equals([
      "discovery: sorting: orders by name",
      "discovery: finds every package",
      "stands on its own",
    ]),
  );
});

Deno.test("a group that raises still lets the cases after it keep their own name", () => {
  const { runner, declared } = collecting();
  Runners.use(runner);

  expect(() =>
    Scribe.group("discovery", () => {
      throw new Error("declaring failed");
    }), throwsA(isNotNull));
  Scribe.test("stands on its own", () => {});

  expect(declared[0].name, equals("stands on its own"));
});

Deno.test("a held case carries its reason where the name is read", () => {
  const { runner, declared } = collecting();
  Runners.use(runner);

  Scribe.skip("reads a package built by hand", "the fixture is not written yet", () => {});

  expect(declared[0].kind, equals("skip"));
  expect(declared[0].name, equals("reads a package built by hand (held: the fixture is not written yet)"));
});

Deno.test("the doubles a case built are emptied when the case ends", async () => {
  const { runner, declared } = collecting();
  Runners.use(runner);
  let clock: Clock | null = null;

  Scribe.test("reads the clock", () => {
    clock = mock<Clock>({ named: "clock" });
    when(() => clock!.now()).thenReturn(7);
    expect(clock!.now(), equals(7));
  });

  await declared[0].body();

  expect(callsOf(clock!), equals([]));
  expect(() => clock!.now(), throwsA(isA(MissingAnswerError)));
});

Deno.test("a case that raises still has its doubles emptied", async () => {
  const { runner, declared } = collecting();
  Runners.use(runner);
  let clock: Clock | null = null;

  Scribe.test("raises after reading the clock", () => {
    clock = mock<Clock>({ named: "clock" });
    when(() => clock!.now()).thenReturn(7);
    clock!.now();
    throw new Error("the case failed");
  });

  try {
    await declared[0].body();
  } catch {
    expect(true, equals(true));
  }

  expect(callsOf(clock!), equals([]));
  expect(() => clock!.now(), throwsA(isA(MissingAnswerError)));
});
