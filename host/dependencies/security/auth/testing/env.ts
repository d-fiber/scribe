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

import "@scribe/core/testing/settings.ts";
import type { RateLimitCommands } from "@scribe/core/runtime/redis/rate_limiter/script.ts";
import { kv, type Kv } from "@scribe/core/runtime/redis/mod.ts";
import { type InstalledMock, installMock } from "@scribe/core/testing/install.ts";
import { installValkeryMock } from "@scribe/core/testing/runtime/redis.ts";

const _ALLOWED: [number, number, number] = [1, 9, 0];
const _BLOCKED: [number, number, number] = [0, 900, 1];

export interface AuthEnvMock extends InstalledMock {
  readonly rateLimitKeys: string[];
  readonly cacheKeys: string[];
  block(keySuffix: string): void;
  blockedPeek(keySuffix: string): void;
}

export function installAuthEnv(): AuthEnvMock {
  const valkery = installValkeryMock();
  const rateLimitKeys: string[] = [];
  const blocked = new Set<string>();
  const blockedPeeks = new Set<string>();
  const counters = new Map<string, number>();

  const incr = installMock(
    kv(),
    "incr",
    ((key: string) => {
      const next = (counters.get(key) ?? 0) + 1;
      counters.set(key, next);
      return Promise.resolve(next);
    }) as unknown as Kv["incr"],
  );

  const expire = installMock(
    kv(),
    "expire",
    (() => Promise.resolve(1)) as unknown as Kv["expire"],
  );

  const sets = new Map<string, Set<string>>();
  const previousDel = kv().del.bind(kv);
  const previousSetex = kv().setex.bind(kv);
  const cacheKeys: string[] = [];

  const setex = installMock(
    kv(),
    "setex",
    ((key: string, seconds: number, value: string) => {
      cacheKeys.push(key);
      return previousSetex(key, seconds, value);
    }) as unknown as Kv["setex"],
  );

  const sadd = installMock(
    kv(),
    "sadd",
    ((key: string, ...members: string[]) => {
      const set = sets.get(key) ?? new Set<string>();
      for (const member of members) set.add(member);
      sets.set(key, set);
      return Promise.resolve(members.length);
    }) as unknown as Kv["sadd"],
  );

  const smembers = installMock(
    kv(),
    "smembers",
    ((key: string) => Promise.resolve([...(sets.get(key) ?? [])])) as unknown as Kv["smembers"],
  );

  const del = installMock(
    kv(),
    "del",
    ((...keys: string[]) => {
      let removed = 0;
      for (const key of keys) if (sets.delete(key)) removed++;
      return previousDel(...keys).then((n: number) => n + removed);
    }) as unknown as Kv["del"],
  );

  const strip = (key: string) => key.replace(/^rl:(blocked|window|strikes):/, "");

  const check = installMock(
    kv() as unknown as RateLimitCommands,
    "rateLimitCheck",
    ((blockedKey: string) => {
      const key = strip(blockedKey);
      rateLimitKeys.push(key);
      const hit = [...blocked].some((suffix) => key.includes(suffix));
      return Promise.resolve(hit ? _BLOCKED : _ALLOWED);
    }) as unknown as RateLimitCommands["rateLimitCheck"],
  );

  const pttl = installMock(
    kv(),
    "pttl",
    ((blockedKey: string) => {
      const key = strip(blockedKey);
      const hit = [...blockedPeeks].some((suffix) => key.includes(suffix));
      return Promise.resolve(hit ? 900_000 : -2);
    }) as unknown as Kv["pttl"],
  );

  return {
    rateLimitKeys,
    cacheKeys,
    block: (keySuffix: string) => blocked.add(keySuffix),
    blockedPeek: (keySuffix: string) => blockedPeeks.add(keySuffix),
    restore(): void {
      setex.restore();
      del.restore();
      smembers.restore();
      sadd.restore();
      pttl.restore();
      check.restore();
      expire.restore();
      incr.restore();
      valkery.restore();
    },
  };
}
