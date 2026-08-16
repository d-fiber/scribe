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

import {
  firstSegmentOf,
  originOf,
  pathnameOf,
  searchOf,
  stripPrefix,
} from "@scribe/core/runtime/http/pathname.ts";
import { assertEquals } from "@std/assert";

const ORIGIN = "http://api.test";

const SEGMENT_ALPHABET = [
  "admin",
  "app",
  "queue",
  ".",
  "..",
  "%2e",
  "%2E",
  "%2e%2e",
  "%2f",
  "%252e",
  "\\",
  " ",
  "\t",
  "é",
  ";",
  "@",
  "",
  "a-b",
  "a_b",
  "~9",
];

const PREFIXES = ["admin", "app", "queue", "x"];

function splitFirstSegment(pathname: string): string {
  return pathname.split("/").filter(Boolean)[0] ?? "";
}

function splitStripPrefix(pathname: string, prefix: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== prefix) return pathname;
  return "/" + segments.slice(1).join("/");
}

function* pathnames(): Generator<string> {
  for (const first of SEGMENT_ALPHABET) {
    for (const second of SEGMENT_ALPHABET) {
      for (const lead of ["/", "//"]) {
        for (const tail of ["", "/", "//"]) {
          yield `${lead}${first}/${second}${tail}`;
        }
      }
    }
  }
  yield "";
  yield "/";
  yield "//";
  yield "///";
}

Deno.test("pathnameOf agrees with new URL on every hostile segment shape", () => {
  let checked = 0;

  for (const pathname of pathnames()) {
    const url = ORIGIN + (pathname.startsWith("/") ? pathname : `/${pathname}`);
    assertEquals(pathnameOf(url), new URL(url).pathname, url);
    checked++;
  }

  for (const segment of SEGMENT_ALPHABET) {
    for (const suffix of [`?q=${segment}`, `#${segment}`, `?a=b#${segment}`]) {
      const url = `${ORIGIN}/admin/team${suffix}`;
      assertEquals(pathnameOf(url), new URL(url).pathname, url);
      checked++;
    }
  }

  assertEquals(checked > 2000, true, "the sweep must stay broad");
});

Deno.test("pathnameOf falls back so percent-encoded dots cannot escape", () => {
  const escapes = [
    "/%2e%2e/admin",
    "/%2E%2E/admin",
    "/app/%2e%2e/admin/team",
    "/app/../admin/team",
    "/app/./team",
    "/app%2fadmin",
    "/%252e%252e/admin",
    "/app/ /team",
    "/app\\admin",
  ];

  for (const pathname of escapes) {
    const url = ORIGIN + pathname;
    assertEquals(pathnameOf(url), new URL(url).pathname, url);
  }
});

Deno.test("pathnameOf reads the framework's own paths without allocating a URL", () => {
  const real = [
    "/admin/team/roles",
    "/app/devops/remote-config",
    "/queue/drain",
    "/auth-intra/session",
    "/gotrue/token",
    "/messaging/mail",
    "/_health",
    "/admin",
  ];

  for (const pathname of real) {
    assertEquals(pathnameOf(ORIGIN + pathname), pathname);
    assertEquals(pathnameOf(`${ORIGIN}${pathname}?page=2`), pathname);
  }

  assertEquals(pathnameOf(ORIGIN), "/");
  assertEquals(pathnameOf(`${ORIGIN}?page=2`), "/");
});

Deno.test("originOf yields the same base as URL.origin for rewriting", () => {
  const urls = [
    `${ORIGIN}/admin/team`,
    "http://api.test:8000/admin/team",
    "http://api.test:80/admin/team",
    "https://api.test:443/admin/team",
    "http://127.0.0.1:9000/x",
    "http://[::1]:9000/x",
    "http://api.test",
  ];

  for (const url of urls) {
    const fromSlice = new URL("/team", originOf(url)).href;
    const fromOrigin = new URL("/team", new URL(url).origin).href;
    assertEquals(fromSlice, fromOrigin, url);
  }
});

Deno.test("searchOf reads the same query string as URL.search", () => {
  const urls = [
    `${ORIGIN}/admin/team`,
    `${ORIGIN}/admin/team?offset=40&size=10`,
    `${ORIGIN}/admin/team?`,
    `${ORIGIN}/admin/team?a=b#frag`,
    `${ORIGIN}/admin/team#frag`,
    `${ORIGIN}/admin/team#frag?notaquery`,
    `${ORIGIN}/admin/team?#frag`,
    `${ORIGIN}?offset=40`,
    ORIGIN,
    `${ORIGIN}/admin/team?q=a%2fb&r=%2e%2e`,
    `${ORIGIN}/admin/team?q=a+b&r=c%20d`,
  ];

  for (const url of urls) {
    assertEquals(searchOf(url), new URL(url).search, url);
  }
});

Deno.test("firstSegmentOf and stripPrefix keep the split semantics they replace", () => {
  for (const pathname of pathnames()) {
    assertEquals(
      firstSegmentOf(pathname),
      splitFirstSegment(pathname),
      pathname,
    );

    for (const prefix of PREFIXES) {
      assertEquals(
        stripPrefix(pathname, prefix),
        splitStripPrefix(pathname, prefix),
        `${pathname} +${prefix}`,
      );
    }
  }
});

Deno.test("stripPrefix removes the service segment and nothing else", () => {
  assertEquals(stripPrefix("/queue/drain", "queue"), "/drain");
  assertEquals(stripPrefix("/queue", "queue"), "/");
  assertEquals(stripPrefix("/queue/", "queue"), "/");
  assertEquals(stripPrefix("/other/drain", "queue"), "/other/drain");
  assertEquals(stripPrefix("/queued/drain", "queue"), "/queued/drain");
  assertEquals(stripPrefix("/queue//drain", "queue"), "/drain");
});
