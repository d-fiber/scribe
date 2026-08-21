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

import { DirectoryServiceResolver } from "@scribe/host/boot/edge/services/directory_service_resolver.ts";
import type { ModuleProbe } from "@scribe/host/boot/edge/services/module_probe.ts";
import { ResolutionCache } from "@scribe/host/boot/edge/services/resolution_cache.ts";
import { assert, assertEquals } from "@std/assert";

const ROOT = "/home/deno/functions";

class KnownDirectories implements ModuleProbe {
  readonly probed: string[] = [];

  constructor(private readonly known: ReadonlySet<string>) {}

  hasModule(directory: string): Promise<boolean> {
    this.probed.push(directory);
    return Promise.resolve(this.known.has(directory));
  }
}

function resolver(...known: string[]) {
  const probe = new KnownDirectories(new Set(known));
  return { probe, resolver: new DirectoryServiceResolver(ROOT, probe) };
}

Deno.test("DirectoryServiceResolver finds a two-segment service under api/public", async () => {
  const { resolver: subject } = resolver(`${ROOT}/api/public/admin`);

  assertEquals(await subject.resolve("/public/admin/team/roles"), {
    service: "public/admin",
    servicePath: `${ROOT}/api/public/admin`,
  });
});

Deno.test("DirectoryServiceResolver finds a two-segment service at the root", async () => {
  const { resolver: subject } = resolver(`${ROOT}/internal/gotrue`);

  assertEquals(await subject.resolve("/internal/gotrue/email"), {
    service: "internal/gotrue",
    servicePath: `${ROOT}/internal/gotrue`,
  });
});

Deno.test("DirectoryServiceResolver falls back to a single segment under api/", async () => {
  const { resolver: subject } = resolver(`${ROOT}/api/internal/vpn`);

  assertEquals(await subject.resolve("/vpn/config"), {
    service: "vpn",
    servicePath: `${ROOT}/api/internal/vpn`,
  });
});

Deno.test("DirectoryServiceResolver prefers the two-segment match over the single one", async () => {
  const { resolver: subject } = resolver(
    `${ROOT}/api/public/admin`,
    `${ROOT}/api/public`,
  );

  const resolved = await subject.resolve("/public/admin/team");

  assertEquals(resolved?.service, "public/admin");
});

Deno.test("DirectoryServiceResolver falls back to the bare service path when nothing exists", async () => {
  const { resolver: subject } = resolver();

  assertEquals(await subject.resolve("/unknown/thing"), {
    service: "unknown",
    servicePath: `${ROOT}/unknown`,
  });
});

Deno.test("DirectoryServiceResolver returns null on an empty path", async () => {
  const { resolver: subject, probe } = resolver();

  assertEquals(await subject.resolve("/"), null);
  assertEquals(await subject.resolve(""), null);
  assertEquals(probe.probed.length, 0);
});

Deno.test("DirectoryServiceResolver probes the documented prefix order", async () => {
  const { resolver: subject, probe } = resolver();

  await subject.resolve("/a/b");

  assertEquals(probe.probed, [
    `${ROOT}/a/b`,
    `${ROOT}/api/a/b`,
    `${ROOT}/api/public/a/b`,
    `${ROOT}/api/internal/a/b`,
    `${ROOT}/api/a`,
    `${ROOT}/api/public/a`,
    `${ROOT}/api/internal/a`,
  ]);
});

Deno.test("DirectoryServiceResolver probes the same path only once", async () => {
  const { resolver: subject, probe } = resolver(`${ROOT}/api/internal/vpn`);

  await subject.resolve("/vpn/config");
  const afterFirst = probe.probed.length;
  await subject.resolve("/vpn/config");
  await subject.resolve("/vpn/config");

  assertEquals(probe.probed.length, afterFirst);
});

Deno.test("DirectoryServiceResolver reuses a single-segment match across sub-paths", async () => {
  const { resolver: subject, probe } = resolver(`${ROOT}/api/internal/vpn`);

  await subject.resolve("/vpn/config");
  probe.probed.length = 0;
  await subject.resolve("/vpn/renew");

  assertEquals(probe.probed, [
    `${ROOT}/vpn/renew`,
    `${ROOT}/api/vpn/renew`,
    `${ROOT}/api/public/vpn/renew`,
    `${ROOT}/api/internal/vpn/renew`,
  ]);
});

Deno.test("DirectoryServiceResolver remembers that nothing matched", async () => {
  const { resolver: subject, probe } = resolver();

  assertEquals(await subject.resolve("/unknown/thing"), {
    service: "unknown",
    servicePath: `${ROOT}/unknown`,
  });
  const afterFirst = probe.probed.length;

  assertEquals(await subject.resolve("/unknown/thing"), {
    service: "unknown",
    servicePath: `${ROOT}/unknown`,
  });
  assertEquals(probe.probed.length, afterFirst);
});

Deno.test("DirectoryServiceResolver keeps resolving once the cache is full", async () => {
  const probe = new KnownDirectories(new Set([`${ROOT}/api/internal/vpn`]));
  const subject = new DirectoryServiceResolver(
    ROOT,
    probe,
    new ResolutionCache(2),
    new ResolutionCache(2),
  );

  for (let index = 0; index < 50; index++) {
    assertEquals(await subject.resolve(`/absent${index}/thing`), {
      service: `absent${index}`,
      servicePath: `${ROOT}/absent${index}`,
    });
  }

  assertEquals(await subject.resolve("/vpn/config"), {
    service: "vpn",
    servicePath: `${ROOT}/api/internal/vpn`,
  });
});

Deno.test("ResolutionCache never grows past its limit", () => {
  const cache = new ResolutionCache(4);

  for (let index = 0; index < 100; index++) {
    cache.remember(`service-${index}`, null);
    assert(cache.size <= 4);
  }
});
