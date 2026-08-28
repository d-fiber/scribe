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

import type { UnmodifiableList } from "../../value/list.ts";

/**
 * How a call was proved, which is what an endpoint declares it will answer.
 *
 * @remarks
 * The four are told apart by **how** the caller was established, never by who is behind it. That is
 * the line that makes this a closed list somebody else can be held to: a deployment invents roles,
 * tenants and back offices for reasons this layer will never hear about, and it does not invent new
 * ways of proving a call.
 *
 * A session of the application and a session of the back office were once two values here. They are
 * one: both are somebody holding a session, and which kind is a fact about the product. It is said
 * with {@link RequestUser.permissions}, which is open and gathers down a node, or with
 * {@link RequestUser.role}. Closing it here forced every deployment to have exactly one back office.
 *
 * It is a union of literals rather than an enum because an enum of strings is the one nominal type
 * TypeScript has: `"service"` read off a wire is not a `Caller` to the compiler, so every host that
 * speaks the protocol has to assert past it, and the assertion is exactly what a closed list was
 * meant to remove. {@link isCaller} does that walk once, checked.
 */
export type Caller = "anonymous" | "authenticated" | "service" | "webhook";

/**
 * Every way a call is proved, in one place.
 *
 * @remarks
 * A host builds its mapping as a record keyed by this and lets the compiler refuse an incomplete
 * one, which is what turns a fifth kind into an error where the mapping is written rather than a
 * call nobody classified.
 */
export const CALLERS: UnmodifiableList<Caller> = [
  "anonymous",
  "authenticated",
  "service",
  "webhook",
];

/** Whether `value` is one of the four ways a call is proved. */
export function isCaller(value: string): value is Caller {
  return (CALLERS as UnmodifiableList<string>).includes(value);
}

/**
 * What `declared` names, always as a list, whether it named one caller or several.
 *
 * @remarks
 * An endpoint declares whichever of the two reads better where it is written, and everything that
 * reasons about access wants the list. Doing that walk at each site is how two of them end up
 * disagreeing about what a bare {@link Caller} means.
 */
export function callersOf(declared: Caller | UnmodifiableList<Caller>): UnmodifiableList<Caller> {
  return Array.isArray(declared) ? declared : [declared as Caller];
}

/**
 * Something a call has to carry beyond how it was proved.
 *
 * @remarks
 * It is an open key rather than a closed list, because what a deployment may require of a call is
 * not something this layer can enumerate: an application key, a minimum client build, a country.
 * Closing it at the two this repository happens to check itself would make every one of those a
 * major version of a package nobody else can release.
 *
 * What checks a need is the host. Declaring one an endpoint's host does not know is a call that is
 * always refused, which is the safe way round.
 */
export type Need = string;

/** The device a call came from, which the host refuses the call without. */
export const NEEDS_DEVICE: Need = "device";

/** Where a call came from, which the host refuses the call without. */
export const NEEDS_LOCATION: Need = "location";

/** The five verbs a route may answer, written the way they are read. */
export type RouteMethod = "get" | "post" | "put" | "patch" | "delete";

/** Every verb, in one place, so a reader of routes can be made to cover all five. */
export const ROUTE_METHODS: UnmodifiableList<RouteMethod> = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
];

/** Whether `value` is one of the five verbs. */
export function isRouteMethod(value: string): value is RouteMethod {
  return (ROUTE_METHODS as UnmodifiableList<string>).includes(value);
}
