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
  create,
  type DescMessage,
  type DescMethodUnary,
  fromBinary,
  type MessageInitShape,
  type MessageShape,
  toBinary,
} from "@bufbuild/protobuf";
import { FailureSchema } from "../../gen/scribe/protocol/common_pb.ts";
import { PROTOCOL_VERSION } from "../protocol/version.ts";
import { describeCause, TransportFailure } from "./failure.ts";
import {
  type AnyUnaryMethod,
  CAPABILITY_HEADER,
  HOST_HEADER,
  procedurePath,
  PROTO_CONTENT_TYPE,
  PROTOCOL_HEADER,
  TRACE_HEADER,
} from "./wire.ts";

/** What a caller puts on every procedure call, so the other side knows on whose behalf it asks. */
export interface CallCredentials {
  /** The grant this call is made under, empty when the caller holds none. */
  readonly capabilityToken: string;

  /** The identifier that ties this call to the exchange it belongs to, empty when it belongs to none. */
  readonly traceId: string;

  /**
   * The address at which {@link CallCredentials.capabilityToken} can be redeemed, empty when the
   * caller names none.
   *
   * @remarks
   * A grant lives in the memory of the replica that issued it, so a token is worth nothing at the
   * next replica along. The address of the issuer therefore travels beside the token rather than
   * being learned once at the handshake: the worker calls back the replica it is answering, not
   * the last one that introduced itself.
   */
  readonly hostEndpoint: string;
}

export type Fetcher = (request: Request) => Promise<Response>;

const httpFetcher: Fetcher = (request) => fetch(request);

/**
 * The calling side of a unary RPC: encodes the request, sends it, and decodes the reply.
 *
 * @remarks
 * `credentials` is a thunk rather than a fixed value because it is read inside {@link call}, at the
 * moment a call actually goes out, not when this client was built. A worker's ambient scope can
 * hold a different token from one call to the next, so resolving it fresh per call is what keeps a
 * client usable across calls instead of freezing whichever token happened to be current when it
 * was constructed.
 */
export class UnaryClient {
  constructor(
    /** The host this client sends every call to. */
    readonly endpoint: string,
    /** Read fresh at the start of each {@link call}, so this client always sends the live scope's token. */
    readonly credentials: () => CallCredentials,
    /** What actually sends the HTTP request, `fetch` unless a test substitutes its own. */
    readonly fetcher: Fetcher = httpFetcher,
  ) {}

  /** Calls `method` on the host with `input`, and answers its decoded reply. */
  async call<I extends DescMessage, O extends DescMessage>(
    method: DescMethodUnary<I, O>,
    input: MessageInitShape<I>,
  ): Promise<MessageShape<O>> {
    const credentials = this.credentials();
    const url = new URL(procedurePath(method as AnyUnaryMethod), this.endpoint);
    const payload = toBinary(
      method.input,
      create(method.input, input as never),
    );

    const response = await this.#send(url, payload, credentials);
    const body = new Uint8Array(await response.arrayBuffer());

    if (!response.ok) throw failureFrom(response.status, body);

    return fromBinary(method.output, body) as MessageShape<O>;
  }

  async #send(
    url: URL,
    payload: Uint8Array,
    credentials: CallCredentials,
  ): Promise<Response> {
    try {
      return await this.fetcher(
        new Request(url, {
          method: "POST",
          body: payload as BodyInit,
          headers: {
            "content-type": PROTO_CONTENT_TYPE,
            [PROTOCOL_HEADER]: PROTOCOL_VERSION,
            [CAPABILITY_HEADER]: credentials.capabilityToken,
            [HOST_HEADER]: credentials.hostEndpoint,
            [TRACE_HEADER]: credentials.traceId,
          },
        }),
      );
    } catch (cause) {
      throw TransportFailure.unavailable(
        `${url.host} is unreachable: ${describeCause(cause)}`,
      );
    }
  }
}

/**
 * The `TransportFailure` an error response at `status` carries, decoding `body` as a protocol
 * `Failure` when there is one to decode.
 *
 * @remarks
 * A body can be empty or fail to decode as a `Failure` message when the response never reached the
 * host's own handler, a proxy or a load balancer answering on its behalf. Falling back to a generic
 * failure built from the HTTP status is what keeps that case from throwing on the decode instead of
 * reporting what actually happened.
 */
function failureFrom(status: number, body: Uint8Array): TransportFailure {
  if (body.length === 0) {
    return new TransportFailure(
      "transport_error",
      `Host answered ${status}.`,
      status,
    );
  }

  try {
    const failure = fromBinary(FailureSchema, body);
    return new TransportFailure(failure.code, failure.message, status);
  } catch {
    return new TransportFailure(
      "transport_error",
      `Host answered ${status}.`,
      status,
    );
  }
}
