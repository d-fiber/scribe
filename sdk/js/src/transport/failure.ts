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

import { create } from "@bufbuild/protobuf";
import { type Failure, FailureSchema } from "../../gen/scribe/protocol/common_pb.ts";

/** A worker call's failure, with the stable code and HTTP-shaped status the wire protocol carries. */
export class TransportFailure extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "TransportFailure";
  }

  /** A failure for a malformed call: `bad_request`, status 400. */
  static badRequest(message: string): TransportFailure {
    return new TransportFailure("bad_request", message, 400);
  }

  /** A failure for a caller that failed to authenticate: `unauthorized`, status 401. */
  static unauthorized(message: string): TransportFailure {
    return new TransportFailure("unauthorized", message, 401);
  }

  /** A failure for a call that names nothing this side knows: `not_found`, status 404. */
  static notFound(message: string): TransportFailure {
    return new TransportFailure("not_found", message, 404);
  }

  /** A failure for a dependency this call needed but could not reach: `unavailable`, status 503. */
  static unavailable(message: string): TransportFailure {
    return new TransportFailure("unavailable", message, 503);
  }

  /** A failure for anything else that went wrong: `internal`, status 500. */
  static internal(message: string): TransportFailure {
    return new TransportFailure("internal", message, 500);
  }

  /** This failure's code and message, ready to travel on the wire as a `Failure` message. */
  toProto(): Failure {
    return create(FailureSchema, { code: this.code, message: this.message });
  }
}

/** `cause`'s message, for a `cause` that is not already a `TransportFailure` carrying one of its own. */
export function describeCause(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  if (typeof cause === "string") return cause;
  return String(cause);
}

/**
 * `cause` as a `TransportFailure`, wrapping it as an internal error when it is not one already.
 *
 * @remarks
 * A procedure handler is free to throw a plain `Error`, or anything else, rather than a
 * `TransportFailure`. `UnaryServer.handle` calls this on whatever it catches so the wire always
 * gets a proper `Failure` message with a stable code and status, instead of an unstructured error
 * that carries neither and would otherwise crash the response entirely.
 */
export function failureOf(cause: unknown): TransportFailure {
  return cause instanceof TransportFailure ? cause : TransportFailure.internal(describeCause(cause));
}
