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

import { Method as ProtoMethod } from "@scribe/sdk/gen/scribe/protocol/common_pb.ts";

/** The method a Hono router mounts a handler under. */
export type HonoMethod = "get" | "post" | "put" | "patch" | "delete";

interface MethodMapping {
  readonly proto: ProtoMethod;
  readonly http: string;
  readonly hono: HonoMethod;
}

/**
 * Every method the protocol carries, in the three vocabularies this dossier translates between.
 *
 * @remarks
 * `invocation.ts` reads the `http` column to build what a worker receives, `mount.ts` reads the
 * `hono` column to wire a route on the router. The two used to be two separate literal tables, one
 * per direction, and adding a method meant remembering to touch both without either side checking
 * the other.
 */
const METHODS: readonly MethodMapping[] = [
  { proto: ProtoMethod.GET, http: "GET", hono: "get" },
  { proto: ProtoMethod.POST, http: "POST", hono: "post" },
  { proto: ProtoMethod.PUT, http: "PUT", hono: "put" },
  { proto: ProtoMethod.PATCH, http: "PATCH", hono: "patch" },
  { proto: ProtoMethod.DELETE, http: "DELETE", hono: "delete" },
];

/** The protocol method `httpMethod` names, or `ProtoMethod.UNSPECIFIED` when it names none of them. */
export function protoMethodOf(httpMethod: string): ProtoMethod {
  return METHODS.find((mapping) => mapping.http === httpMethod)?.proto ?? ProtoMethod.UNSPECIFIED;
}

/** The Hono method `proto` mounts under, defaulting to `"get"` for a method a manifest left unspecified. */
export function honoMethodOf(proto: ProtoMethod): HonoMethod {
  return METHODS.find((mapping) => mapping.proto === proto)?.hono ?? "get";
}
