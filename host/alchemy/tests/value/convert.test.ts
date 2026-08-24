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

import { contains, equals, expect, fail, having, isA, isFalse, isTrue, lessThan, throwsA } from "../../test/mod.ts";
import { base64, base64Url, FormatException, hex, json, utf8 } from "../../mod.ts";

const BYTES = new Uint8Array([0, 1, 127, 128, 255]);

Deno.test("what a codec writes, the same codec reads back", () => {
  expect(hex.decode(hex.encode(BYTES)), equals(BYTES));
  expect(base64.decode(base64.encode(BYTES)), equals(BYTES));
  expect(base64Url.decode(base64Url.encode(BYTES)), equals(BYTES));
  expect(utf8.decode(utf8.encode("héllo")), equals("héllo"));
});

Deno.test("hexadecimal is written two lowercase characters per byte", () => {
  expect(hex.encode(BYTES), equals("00017f80ff"));
});

Deno.test("base64 pads, and the address alphabet does not", () => {
  expect(base64.encode(new Uint8Array([1])), equals("AQ=="));
  expect(base64Url.encode(new Uint8Array([1])), equals("AQ"));
});

Deno.test("the address alphabet writes no character an address would take for its own", () => {
  const written = base64Url.encode(new Uint8Array([251, 255, 190]));

  expect(written.includes("+"), equals(false));
  expect(written.includes("/"), equals(false));
  expect(written.includes("="), equals(false));
});

Deno.test("text that does not have the shape it is read as refuses, and says what was read", () => {
  expect(
    () => hex.decode("zz"),
    throwsA(having(isA(FormatException), (raised) => raised.message, "message", contains("2 characters read"))),
  );

  expect(
    () => base64.decode("!!"),
    throwsA(having(isA(FormatException), (raised) => raised.message, "message", contains("Expected base64"))),
  );
  expect(
    () => json.decode("{"),
    throwsA(having(isA(FormatException), (raised) => raised.message, "message", contains("Expected JSON"))),
  );
});

Deno.test("a long offending text is cut short in the message it raises", () => {
  expect(
    () => json.decode("{".repeat(200)),
    throwsA(having(
      isA(FormatException),
      (raised) => raised.message.length,
      "message length",
      lessThan(120),
    )),
  );
});

Deno.test("a value written as JSON reads back as what it was", () => {
  expect(json.decode(json.encode({ id: "ada", tags: [1, 2] })), equals({ id: "ada", tags: [1, 2] }));
});

Deno.test("bytes that spell no text refuse rather than answering the replacement character", () => {
  expect(
    () => utf8.decode(new Uint8Array([0xff, 0xfe])),
    throwsA(having(isA(FormatException), (raised) => raised.message, "message", contains("Expected utf-8"))),
  );
});

Deno.test("a refusal that shows nothing carries nothing to show", () => {
  expect(
    () => utf8.decode(new Uint8Array([0xff])),
    throwsA(isA(FormatException)),
  );
});

Deno.test("a value that writes to nothing is written as the absence JSON has", () => {
  expect(json.encode(undefined), equals("null"));
  expect(json.decode("null"), equals(null));
});

Deno.test("text is written as the bytes it takes, not as the characters it has", () => {
  expect(utf8.encode("é").length, equals(2));
  expect(utf8.encode("a").length, equals(1));
});

Deno.test("an empty input goes through every codec and comes back empty", () => {
  expect(hex.encode(new Uint8Array(0)), equals(""));
  expect(hex.decode("").length, equals(0));
  expect(base64.encode(new Uint8Array(0)), equals(""));
  expect(base64.decode("").length, equals(0));
  expect(utf8.decode(new Uint8Array(0)), equals(""));
});

Deno.test("base64 writes the padding its length calls for, and reads it back either way", () => {
  expect(base64.encode(new Uint8Array([1, 2])), equals("AQI="));
  expect(base64.encode(new Uint8Array([1, 2, 3])), equals("AQID"));
  expect(base64.decode("AQI"), equals(new Uint8Array([1, 2])));
});

Deno.test("base64 reads back only what it writes, so one value has one text", () => {
  expect([...base64.decode("QQ==")], equals([65]));
  expect(() => base64.decode("QR"), throwsA(isA(FormatException)), "a second text for the byte 65 was taken");
  expect(() => base64.decode("QV"), throwsA(isA(FormatException)), "a third text for the byte 65 was taken");
});

Deno.test("base64 for an address refuses the alphabet it does not write", () => {
  expect(() => base64Url.decode("-_+/"), throwsA(isA(FormatException)), "the standard alphabet was taken");
  expect(() => base64Url.decode("QQ=="), throwsA(isA(FormatException)), "padding was taken");
});

Deno.test("hexadecimal is read in the case it is written, and no other", () => {
  expect([...hex.decode("deadbeef")], equals([222, 173, 190, 239]));
  expect(() => hex.decode("DEADBEEF"), throwsA(isA(FormatException)), "a second text for one digest was taken");
});

Deno.test("what a codec refuses says how much was read and never what was read", () => {
  const token = "eyJhbGciOiJIUzI1NiJ9.SECRET-abcdefghij.sig";

  try {
    hex.decode(token);
    fail("reading a token as hexadecimal was allowed");
  } catch (raised) {
    expect((raised as Error).message.includes("SECRET"), isFalse, "the refusal quoted what it was given");
    expect((raised as Error).message.includes(`${token.length} characters read`), isTrue);
  }
});
