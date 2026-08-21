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

export const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

interface SuccessParams {
  code?: string;
  message?: string;
  data?: object;
}

export type SuccessResponder = (params?: SuccessParams) => Response;
export type ErrorResponder = (params?: ErrorParams) => Response;
export type FixedErrorResponder = () => Response;

function successResponder(status: number): SuccessResponder {
  return ({ code, message, data }: SuccessParams = {}): Response =>
    json(
      {
        code: code ?? "success",
        ...(message != null && { message }),
        ...(data != null && { data }),
      },
      status,
    );
}

interface ErrorParams {
  code?: string;
  message?: string;
}

function errorResponder(
  defaultCode: string,
  defaultMessage: string,
  status: number,
): ErrorResponder {
  return ({ code, message }: ErrorParams = {}): Response =>
    json(
      { code: code ?? defaultCode, message: message ?? defaultMessage },
      status,
    );
}

function fixedResponder(
  code: string,
  message: string,
  status: number,
): FixedErrorResponder {
  return (): Response => json({ code, message }, status);
}

export class ServerResponse {
  static ok: SuccessResponder = successResponder(200);
  static created: SuccessResponder = successResponder(201);
  static accepted: SuccessResponder = successResponder(202);

  static badRequest: ErrorResponder = errorResponder(
    "bad_request",
    "The request could not be understood. Please check the data you sent and try again.",
    400,
  );
  static forbidden: ErrorResponder = errorResponder(
    "forbidden",
    "Your account does not have the necessary permissions to perform this action.",
    403,
  );
  static conflict: ErrorResponder = errorResponder(
    "conflict",
    "The request could not be completed due to a conflict with the current state.",
    409,
  );
  static notFound: ErrorResponder = errorResponder(
    "not_found",
    "The resource you are looking for could not be found.",
    404,
  );
  static unauthorized: ErrorResponder = errorResponder(
    "unauthorized",
    "This action requires a valid authenticated session. Please sign in and try again.",
    401,
  );
  static unprocessable: ErrorResponder = errorResponder(
    "unprocessable",
    "The request could not be processed.",
    422,
  );
  static tooManyRequests: ErrorResponder = errorResponder(
    "too_many_requests",
    "You have sent too many requests in a short period of time. Please wait a moment and try again.",
    429,
  );
  static unexpected: ErrorResponder = errorResponder(
    "unexpected_error",
    "Something went wrong on our end while processing your request. Please try again in a few moments.",
    500,
  );
  static methodNotAllowed: FixedErrorResponder = fixedResponder(
    "method_not_allowed",
    "The HTTP method used is not supported for this endpoint.",
    405,
  );
  static payloadTooLarge: FixedErrorResponder = fixedResponder(
    "payload_too_large",
    "The data included in your request exceeds the size limit we accept.",
    413,
  );
  static serviceUnavailable: FixedErrorResponder = fixedResponder(
    "service_unavailable",
    "The server is temporarily busy. Please retry in a few moments.",
    503,
  );
}
