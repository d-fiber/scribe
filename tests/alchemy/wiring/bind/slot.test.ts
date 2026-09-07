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
import { contains, equals, expect, having, isA, isFalse, isTrue, Scribe, throwsA } from "@scribe/alchemy/test";
import { BindingError, Slot } from "@scribe/alchemy";

Scribe.test("get on an empty slot refuses, naming the slot in the message", () => {
  const transports = new Slot<string>("RealtimeTransports");

  expect(
    () => transports.get(),
    throwsA(having(isA(BindingError), (raised) => raised.message, "message", contains("RealtimeTransports"))),
  );
});

Scribe.test("get answers what use put in", () => {
  const transports = new Slot<string>("RealtimeTransports");
  transports.use("event log");

  expect(transports.get(), equals("event log"));
});

Scribe.test("use a second time replaces what was there, without refusing", () => {
  const transports = new Slot<string>("RealtimeTransports");
  transports.use("event log");
  transports.use("polling");

  expect(transports.get(), equals("polling"));
});

Scribe.test("clear empties the slot, so get refuses again", () => {
  const transports = new Slot<string>("RealtimeTransports");
  transports.use("event log");
  transports.clear();

  expect(() => transports.get(), throwsA(isA(BindingError)));
});

Scribe.test("use after clear fills the slot again", () => {
  const transports = new Slot<string>("RealtimeTransports");
  transports.use("event log");
  transports.clear();
  transports.use("polling");

  expect(transports.get(), equals("polling"));
});

Scribe.test("configured is false before use, true after, and false again after clear", () => {
  const transports = new Slot<string>("RealtimeTransports");

  expect(transports.configured, isFalse, "an empty slot claimed to be configured");
  transports.use("event log");
  expect(transports.configured, isTrue, "a filled slot claimed not to be configured");
  transports.clear();
  expect(transports.configured, isFalse, "a cleared slot still claimed to be configured");
});
