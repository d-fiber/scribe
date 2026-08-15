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

import { create } from "@bufbuild/protobuf";
import { TimeSchema, SizeSchema } from "../../gen/scribe/protocol/common_pb.ts";
import {
  type Manifest,
  ManifestSchema,
  type RateLimiter as ProtoRateLimiter,
  RateLimiterSchema,
  type Route as ProtoRoute,
  RouteSchema,
} from "../../gen/scribe/protocol/manifest_pb.ts";
import {
  callersOf,
  encodeCaller,
  encodeEventScope,
  encodeMethod,
  encodeNeed,
} from "../contracts/access.ts";
import { encodeJson } from "../contracts/json.ts";
import type { RateLimiter } from "../contracts/rate_limit.ts";
import type { Time } from "../contracts/time.ts";
import { PROTOCOL_VERSION, SDK_VERSION, WORKER_LANGUAGE } from "../protocol/version.ts";
import type { MountedRoute, WorkerDefinition } from "./worker.ts";

export function describeWorker(worker: WorkerDefinition): Manifest {
  return create(ManifestSchema, {
    protocolVersion: PROTOCOL_VERSION,
    workerLanguage: WORKER_LANGUAGE,
    sdkVersion: SDK_VERSION,
    nodes: worker.nodes.map((node) => ({ name: node.name, public: node.public })),
    routes: worker.routes.map(encodeRoute),
    hooks: [...worker.hooks].map(([hookId, hook]) => ({
      hookId,
      event: hook.event,
      priority: hook.priority ?? 0,
    })),
    queues: [...worker.queues].map(([queueId, queue]) => ({
      queueId,
      name: queue.name,
      batchSize: queue.batchSize,
      visibilityTimeout: encodeTime(queue.visibilityTimeout),
      maxAttempts: queue.maxAttempts,
    })),
    crons: [...worker.crons].map(([cronId, cron]) => ({
      cronId,
      name: cron.name,
      schedule: cron.schedule,
    })),
    searchers: worker.searchers.map((searcher) => ({
      entity: searcher.entity,
      index: searcher.index,
      mappings: encodeJson(searcher.mappings ?? {}),
      settings: encodeJson(searcher.settings ?? {}),
    })),
    realtimes: worker.realtimes.map((realtime) => ({
      entity: realtime.entity,
      events: [...realtime.events],
      scope: encodeEventScope(realtime.scope),
    })),
    storages: worker.storages.map((storage) => ({
      folder: storage.folder,
      pathTemplate: storage.pathTemplate,
      maxSize: create(SizeSchema, { bytes: BigInt(storage.maxSize.bytes) }),
      mimeTypes: [...storage.mimeTypes],
    })),
  });
}

function encodeRoute(entry: MountedRoute): ProtoRoute {
  const { route } = entry;
  return create(RouteSchema, {
    routeId: entry.routeId,
    method: encodeMethod(route.method),
    path: route.path,
    node: entry.node,
    access: callersOf(route.access).map(encodeCaller),
    rateLimit: encodeRateLimit(route.rateLimit),
    needs: (route.needs ?? []).map(encodeNeed),
    webhookVerified: route.webhookVerified ?? false,
    rateLimitKey: route.rateLimitKey,
    requiredPermissions: [...(route.requiredPermissions ?? [])],
  });
}

function encodeRateLimit(limiter: RateLimiter): ProtoRateLimiter {
  return create(RateLimiterSchema, {
    limit: limiter.limit,
    window: encodeTime(limiter.window),
    penalty: encodeTime(limiter.penalty),
    maxPenalty: limiter.maxPenalty ? encodeTime(limiter.maxPenalty) : undefined,
  });
}

function encodeTime(time: Time) {
  return create(TimeSchema, { millis: BigInt(time.ms) });
}
