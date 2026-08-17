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

import { consoleLevelNamed, levelForStatus, reaches } from "@scribe/core/kernel/observability/level.ts";
import { assertEquals } from "@std/assert";

Deno.test("levelForStatus blames the caller for a 4xx and the host for a 5xx", () => {
  assertEquals(levelForStatus(200), "info");
  assertEquals(levelForStatus(304), "info");
  assertEquals(levelForStatus(399), "info");
  assertEquals(levelForStatus(400), "warn");
  assertEquals(levelForStatus(404), "warn");
  assertEquals(levelForStatus(499), "warn");
  assertEquals(levelForStatus(500), "error");
  assertEquals(levelForStatus(503), "error");
});

Deno.test("reaches keeps a warn threshold silent on the exchanges that went fine", () => {
  assertEquals(reaches("info", "warn"), false, "a 200 is what the threshold exists to drop");
  assertEquals(reaches("debug", "warn"), false);
  assertEquals(reaches("warn", "warn"), true, "the threshold itself is included");
  assertEquals(reaches("error", "warn"), true);
});

Deno.test("reaches lets a developer ask for every exchange", () => {
  for (const level of ["debug", "info", "warn", "error"] as const) {
    assertEquals(reaches(level, "debug"), true, `${level} must clear the lowest threshold`);
  }
});

Deno.test("reaches stops at silent, including the failures", () => {
  for (const level of ["debug", "info", "warn", "error"] as const) {
    assertEquals(reaches(level, "silent"), false, `${level} must not print under silent`);
  }
});

Deno.test("consoleLevelNamed accepts what an env file realistically carries", () => {
  assertEquals(consoleLevelNamed("warn"), "warn");
  assertEquals(consoleLevelNamed("ERROR"), "error");
  assertEquals(consoleLevelNamed("  info  "), "info");
  assertEquals(consoleLevelNamed("silent"), "silent");
});

Deno.test("consoleLevelNamed refuses a name it does not know instead of silencing the terminal", () => {
  assertEquals(consoleLevelNamed("verbose"), null);
  assertEquals(consoleLevelNamed(""), null);
  assertEquals(consoleLevelNamed(undefined), null);
  assertEquals(
    consoleLevelNamed("constructor"),
    null,
    "a member of Object.prototype is not a level, and `in` alone says it is",
  );
});
