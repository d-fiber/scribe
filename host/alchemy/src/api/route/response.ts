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

/**
 * A reply carrying `data` written as JSON.
 *
 * @remarks
 * It is the one place a body is serialised, so an endpoint that answers something other than the
 * shapes {@link ServerResponse} names still answers in the same form.
 *
 * It is not called `json`: the main entry of this package already exports a `json`, and that one is
 * a {@link Codec}. One name meaning two things in one package is a rename at every call site the
 * day somebody imports both.
 */
export const jsonReply = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** What an endpoint may say about a call that went through. */
interface SuccessParams {
  /** A word naming what happened, `success` when left out. */
  code?: string;

  /** A sentence for whoever reads the reply, left out of the body when not given. */
  message?: string;

  /** What the call answers with, left out of the body when there is nothing to answer. */
  data?: object;
}

/** Answers a call that went through, with what the endpoint has to say about it. */
export type SuccessResponder = (params?: SuccessParams) => Response;

/** Refuses a call, taking the word and the sentence the endpoint wants over the usual ones. */
export type ErrorResponder = (params?: ErrorParams) => Response;

/** Refuses a call the same way every time, because nothing about it varies. */
export type FixedErrorResponder = () => Response;

/** Builds the responder that answers `status` with whatever the endpoint says. */
function successResponder(status: number): SuccessResponder {
  return ({ code, message, data }: SuccessParams = {}): Response =>
    jsonReply(
      {
        code: code ?? "success",
        ...(message != null && { message }),
        ...(data != null && { data }),
      },
      status,
    );
}

/** What an endpoint may say about a call it refuses. */
interface ErrorParams {
  /** A word naming the refusal, the usual one for that status when left out. */
  code?: string;

  /** A sentence for whoever reads the refusal, the usual one when left out. */
  message?: string;
}

/** Builds the responder that refuses with `status`, `defaultCode` and `defaultMessage` unless told otherwise. */
function errorResponder(
  defaultCode: string,
  defaultMessage: string,
  status: number,
): ErrorResponder {
  return ({ code, message }: ErrorParams = {}): Response =>
    jsonReply(
      { code: code ?? defaultCode, message: message ?? defaultMessage },
      status,
    );
}

/**
 * Builds the responder that always refuses with `status`, `code` and `message`.
 *
 * It takes nothing because nothing about these refusals depends on the endpoint: they are answered
 * before a route is even reached, or they say something about the request that no endpoint knows
 * better than the framework does.
 */
function fixedResponder(
  code: string,
  message: string,
  status: number,
): FixedErrorResponder {
  return (): Response => jsonReply({ code, message }, status);
}

/**
 * Every reply an endpoint gives, named after what it means rather than after a number.
 *
 * @remarks
 * An endpoint reaches it as `this.response`, so a route never writes a status. That is the point:
 * the number, the word and the sentence that go with one another are decided once here, and every
 * endpoint of every project answers the same shape.
 *
 * The body is always `{ code, message?, data? }`. A caller can therefore read a refusal without
 * knowing which endpoint it came from, which is what makes a generated client possible.
 *
 * @example
 * ```ts
 * return this.response.ok({ data: { id } });
 * return this.response.notFound({ message: "No brand with that identifier." });
 * ```
 */
export class ServerResponse {
  /** The call went through. */
  static ok: SuccessResponder = successResponder(200);

  /** The call went through and something now exists that did not. */
  static created: SuccessResponder = successResponder(201);

  /** The call was taken, and what it asked for happens later. */
  static accepted: SuccessResponder = successResponder(202);

  /** The request could not be read as it was written. */
  static badRequest: ErrorResponder = errorResponder(
    "bad_request",
    "The request could not be understood. Please check the data you sent and try again.",
    400,
  );
  /** The caller is known, and is not allowed to do this. */
  static forbidden: ErrorResponder = errorResponder(
    "forbidden",
    "Your account does not have the necessary permissions to perform this action.",
    403,
  );
  /** What the call asks for cannot be done in the state things are in. */
  static conflict: ErrorResponder = errorResponder(
    "conflict",
    "The request could not be completed due to a conflict with the current state.",
    409,
  );
  /** There is nothing at the address the call named. */
  static notFound: ErrorResponder = errorResponder(
    "not_found",
    "The resource you are looking for could not be found.",
    404,
  );
  /** The caller has not said who they are, and this needs it. */
  static unauthorized: ErrorResponder = errorResponder(
    "unauthorized",
    "This action requires a valid authenticated session. Please sign in and try again.",
    401,
  );
  /** The request was read, and what it asks for cannot be carried out. */
  static unprocessable: ErrorResponder = errorResponder(
    "unprocessable",
    "The request could not be processed.",
    422,
  );
  /** The caller went over what the route allows, and is held out for a while. */
  static tooManyRequests: ErrorResponder = errorResponder(
    "too_many_requests",
    "You have sent too many requests in a short period of time. Please wait a moment and try again.",
    429,
  );
  /** Something failed on this side, and the caller did nothing wrong. */
  static unexpected: ErrorResponder = errorResponder(
    "unexpected_error",
    "Something went wrong on our end while processing your request. Please try again in a few moments.",
    500,
  );
  /** No route of this node answers that verb at that path. */
  static methodNotAllowed: FixedErrorResponder = fixedResponder(
    "method_not_allowed",
    "The HTTP method used is not supported for this endpoint.",
    405,
  );
  /** What the call carried is over the size that is accepted. */
  static payloadTooLarge: FixedErrorResponder = fixedResponder(
    "payload_too_large",
    "The data included in your request exceeds the size limit we accept.",
    413,
  );
  /** Nothing is wrong with the call, and this side cannot answer it right now. */
  static serviceUnavailable: FixedErrorResponder = fixedResponder(
    "service_unavailable",
    "The server is temporarily busy. Please retry in a few moments.",
    503,
  );
}
