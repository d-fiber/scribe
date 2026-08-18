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
import { failureOf, TransportFailure } from "./failure.ts";
import {
  type AnyUnaryMethod,
  CAPABILITY_HEADER,
  FAILURE_HEADER,
  PROTO_CONTENT_TYPE,
  PROTOCOL_HEADER,
  procedurePath,
  TRACE_HEADER,
} from "./wire.ts";

export interface CallMetadata {
  readonly capabilityToken: string;
  readonly traceId: string;
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
