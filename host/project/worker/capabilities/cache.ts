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
import {
  type DeleteRequest,
  type DeleteResult,
  DeleteResultSchema,
  type GetRequest,
  type GetResult,
  GetResultSchema,
  type SetRequest,
  type SetResult,
  SetResultSchema,
} from "@scribe/sdk/gen/scribe/host/packages/foundation/protocol/valkery/valkery_pb.ts";
import { kv } from "@scribe/core/runtime/redis/mod.ts";
import { decodeJson, encodeJson } from "../json.ts";

const PREFIX = "worker";

const SCAN_PAGE = 200;

function keyOf(namespace: string, key: string): string {
  return `${PREFIX}:${namespace}:${key}`;
}

function failed(scope: string, cause: unknown): { code: string; message: string } {
  const message = cause instanceof Error ? cause.message : String(cause);
  console.error(`[worker-cache:${scope}] ${message}`);
  return { code: "cache_failed", message };
}

export async function cacheGet(request: GetRequest): Promise<GetResult> {
  const key = request.key;
  if (!key) return create(GetResultSchema, { error: failed("get", "missing key") });

  try {
    const raw = await kv().get(keyOf(key.namespace, key.key));
    return create(GetResultSchema, {
      hit: raw !== null,
      value: raw !== null ? encodeJson(JSON.parse(raw)) : undefined,
    });
  } catch (cause) {
    return create(GetResultSchema, { error: failed("get", cause) });
  }
}

export async function cacheSet(request: SetRequest): Promise<SetResult> {
  const key = request.key;
  if (!key) return create(SetResultSchema, { error: failed("set", "missing key") });

  const seconds = Math.max(1, Math.round(Number(request.ttl?.millis ?? 0n) / 1000));
  const payload = JSON.stringify(decodeJson(request.value));

  try {
    if (request.ttl) {
      await kv().setex(keyOf(key.namespace, key.key), seconds, payload);
    } else {
      await kv().set(keyOf(key.namespace, key.key), payload);
    }
    return create(SetResultSchema, {});
  } catch (cause) {
    return create(SetResultSchema, { error: failed("set", cause) });
  }
}

export async function cacheDelete(request: DeleteRequest): Promise<DeleteResult> {
  const key = request.key;
  if (!key) return create(DeleteResultSchema, { error: failed("delete", "missing key") });

  try {
    const target = keyOf(key.namespace, key.key);
    const deleted = request.prefix ? await deleteByPrefix(target) : await kv().del(target);
    return create(DeleteResultSchema, { deleted });
  } catch (cause) {
    return create(DeleteResultSchema, { error: failed("delete", cause) });
  }
}

async function deleteByPrefix(prefix: string): Promise<number> {
  let cursor = "0";
  let deleted = 0;

  do {
    const [next, keys] = await kv().scan(cursor, "MATCH", `${prefix}*`, "COUNT", SCAN_PAGE);
    cursor = next;
    if (keys.length > 0) deleted += await kv().del(...keys);
  } while (cursor !== "0");

  return deleted;
}
