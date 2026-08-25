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
  procedurePath,
  PROTO_CONTENT_TYPE,
  PROTOCOL_HEADER,
  TRACE_HEADER,
} from "./wire.ts";

export interface CallCredentials {
  readonly capabilityToken: string;
  readonly traceId: string;
}

export type Fetcher = (request: Request) => Promise<Response>;

const httpFetcher: Fetcher = (request) => fetch(request);

export class UnaryClient {
  constructor(
    readonly endpoint: string,
    readonly credentials: () => CallCredentials,
    readonly fetcher: Fetcher = httpFetcher,
  ) {}

  async call<I extends DescMessage, O extends DescMessage>(
    method: DescMethodUnary<I, O>,
    input: MessageInitShape<I>,
  ): Promise<MessageShape<O>> {
    const { capabilityToken, traceId } = this.credentials();
    const url = new URL(procedurePath(method as AnyUnaryMethod), this.endpoint);
    const payload = toBinary(
      method.input,
      create(method.input, input as never),
    );

    const response = await this.#send(url, payload, capabilityToken, traceId);
    const body = new Uint8Array(await response.arrayBuffer());

    if (!response.ok) throw failureFrom(response.status, body);

    return fromBinary(method.output, body) as MessageShape<O>;
  }

  async #send(
    url: URL,
    payload: Uint8Array,
    capabilityToken: string,
    traceId: string,
  ): Promise<Response> {
    try {
      return await this.fetcher(
        new Request(url, {
          method: "POST",
          body: payload as BodyInit,
          headers: {
            "content-type": PROTO_CONTENT_TYPE,
            [PROTOCOL_HEADER]: PROTOCOL_VERSION,
            [CAPABILITY_HEADER]: capabilityToken,
            [TRACE_HEADER]: traceId,
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
