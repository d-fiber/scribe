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

export { majorOf, PROTOCOL_VERSION, SDK_VERSION, speaksSameContract, WORKER_LANGUAGE } from "./src/protocol/version.ts";

export {
  AvatarType,
  CampaignAudience,
  ClientType,
  DeviceCategory,
  DeviceOs,
  DeviceThemeMode,
  enumValues,
  FeedbackType,
  Gender,
  Localization,
  RemoteConfigAudience,
  SocialProvider,
} from "./gen/schema/enums.ts";

export { Caller, Listen, Need } from "./src/contracts/access.ts";
export type { RouteMethod } from "./src/contracts/access.ts";
export { emptyPagination, pagination } from "./src/contracts/pagination.ts";
export type { Pagination } from "./src/contracts/pagination.ts";
export type { RateLimiter } from "./src/contracts/rate_limit.ts";
export { Size, Time } from "./src/contracts/time.ts";

export { Node } from "./src/server/node.ts";
export type { NodeInput } from "./src/server/node.ts";
export { ScribeServer } from "./src/server/scribe_server.ts";
export type { ServerOptions } from "./src/server/scribe_server.ts";

export type { Contribution } from "./src/routing/contribution.ts";
export type { DiscoveredLogSink, DiscoveredModule, DiscoveredRoute } from "./src/routing/discovery.ts";
export { Delete, Endpoint, Get, Patch, Post, Put } from "./src/routing/endpoint.ts";
export { Middleware, NodeRoot } from "./src/routing/middleware.ts";
export { RoutingError } from "./src/routing/tree.ts";

export { describeWorker } from "./src/manifest/encode.ts";
export {
  defineCron,
  defineHook,
  defineQueue,
  defineRealtime,
  defineSearcher,
  defineStorage,
} from "./src/manifest/events.ts";
export type {
  HookOutcome,
  QueueMessage,
  WorkerCron,
  WorkerHook,
  WorkerQueue,
  WorkerRealtime,
  WorkerSearcher,
  WorkerStorage,
} from "./src/manifest/events.ts";
export type { RouteHandler, WorkerRoute } from "./src/manifest/route.ts";
export { ManifestError, WorkerDefinition } from "./src/manifest/worker.ts";
export type { MountedRoute, NodeManifest, WorkerInput } from "./src/manifest/worker.ts";

export { InvocationContext } from "./src/runtime/context.ts";
export type { RequestDevice, RequestIpLocation, RequestUser } from "./src/runtime/context.ts";
export { env } from "./src/runtime/env.ts";
export { CallScope } from "./src/runtime/scope.ts";
export { serveWorker, workerHandler, workerServer } from "./src/runtime/serve.ts";
export type { ServeOptions } from "./src/runtime/serve.ts";

export { json, ServerResponse } from "./src/http/response.ts";

export { Arr, Nested, Required } from "./src/validation/schema.ts";
export type { BodyFromSchema, BodySchema, FormFromSchema, FormSchema } from "./src/validation/schema.ts";

export { cache } from "./src/capabilities/cache.ts";
export { host } from "./src/capabilities/channel.ts";
export { CapabilityError } from "./src/capabilities/error.ts";
export { hooks, queue } from "./src/capabilities/event_driven.ts";
export { realtime } from "./src/capabilities/realtime.ts";
export type { FilterBuilder } from "./src/capabilities/rest/filter.ts";
export { rest, RestQuery } from "./src/capabilities/rest/query.ts";
export type { Page } from "./src/capabilities/rest/query.ts";
export { search } from "./src/capabilities/search.ts";
export type { SearchPage } from "./src/capabilities/search.ts";
export { storage } from "./src/capabilities/storage.ts";
export type { ObjectLocation, StoredObject } from "./src/capabilities/storage.ts";

export {
  BOLD,
  DIM,
  formatEntry,
  printEntry,
  RESET,
  styleLevel,
  styleMethod,
  styleStatus,
} from "./src/observability/console.ts";
export { log } from "./src/observability/logger.ts";
export { loggedEntry, LogSink } from "./src/observability/log_sink.ts";
export type { LoggedEntry, LoggedLevel } from "./src/observability/log_sink.ts";
export { SinkRegistry } from "./src/observability/sink_registry.ts";

export { UnaryClient } from "./src/transport/client.ts";
export type { CallCredentials, Fetcher } from "./src/transport/client.ts";
export { TransportFailure } from "./src/transport/failure.ts";
export { UnaryServer } from "./src/transport/server.ts";
