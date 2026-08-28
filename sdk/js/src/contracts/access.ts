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
  Caller as ProtoCaller,
  Method as ProtoMethod,
  Need as ProtoNeed,
} from "../../gen/scribe/protocol/common_pb.ts";
export enum Caller {
  Anonymous = "anonymous",
  User = "user",
  Admin = "admin",
  Service = "service",
  Webhook = "webhook",
}

export enum Need {
  Device = "device",
  Location = "location",
}

/** How open a realtime channel's own broadcast is, before any grant is written. */
export enum Listen {
  /** Nobody hears the broadcast without a grant written for them. */
  Granted = "granted",

  /** Any caller holding a session hears the broadcast. */
  Authenticated = "authenticated",

  /** Any caller hears the broadcast, session or not. */
  Public = "public",
}

export type RouteMethod = "get" | "post" | "put" | "patch" | "delete";

const callers: Record<Caller, ProtoCaller> = {
  [Caller.Anonymous]: ProtoCaller.ANONYMOUS,
  [Caller.User]: ProtoCaller.USER,
  [Caller.Admin]: ProtoCaller.ADMIN,
  [Caller.Service]: ProtoCaller.SERVICE,
  [Caller.Webhook]: ProtoCaller.WEBHOOK,
};

const methods: Record<RouteMethod, ProtoMethod> = {
  get: ProtoMethod.GET,
  post: ProtoMethod.POST,
  put: ProtoMethod.PUT,
  patch: ProtoMethod.PATCH,
  delete: ProtoMethod.DELETE,
};

const needs: Record<Need, ProtoNeed> = {
  [Need.Device]: ProtoNeed.DEVICE,
  [Need.Location]: ProtoNeed.LOCATION,
};

export function callersOf(declared: Caller | readonly Caller[]): readonly Caller[] {
  return Array.isArray(declared) ? declared : [declared as Caller];
}

export function encodeCaller(caller: Caller): ProtoCaller {
  return callers[caller];
}

export function encodeMethod(method: RouteMethod): ProtoMethod {
  return methods[method];
}

export function decodeMethod(method: ProtoMethod): RouteMethod {
  const found = (Object.keys(methods) as RouteMethod[]).find(
    (key) => methods[key] === method,
  );
  return found ?? "get";
}

export function encodeNeed(need: Need): ProtoNeed {
  return needs[need];
}
