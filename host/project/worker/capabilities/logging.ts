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

import { create } from "@bufbuild/protobuf";
import { type LogAck, LogAckSchema, type LogBatch } from "@scribe/sdk/gen/scribe/protocol/logs_pb.ts";

/**
 * Takes what the worker sent, and drops it.
 *
 * A node that declared a `_log.ts` never gets here: its `log()` calls are
 * short-circuited to the sink inside the worker rather than crossing back for
 * an answer the worker already has. What arrives here therefore belongs to a
 * project that declared no sink, and the host has nowhere to put it -- there
 * is no collector behind it any more, and printing it would be the framework
 * deciding what a project's logs are worth.
 *
 * The capability stays because the worker cannot know that from its side: it
 * calls, and it is answered.
 */
export function shipLogs(_batch: LogBatch): Promise<LogAck> {
  return Promise.resolve(create(LogAckSchema, {}));
}
