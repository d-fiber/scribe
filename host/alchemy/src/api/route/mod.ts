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
 * What an endpoint is, and everything it declares about itself.
 *
 * @remarks
 * This is what somebody writing a project touches most: a class per endpoint, a verb for its base,
 * and overrides for what it requires. Nothing here answers a request. It says what an endpoint is
 * and what it wants, and the framework is what puts a call through it.
 *
 * Nothing here speaks the protocol either. {@link InvocationContext} is written over plain data, so
 * the wire may gain a field or be replaced without an endpoint being touched.
 *
 * What `mount/` holds is the other half, and a project never writes it: what an endpoint becomes
 * once it is found, wrapped and hung on a node.
 */

export { CALLERS, callersOf, isCaller, isRouteMethod, NEEDS_DEVICE, NEEDS_LOCATION, ROUTE_METHODS } from "./access.ts";
export type { Caller, Need, RouteMethod } from "./access.ts";

export type { RateLimit } from "./rate_limit.ts";

export type { Localization, RequestDevice } from "./device.ts";

export { InvocationContext } from "./context.ts";
export type { Invoked, IpLocation, RequestUser } from "./context.ts";

export { Delete, Endpoint, Get, Patch, Post, Put } from "./endpoint.ts";
export type { EndpointDocumentation } from "./endpoint.ts";

export { jsonReply, ServerResponse } from "./response.ts";
export type { ErrorResponder, FixedErrorResponder, SuccessResponder } from "./response.ts";

export { mountedRoute, routeIdOf, routingKeyOf } from "./mount/route.ts";
export type { MountedRoute, RouteHandler, WorkerRoute } from "./mount/route.ts";

export { merge, NOTHING, wrapAll } from "./mount/contribution.ts";
export type { Contribution } from "./mount/contribution.ts";

export { Middleware } from "./mount/middleware.ts";
export type { NodeRoot } from "./mount/middleware.ts";

export type { DiscoveredLogSink, DiscoveredModule, DiscoveredRoute } from "./mount/discovery.ts";

export { BASE, instances } from "./mount/instances.ts";

export { compileNode, RoutingError } from "./mount/tree.ts";
