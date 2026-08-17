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

export {
  majorOf,
  PROTOCOL_VERSION,
  SDK_VERSION,
  speaksSameContract,
  WORKER_LANGUAGE
} from "./src/protocol/version.ts";

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

export { Caller, EventScope, Need } from "./src/contracts/access.ts";
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
export type {
  DiscoveredLogSink,
  DiscoveredModule,
  DiscoveredRoute
} from "./src/routing/discovery.ts";
export {
  Delete,
  Endpoint,
  Get,
  Patch,
  Post,
  Put
} from "./src/routing/endpoint.ts";
export { Middleware, NodeRoot } from "./src/routing/middleware.ts";
export { RoutingError } from "./src/routing/tree.ts";

export { describeWorker } from "./src/manifest/encode.ts";
export {
  defineCron,
  defineHook,
  defineQueue,
  defineRealtime,
  defineSearcher,
  defineStorage
} from "./src/manifest/events.ts";
export type {
  HookOutcome,
  QueueMessage,
  WorkerCron,
  WorkerHook,
  WorkerQueue,
  WorkerRealtime,
  WorkerSearcher,
  WorkerStorage
} from "./src/manifest/events.ts";
export type { RouteHandler, WorkerRoute } from "./src/manifest/route.ts";
export { ManifestError, WorkerDefinition } from "./src/manifest/worker.ts";
export type {
  MountedRoute,
  NodeManifest,
  WorkerInput
} from "./src/manifest/worker.ts";

export { InvocationContext } from "./src/runtime/context.ts";
export type {
  RequestDevice,
  RequestIpLocation,
  RequestUser
} from "./src/runtime/context.ts";
export { env } from "./src/runtime/env.ts";
export { CallScope } from "./src/runtime/scope.ts";
export {
  serveWorker,
  workerHandler,
  workerServer
} from "./src/runtime/serve.ts";
export type { ServeOptions } from "./src/runtime/serve.ts";

export { json, ServerResponse } from "./src/http/response.ts";

export { Arr, Nested, Required } from "./src/validation/schema.ts";
export type {
  BodyFromSchema,
  BodySchema,
  FormFromSchema,
  FormSchema
} from "./src/validation/schema.ts";

export { cache } from "./src/capabilities/cache.ts";
export { host } from "./src/capabilities/channel.ts";
export { dynamicLinks, remoteConfigs } from "./src/capabilities/devops.ts";
export { CapabilityError } from "./src/capabilities/error.ts";
export { hooks, queue } from "./src/capabilities/event_driven.ts";
export { geospatial } from "./src/capabilities/geospatial.ts";
export { messagings } from "./src/capabilities/messagings.ts";
export type {
  MailInput,
  PushInput,
  SmsInput
} from "./src/capabilities/messagings.ts";
export { realtime } from "./src/capabilities/realtime.ts";
export { recommendation } from "./src/capabilities/recommendation.ts";
export type { FilterBuilder } from "./src/capabilities/rest/filter.ts";
export { rest, RestQuery } from "./src/capabilities/rest/query.ts";
export type { Page } from "./src/capabilities/rest/query.ts";
export { searcher } from "./src/capabilities/searcher.ts";
export type {
  SearchOptions,
  SearchOutcome
} from "./src/capabilities/searcher.ts";
export { auth, rbac, vpn } from "./src/capabilities/security.ts";
export type {
  Account,
  SessionSummary,
  VpnPeer
} from "./src/capabilities/security.ts";
export { storage } from "./src/capabilities/storage.ts";
export type {
  ObjectLocation,
  StoredObject
} from "./src/capabilities/storage.ts";

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
export { trace } from "./src/observability/tracer.ts";

export { UnaryClient } from "./src/transport/client.ts";
export type { CallCredentials, Fetcher } from "./src/transport/client.ts";
export { TransportFailure } from "./src/transport/failure.ts";
export { UnaryServer } from "./src/transport/server.ts";

