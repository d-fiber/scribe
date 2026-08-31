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

import type { Future } from "@scribe/alchemy";

/**
 * The service a request path resolved to, and where its worker is found on disk.
 *
 * @remarks
 * `service` and `servicePath` travel together because the two answer different questions later in
 * the pipeline: the authorizer and the request tag need the name, the dispatcher needs the path,
 * and neither can be derived from the other once a request has been resolved through a namespaced
 * or a flat match.
 */
export interface ResolvedService {
  /** The service name a request resolved to, used to authorize it and to tag it downstream. */
  readonly service: string;

  /** The on-disk path of the resolved service, passed to the dispatcher to load its worker. */
  readonly servicePath: string;
}

/**
 * Turns a request path into the service that answers it.
 *
 * @remarks
 * A seam of its own, separate from {@link DirectoryServiceResolver}'s concrete filesystem lookup,
 * so `EdgeFunctionsRuntime` never has to know whether a service lives on disk under a namespaced
 * prefix, a flat one, or somewhere else entirely: swapping the resolution strategy is a new
 * implementation of this interface, not a change to the runtime that calls it.
 */
export interface ServiceResolver {
  resolve(pathname: string): Future<ResolvedService | null>;
}
