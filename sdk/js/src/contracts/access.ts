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
