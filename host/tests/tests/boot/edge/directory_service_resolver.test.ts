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

import { DirectoryServiceResolver } from "@scribe/host/boot/edge/services/directory_service_resolver.ts";
import type { ModuleProbe } from "@scribe/host/boot/edge/services/module_probe.ts";
import { assertEquals } from "@std/assert";

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
