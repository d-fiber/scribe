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
 * What the host side of the wire imports, as opposed to what a worker imports from `mod.ts`.
 *
 * @remarks
 * Nothing here is reached by a worker's own code: `ScribeServer`/`serveWorker` build a
 * {@link UnaryServer} internally, and no example or fixture worker under this repository's
 * `packages/*\/tests/e2e/` ever names one of these exports itself. `engine/embedder/` and the
 * `capability.ts`/`wire.ts` files a package answers a worker's calls from both read this module
 * instead of `mod.ts`, so that the surface documented as "a worker's only import" stays exactly
 * that, and a host-only symbol never shows up in a worker author's autocomplete.
 */
export { majorOf, PROTOCOL_VERSION, SDK_VERSION, speaksSameContract, WORKER_LANGUAGE } from "./src/protocol/version.ts";

export { UnaryClient } from "./src/transport/client.ts";
export type { CallCredentials, Fetcher } from "./src/transport/client.ts";
export { TransportFailure } from "./src/transport/failure.ts";
export { failureResponse, metadataOf, UnaryServer } from "./src/transport/server.ts";
export type { CallMetadata } from "./src/transport/server.ts";

export { decodeJson, encodeJson } from "./src/contracts/json.ts";
