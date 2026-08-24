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
  anything,
  callsOf,
  capture,
  clearCalls,
  contains,
  equals,
  expect,
  expectLater,
  having,
  isA,
  matching,
  MissingAnswerError,
  mock,
  NoCallReadError,
  reset,
  throwsA,
  when,
} from "../../test/mod.ts";

interface Store {
  get(id: string): Promise<string | null>;
  put(id: string, value: string): Promise<void>;
  count(): number;
  clear(): void;
}

Deno.test("a call nothing answers refuses instead of answering nothing", () => {
  const store = mock<Store>({ named: "store" });

  expect(
    () => store.count(),
    throwsA(
      having(isA(MissingAnswerError), (raised) => raised.message, "message", contains("store.count() has no answer")),
    ),
  );
});

Deno.test("the refusal says what to write to answer the call", () => {
  const store = mock<Store>({ named: "store" });

  expect(
    () => store.get("ada"),
    throwsA(having(
      isA(MissingAnswerError),
      (raised) => raised.message,
      "message",
      contains('when(() => store.get("ada")).thenReturn'),
    )),
  );
});

Deno.test("an answer is given to the call it was declared for and to no other", () => {
  const store = mock<Store>();
  when(() => store.get("ada")).thenResolve("editor");

  expect(() => store.get("grace"), throwsA(isA(MissingAnswerError)));
});

Deno.test("the last answer declared wins over the ones before it", async () => {
  const store = mock<Store>();
  when(() => store.get(anything<string>())).thenResolve(null);
  when(() => store.get("ada")).thenResolve("editor");

  expect(await store.get("ada"), equals("editor"));
  expect(await store.get("grace"), equals(null));
});

Deno.test("thenThrow raises instead of answering", () => {
  const store = mock<Store>();
  const refused = new Error("locked");
  when(() => store.clear()).thenThrow(refused);

  expect(() => store.clear(), throwsA(having(isA(Error), (raised) => raised.message, "message", contains("locked"))));
});

Deno.test("thenReject answers a promise that rejects", async () => {
  const store = mock<Store>();
  when(() => store.put("ada", "editor")).thenReject(new Error("conflict"));

  await expectLater(
    () => store.put("ada", "editor"),
    throwsA(having(isA(Error), (raised) => raised.message, "message", contains("conflict"))),
  );
});

Deno.test("thenAnswer is handed the arguments of the call being made", async () => {
  const store = mock<Store>();
  when(() => store.get(anything<string>())).thenAnswer((id) => Promise.resolve(`${id as string}!`));

  expect(await store.get("ada"), equals("ada!"));
  expect(await store.get("grace"), equals("grace!"));
});

Deno.test("thenReturnEach answers in order and refuses once its answers run out", () => {
  const store = mock<Store>();
  when(() => store.count()).thenReturnEach([1, 2]);

  expect(store.count(), equals(1));
  expect(store.count(), equals(2));
  expect(
    () => store.count(),
    throwsA(
      having(isA(NoCallReadError), (raised) => raised.message, "message", contains("has now been called 3 times")),
    ),
  );
});

Deno.test("a call with a different number of arguments is a different call", () => {
  const store = mock<Store>();
  when(() => store.put("ada", "editor")).thenResolve(undefined);

  expect(() => (store.put as (id: string) => unknown)("ada"), throwsA(isA(MissingAnswerError)));
});

Deno.test("matching stands for an argument its predicate accepts", async () => {
  const store = mock<Store>();
  when(() => store.get(matching<string>((id) => id.startsWith("a")))).thenResolve("editor");

  expect(await store.get("ada"), equals("editor"));
  expect(() => store.get("grace"), throwsA(isA(MissingAnswerError)));
});

Deno.test("a member reads as the same function every time, so identity holds", () => {
  const store = mock<Store>();

  expect(store.get === store.get, equals(true));
});

Deno.test("awaiting a double answers the double itself rather than hanging", async () => {
  const store = mock<Store>();

  expect(await Promise.resolve(store), equals(store));
});

Deno.test("when refuses a function that called nothing on a double", () => {
  expect(
    () => when(() => 1 + 1),
    throwsA(
      having(isA(NoCallReadError), (raised) => raised.message, "message", contains("called nothing on a double")),
    ),
  );
});

Deno.test("callsOf answers every call in the order they were made", () => {
  const store = mock<Store>();
  when(() => store.count()).thenReturn(0);

  store.count();
  store.count();

  expect(callsOf(store), equals([{ member: "count", args: [] }, { member: "count", args: [] }]));
});

Deno.test("clearCalls forgets the calls and keeps the answers", () => {
  const store = mock<Store>();
  when(() => store.count()).thenReturn(7);

  store.count();
  clearCalls(store);

  expect(callsOf(store), equals([]));
  expect(store.count(), equals(7));
});

Deno.test("reset forgets the answers too, so the double refuses again", () => {
  const store = mock<Store>();
  when(() => store.count()).thenReturn(7);

  reset(store);

  expect(() => store.count(), throwsA(isA(MissingAnswerError)));
});

Deno.test("a capture keeps what each matched call carried", () => {
  const store = mock<Store>();
  const value = capture<string>();
  when(() => store.put("ada", value.arg)).thenResolve(undefined);

  store.put("ada", "editor");
  store.put("ada", "reader");

  expect(value.values, equals(["editor", "reader"]));
});
