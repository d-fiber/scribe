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
import { failureOf, TransportFailure } from "./failure.ts";
import {
  type AnyUnaryMethod,
  CAPABILITY_HEADER,
  FAILURE_HEADER,
  HOST_HEADER,
  procedurePath,
  PROTO_CONTENT_TYPE,
  PROTOCOL_HEADER,
  TRACE_HEADER,
} from "./wire.ts";

/** What a procedure is told about the call it is answering, beside the message itself. */
export interface CallMetadata {
  /** The grant the caller made this call under, empty when it held none. */
  readonly capabilityToken: string;

  /** The identifier that ties this call to the exchange it belongs to, empty when it belongs to none. */
  readonly traceId: string;

  /**
   * The address at which {@link CallMetadata.capabilityToken} can be redeemed, empty when the
   * caller named none.
   *
   * It is what a worker calls back on, and it is read from the call rather than from the handshake
   * because a grant is only redeemable at the replica that issued it.
   */
  readonly hostEndpoint: string;
}

type ErasedProcedure = {
  readonly input: DescMessage;
  readonly output: DescMessage;
  readonly run: (input: never, call: CallMetadata) => Promise<unknown>;
};

export class UnaryServer {
  readonly #procedures = new Map<string, ErasedProcedure>();
  #otherwise: ((path: string) => never) | null = null;

  /**
   * What answers a procedure this server did not wire.
   *
   * Without one, an unknown path is a 404, which is the right answer for a
   * side that was never meant to serve it. A side that serves *part* of the
   * contract wants to say so instead, and it cannot list what it left out
   * without naming every service the contract declares -- a list that goes
   * stale the day someone adds one.
   *
   * The handler is given the procedure path, which carries both the service
   * and the method, and is expected to throw.
   */
  otherwise(handler: (path: string) => never): this {
    this.#otherwise = handler;
    return this;
  }

  on<I extends DescMessage, O extends DescMessage>(
    method: DescMethodUnary<I, O>,
    handler: (
      input: MessageShape<I>,
      call: CallMetadata,
    ) => Promise<MessageInitShape<O>> | MessageInitShape<O>,
  ): this {
    this.#procedures.set(procedurePath(method as AnyUnaryMethod), {
      input: method.input,
      output: method.output,
      run: (input, call) => Promise.resolve(handler(input as MessageShape<I>, call)),
    });
    return this;
  }

  handles(path: string): boolean {
    return this.#procedures.has(path);
  }

  async handle(request: Request): Promise<Response> {
    try {
      return await this.#dispatch(request);
    } catch (cause) {
      return failureResponse(failureOf(cause));
    }
  }

  async #dispatch(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      throw new TransportFailure("method_not_allowed", "Procedures accept POST only.", 405);
    }

    const path = new URL(request.url).pathname;
    const procedure = this.#procedures.get(path);
    if (!procedure) {
      if (this.#otherwise !== null) this.#otherwise(path);
      throw TransportFailure.notFound(`Unknown procedure ${path}.`);
    }

    const payload = new Uint8Array(await request.arrayBuffer());
    const input = fromBinary(procedure.input, payload) as never;
    const output = await procedure.run(input, metadataOf(request));

    return protoResponse(
      toBinary(procedure.output, create(procedure.output, output as never)),
      200,
    );
  }
}

export function metadataOf(request: Request): CallMetadata {
  return {
    capabilityToken: request.headers.get(CAPABILITY_HEADER) ?? "",
    traceId: request.headers.get(TRACE_HEADER) ?? "",
    hostEndpoint: request.headers.get(HOST_HEADER) ?? "",
  };
}

export function protoResponse(body: Uint8Array, status: number): Response {
  return new Response(body as BodyInit, {
    status,
    headers: {
      "content-type": PROTO_CONTENT_TYPE,
      [PROTOCOL_HEADER]: PROTOCOL_VERSION,
    },
  });
}

export function failureResponse(failure: TransportFailure): Response {
  return new Response(toBinary(FailureSchema, failure.toProto()) as BodyInit, {
    status: failure.status,
    headers: {
      "content-type": PROTO_CONTENT_TYPE,
      [PROTOCOL_HEADER]: PROTOCOL_VERSION,
      [FAILURE_HEADER]: "1",
    },
  });
}
