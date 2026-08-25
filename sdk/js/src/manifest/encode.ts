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

import { create } from "@bufbuild/protobuf";
import { SizeSchema, TimeSchema } from "../../gen/scribe/protocol/common_pb.ts";
import {
  type Manifest,
  ManifestSchema,
  type RateLimiter as ProtoRateLimiter,
  RateLimiterSchema,
  type Route as ProtoRoute,
  RouteSchema,
} from "../../gen/scribe/protocol/manifest_pb.ts";
import { callersOf, encodeCaller, encodeMethod, encodeNeed } from "../contracts/access.ts";
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
    nodes: worker.nodes.map((node) => ({
      name: node.name,
      public: node.public,
      logSink: node.logSink,
    })),
    rootLogSink: worker.sinks.hasRoot,
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
      channel: realtime.channel,
      actions: [...realtime.actions],
      listen: realtime.listen,
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
