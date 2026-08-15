// Copyright (C) 2026 Fiber
//
// This file is part of scribe and is made available under the PolyForm Shield
// License 1.0.0. The full terms are in the LICENSE file at the root of this
// repository, and at https://polyformproject.org/licenses/shield/1.0.0
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
//
// The one thing you may not do:
// - Use it to provide any product that competes with scribe, or with any
//   product Fiber or its affiliates provide using scribe. Products compete
//   even when they are offered free of charge, through a different kind of
//   interface, or for a different technical platform.
//
// If you pass this software on:
// - Anyone who receives any part of it from you must also receive these terms,
//   or the URL above, together with the "Required Notice" line carried by the
//   LICENSE file.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE COMES AS IS, WITHOUT ANY WARRANTY OR
// CONDITION, AND THE LICENSOR WILL NOT BE LIABLE TO YOU FOR ANY DAMAGES ARISING
// OUT OF THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY KIND OF
// LEGAL CLAIM.
//
// This header is a summary written for convenience. Where it differs from the
// LICENSE file, the LICENSE file governs.

import {
  type DescMessage,
  type DescMethodUnary,
  type MessageInitShape,
  type MessageShape,
  create,
  fromBinary,
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
