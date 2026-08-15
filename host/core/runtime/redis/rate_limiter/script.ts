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

import { kv } from "@scribe/core/runtime/redis/mod.ts";

export interface RateLimitCommands {
    rateLimitCheck(
      blockedKey: string,
      windowKey: string,
      strikesKey: string,
      limit: number,
      window: number,
      penalty: number,
      maxPenalty: number,
      strikeMemory: number,
      now: number,
      member: string,
    ): Promise<[number, number, number]>;
  }

const RATE_LIMIT_SCRIPT = `
local blocked_key = KEYS[1]
local window_key = KEYS[2]
local strikes_key = KEYS[3]

local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local penalty = tonumber(ARGV[3])
local max_penalty = tonumber(ARGV[4])
local strike_memory = tonumber(ARGV[5])
local now = tonumber(ARGV[6])
local member = ARGV[7]

local function seconds(value)
  return math.max(1, math.floor(value))
end

local blocked_ttl = redis.call('PTTL', blocked_key)
if blocked_ttl and blocked_ttl > 0 then
  local strikes = tonumber(redis.call('GET', strikes_key)) or 0
  return {0, math.ceil(blocked_ttl / 1000), strikes}
end

local min_score = now - (window * 1000)
redis.call('ZREMRANGEBYSCORE', window_key, '-inf', min_score)
redis.call('ZADD', window_key, now, member)
local count = redis.call('ZCARD', window_key)
redis.call('EXPIRE', window_key, seconds(window))

if count > limit then
  local strikes = (tonumber(redis.call('GET', strikes_key)) or 0) + 1
  local scaled_penalty = seconds(math.min(penalty * (2 ^ (strikes - 1)), max_penalty))
  redis.call('SET', blocked_key, '1', 'EX', scaled_penalty)
  redis.call('SET', strikes_key, strikes, 'EX', seconds(strike_memory))
  redis.call('DEL', window_key)
  return {0, scaled_penalty, strikes}
end

return {1, limit - count, 0}
`;

export function rateLimitCommands(): RateLimitCommands {
  const client = kv();
  const commands = client as unknown as Partial<RateLimitCommands>;
  if (typeof commands.rateLimitCheck !== "function") {
    client.defineCommand("rateLimitCheck", {
      numberOfKeys: 3,
      lua: RATE_LIMIT_SCRIPT,
    });
  }
  return client as unknown as RateLimitCommands;
}
