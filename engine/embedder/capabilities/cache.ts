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
import { DeleteResultSchema, GetResultSchema, SetResultSchema, type DeleteRequest, type DeleteResult, type GetRequest, type GetResult, type SetRequest, type SetResult } from "@scribe/sdk/gen/scribe/engine/packages/foundation/protocol/valkery/valkery_pb.ts";
import { kv } from "@scribe/foundation/lib/src/redis/mod.ts";
import { decodeJson, encodeJson } from "../control/json.ts";

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
