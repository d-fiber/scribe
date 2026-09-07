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
import { equals, expect, Scribe } from "@scribe/alchemy/test";
import type { ErrorResponder, FixedErrorResponder, SuccessResponder } from "@scribe/alchemy/route";
import { jsonReply, ServerResponse } from "@scribe/alchemy/route";

const SUCCESSES: ReadonlyArray<{ name: string; responder: SuccessResponder; status: number }> = [
  { name: "ok", responder: ServerResponse.ok, status: 200 },
  { name: "created", responder: ServerResponse.created, status: 201 },
  { name: "accepted", responder: ServerResponse.accepted, status: 202 },
];

const ERRORS: ReadonlyArray<
  { name: string; responder: ErrorResponder; status: number; code: string }
> = [
  { name: "badRequest", responder: ServerResponse.badRequest, status: 400, code: "bad_request" },
  { name: "forbidden", responder: ServerResponse.forbidden, status: 403, code: "forbidden" },
  { name: "conflict", responder: ServerResponse.conflict, status: 409, code: "conflict" },
  { name: "notFound", responder: ServerResponse.notFound, status: 404, code: "not_found" },
  { name: "unauthorized", responder: ServerResponse.unauthorized, status: 401, code: "unauthorized" },
  { name: "unprocessable", responder: ServerResponse.unprocessable, status: 422, code: "unprocessable" },
  { name: "tooManyRequests", responder: ServerResponse.tooManyRequests, status: 429, code: "too_many_requests" },
  { name: "unexpected", responder: ServerResponse.unexpected, status: 500, code: "unexpected_error" },
];

const FIXED: ReadonlyArray<{ name: string; responder: FixedErrorResponder; status: number; code: string }> = [
  { name: "methodNotAllowed", responder: ServerResponse.methodNotAllowed, status: 405, code: "method_not_allowed" },
  { name: "payloadTooLarge", responder: ServerResponse.payloadTooLarge, status: 413, code: "payload_too_large" },
  {
    name: "serviceUnavailable",
    responder: ServerResponse.serviceUnavailable,
    status: 503,
    code: "service_unavailable",
  },
];

for (const { name, responder, status } of SUCCESSES) {
  Scribe.test(`ServerResponse.${name}() answers ${status} with the default code and no message or data`, async () => {
    const response = responder();

    expect(response.status, equals(status), "the status did not match the responder");
    const body = await response.json();
    expect(body.code, equals("success"), "the default code was not used");
    expect("message" in body, equals(false), "a message appeared though none was given");
    expect("data" in body, equals(false), "data appeared though none was given");
  });

  Scribe.test(`ServerResponse.${name}() carries the message and data it is given`, async () => {
    const response = responder({ code: "created_brand", message: "The brand was created.", data: { id: "b1" } });

    const body = await response.json();
    expect(body.code, equals("created_brand"), "a custom code was not used");
    expect(body.message, equals("The brand was created."), "a given message was dropped");
    expect(body.data, equals({ id: "b1" }), "given data was dropped");
  });
}

for (const { name, responder, status, code } of ERRORS) {
  Scribe.test(`ServerResponse.${name}() answers ${status} with its own default code and message`, async () => {
    const response = responder();

    expect(response.status, equals(status), "the status did not match the responder");
    const body = await response.json();
    expect(body.code, equals(code), "the default code did not match");
    expect(typeof body.message, equals("string"), "no default message was given");
    expect((body.message as string).length > 0, equals(true), "the default message was empty");
  });

  Scribe.test(`ServerResponse.${name}() lets the endpoint override the code and message`, async () => {
    const response = responder({ code: "custom_code", message: "A custom refusal." });

    expect(response.status, equals(status), "overriding the code or message changed the status");
    const body = await response.json();
    expect(body.code, equals("custom_code"), "a custom code was not used");
    expect(body.message, equals("A custom refusal."), "a custom message was not used");
  });
}

for (const { name, responder, status, code } of FIXED) {
  Scribe.test(`ServerResponse.${name}() always answers ${status} with the same code and message`, async () => {
    const first = await responder().json();
    const second = await responder().json();

    expect(responder().status, equals(status), "the status did not match the responder");
    expect(first.code, equals(code), "the fixed code did not match");
    expect(first, equals(second), "two calls to the same fixed responder answered differently");
  });
}

Scribe.test("jsonReply defaults to status 200 and a JSON content type", () => {
  const response = jsonReply({ ok: true });

  expect(response.status, equals(200), "jsonReply did not default to 200");
  expect(response.headers.get("Content-Type"), equals("application/json"), "the content type was not set");
});

Scribe.test("jsonReply carries the status it is given", async () => {
  const response = jsonReply({ ok: false }, 418);

  expect(response.status, equals(418), "a given status was not used");
  const body = await response.json();
  expect(body, equals({ ok: false }), "the data was not serialised as given");
});

Scribe.test("a success responder omits message and data independently", async () => {
  const withMessageOnly = await ServerResponse.ok({ message: "Done." }).json();
  expect(withMessageOnly.message, equals("Done."), "a message alone was dropped");
  expect("data" in withMessageOnly, equals(false), "data appeared though none was given");

  const withDataOnly = await ServerResponse.ok({ data: { count: 1 } }).json();
  expect("message" in withDataOnly, equals(false), "a message appeared though none was given");
  expect(withDataOnly.data, equals({ count: 1 }), "data alone was dropped");
});

Scribe.test("an error responder falls back to its own defaults field by field", async () => {
  const codeOnly = await ServerResponse.notFound({ code: "brand_missing" }).json();
  expect(codeOnly.code, equals("brand_missing"), "a given code was not used");
  expect(
    codeOnly.message,
    equals("The resource you are looking for could not be found."),
    "the default message was not kept when only the code was overridden",
  );

  const messageOnly = await ServerResponse.notFound({ message: "No brand with that identifier." }).json();
  expect(messageOnly.code, equals("not_found"), "the default code was not kept when only the message was overridden");
  expect(messageOnly.message, equals("No brand with that identifier."), "a given message was not used");
});

Scribe.test("jsonReply serialises a null payload as the JSON literal null, not an empty body", async () => {
  const response = jsonReply(null);
  const text = await response.text();
  expect(text, equals("null"), "a null payload was not serialised as JSON");
});
