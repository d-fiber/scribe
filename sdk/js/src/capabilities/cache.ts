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
import { TimeSchema } from "../../gen/scribe/protocol/common_pb.ts";
import { Cache, CacheKeySchema } from "../../gen/scribe/packages/foundation/protocol/cache_pb.ts";
import { decodeJson, encodeJson } from "../contracts/json.ts";
import type { Time } from "../contracts/time.ts";
import { host } from "./channel.ts";
import { raiseOn } from "./error.ts";

const CAPABILITY = "cache";

function keyOf(namespace: string, key: string) {
  return create(CacheKeySchema, { namespace, key });
}

/** The store the host keeps for the whole project, reached over the worker channel. */
export interface CacheCapability {
  /**
   * The value held under `key` in `namespace`, or null when the store holds none.
   *
   * The value is decoded from the JSON it was written as, and nothing checks it against `T`.
   *
   * @throws {CapabilityError} When the host refused the read.
   */
  get<T>(namespace: string, key: string): Promise<T | null>;

  /**
   * Writes `value` under `key` in `namespace`, encoded as JSON.
   *
   * Without `ttl` the entry is left to whatever lifetime the host gives an entry that names none.
   *
   * @throws {CapabilityError} When the host refused the write.
   */
  set(namespace: string, key: string, value: unknown, ttl?: Time): Promise<void>;

  /**
   * Drops what is held under `key` in `namespace`, and answers how many entries went.
   *
   * With `prefix` set, `key` is read as the beginning of a key rather than a whole one, so one
   * call drops a family of entries and the count is then above one.
   *
   * @throws {CapabilityError} When the host refused the deletion.
   */
  delete(namespace: string, key: string, prefix?: boolean): Promise<number>;
}

export const cache: CacheCapability = {
  async get<T>(namespace: string, key: string): Promise<T | null> {
    const result = await host.client().call(Cache.method.get, { key: keyOf(namespace, key) });
    raiseOn(CAPABILITY, result.error);
    return result.hit ? decodeJson<T>(result.value) : null;
  },

  async set(namespace: string, key: string, value: unknown, ttl?: Time): Promise<void> {
    const result = await host.client().call(Cache.method.set, {
      key: keyOf(namespace, key),
      value: encodeJson(value),
      ttl: ttl ? create(TimeSchema, { millis: BigInt(ttl.ms) }) : undefined,
    });
    raiseOn(CAPABILITY, result.error);
  },

  async delete(namespace: string, key: string, prefix = false): Promise<number> {
    const result = await host.client().call(Cache.method.delete, {
      key: keyOf(namespace, key),
      prefix,
    });
    raiseOn(CAPABILITY, result.error);
    return result.deleted;
  },
};
