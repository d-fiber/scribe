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

import "@scribe/scholium/runner.ts";
import { allOf, equals, expect, isA, Scribe, throwsA, withMessage } from "@scribe/alchemy/test";
import { protocol } from "@scribe/alchemy";

Scribe.test("build() sorts messages, enums and services into their own lists, in the order given", async () => {
  const built = await protocol.builder((b) => [
    b.message("Second").fields((f) => ({ id: f.string().number(1) })),
    b.enum((e) => e.name("Kind").values((v) => [v.value("A").number(0)])),
    b.message("First").fields((f) => ({ id: f.string().number(1) })),
    b.service("Directory").rpc("Get", "First", "Second"),
  ]);

  expect(built.messages.map((message) => message.name), equals(["Second", "First"]));
  expect(built.enums.map((entry) => entry.name), equals(["Kind"]));
  expect(built.services.map((service) => service.name), equals(["Directory"]));
});

Scribe.test("a name shared between a message and an enum in the same build() is refused", () => {
  expect(
    () =>
      protocol.builder((b) => [
        b.message("Shared").fields(() => ({})),
        b.enum((e) => e.name("Shared").values((v) => [v.value("A").number(0)])),
      ]),
    throwsA(allOf(isA(Error), withMessage('"Shared" names two messages or enums in the same build()'))),
  );
});

Scribe.test("a name shared between a service and a message is not refused", async () => {
  const built = await protocol.builder((b) => [
    b.message("Shared").fields(() => ({})),
    b.service("Shared").rpc("Get", "Shared", "Shared"),
  ]);

  expect(built.messages.map((message) => message.name), equals(["Shared"]));
  expect(built.services.map((service) => service.name), equals(["Shared"]));
});

Scribe.test("a name shared between a service and an enum is not refused", async () => {
  const built = await protocol.builder((b) => [
    b.enum((e) => e.name("Shared").values((v) => [v.value("A").number(0)])),
    b.service("Shared").rpc("Get", "Shared", "Shared"),
  ]);

  expect(built.enums.map((entry) => entry.name), equals(["Shared"]));
  expect(built.services.map((service) => service.name), equals(["Shared"]));
});

Scribe.test("two services sharing the same name in one build() are refused", () => {
  expect(
    () =>
      protocol.builder((b) => [
        b.service("Directory").rpc("Get", "A", "B"),
        b.service("Directory").rpc("List", "A", "B"),
      ]),
    throwsA(allOf(isA(Error), withMessage('"Directory" names two services in the same build()'))),
  );
});

Scribe.test("a service builder resolves to its own declaration, not the builder itself", async () => {
  const built = await protocol.builder((b) => [
    b.service("Directory").rpc("Get", "A", "B").rpc("List", "A", "B"),
  ]);

  expect(
    built.services,
    equals([{
      kind: "service",
      name: "Directory",
      rpcs: [
        { name: "Get", request: "A", response: "B" },
        { name: "List", request: "A", response: "B" },
      ],
    }]),
  );
});
