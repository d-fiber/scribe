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
 * What both sides of the wire import to speak it: encoding, the unary call itself, and the
 * version they negotiate at the handshake.
 *
 * @remarks
 * Neither `engine/embedder/` nor a package's own `capability.ts`/`wire.ts` reach into `sdk/js` for
 * this any more, nor does `sdk/js` carry its own copy: both read this module, the one place a
 * host and a worker are guaranteed to agree on what a `Failure`, a `Json` value or a procedure
 * call look like on the wire. `sdk/js/transport.ts` re-exports this in turn, so a worker author
 * who happens to import from there sees the same names, unaware that a worker's own copy moved
 * here.
 */
export { majorOf, PROTOCOL_VERSION, speaksSameContract } from "./version.ts";

export { UnaryClient } from "./transport/client.ts";
export type { CallCredentials, Fetcher } from "./transport/client.ts";
export { TransportFailure } from "./transport/failure.ts";
export { failureResponse, metadataOf, UnaryServer } from "./transport/server.ts";
export type { CallMetadata } from "./transport/server.ts";

export { decodeJson, encodeJson } from "./transport/json.ts";
