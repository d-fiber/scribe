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

import { forEachIdentifierNamed, forEachModuleSpecifier, type Rule, type Violation } from "./ast.ts";

/**
 * The workspace root, taken from where this rule sits rather than from the process.
 *
 * The file is `<root>/.lint/sealed-runtime.ts`, so one directory up is the root. It is read once,
 * at load, and never per file: a rule runs for every file in the repository, and an environment
 * call there is both wasteful and, on some platforms, fatal.
 */
const ROOT = new URL("../", import.meta.url).pathname.replace(/\/$/, "");

/**
 * The engine layers a package never touches directly, but that reach the host all the same.
 *
 * `engine/runtime/scholium/` is the exception: it is where the host is allowed to be named, and
 * every other file in these five layers reaches it only through the ports declared there.
 */
const SEALED_ENGINE_LAYERS = [
  "engine/runtime/",
  "engine/kernel/",
  "engine/embedder/",
  "engine/shell/",
  "engine/testing/",
];

/**
 * Where inside the engine layers the host is allowed to be named.
 *
 * `engine/runtime/scholium/deno/`, `.../node/` and `.../bun/` are the container: each holds one
 * stack's own implementation of a listener, a process boundary or the platform's own test runner,
 * and only there. The rest of `engine/runtime/scholium/`, the contracts and the dispatchers that
 * pick one of the three, names no host directly and is held to the same seal as everywhere else.
 * Two older files stand outside the container too, each already its own single, named place
 * rather than a scatter, and each staying there for a reason of its own: `current.ts` fills its
 * port at import rather than at boot, on purpose, and moving it would change when it runs;
 * `constant_time.ts` is read by a package outside this repository, and moving it would mean
 * editing that package's own source instead of this one.
 */
const ENGINE_HOST_EXCEPTIONS = [
  "engine/runtime/scholium/deno/",
  "engine/runtime/scholium/node/",
  "engine/runtime/scholium/bun/",
  "engine/runtime/current.ts",
  "engine/runtime/support/crypto/constant_time.ts",
];

/**
 * Where in a mountable package or an engine layer `filename` sits, or null when the rule leaves
 * it alone.
 *
 * A package names what it wants to do and lets the framework fill in what does it: `lib/` reads
 * the file system, the environment and the rest through the ports in `@scribe/alchemy`, and a
 * test reads them through the Memory doubles in `@scribe/alchemy/test`. Code in either zone that
 * reaches the runtime directly would not survive the framework changing hosts, and it is the seam
 * this rule keeps sealed. The engine layers that sit above a package carry the same seam: they
 * reach the host through the ports in `engine/runtime/scholium/` instead.
 *
 * No package carries an exception. `foundation` used to be the one that read the host directly,
 * to fill the drivers every other package reads through; those drivers moved to
 * `engine/runtime/scholium/`, and every package, `foundation` included, is sealed the same way.
 */
function sealedZone(filename: string): "lib" | "test" | null {
  const root = `${ROOT}/`;
  if (!filename.startsWith(root)) return null;

  const relative = filename.slice(root.length);

  if (relative.startsWith("packages/")) {
    return relative.includes("/tests/") ? "test" : relative.includes("/lib/") ? "lib" : null;
  }

  if (SEALED_ENGINE_LAYERS.some((layer) => relative.startsWith(layer))) {
    if (ENGINE_HOST_EXCEPTIONS.some((exception) => relative.startsWith(exception))) return null;
    return "lib";
  }

  return null;
}

/**
 * The specifier prefixes a mountable package may not import.
 *
 * `@std` and `jsr:@std` are the standard library, `node:` the Node compatibility surface, and
 * `npm:` a package pulled straight from the registry. Each of them is a dependency on the host
 * rather than on the framework, and every one of them has an answer inside `@scribe/alchemy` or,
 * for a test, `@scribe/alchemy/test`.
 */
const FORBIDDEN_SPECIFIERS = ["@std/", "jsr:@std/", "node:", "npm:"] as const;

/** Whether `filename` sits under one of the engine layers this rule seals. */
function isEngineFile(filename: string): boolean {
  const root = `${ROOT}/`;
  if (!filename.startsWith(root)) return false;

  const relative = filename.slice(root.length);
  return SEALED_ENGINE_LAYERS.some((layer) => relative.startsWith(layer));
}

/** The message a forbidden import reports with. */
function importMessage(zone: "lib" | "test", filename: string, specifier: string): string {
  if (isEngineFile(filename)) {
    return `"${specifier}" reaches past the framework to the host runtime under it. ` +
      `engine/kernel, engine/embedder, engine/shell and engine/testing name what they want ` +
      `through the ports in engine/runtime/scholium/, the one place allowed to name the host.`;
  }

  if (zone === "lib") {
    return `"${specifier}" reaches past the framework to the host runtime under it. A package's ` +
      `lib/ names what it wants through @scribe/alchemy, and engine/runtime/scholium/ fills in ` +
      `what does it. No package, foundation included, is allowed to name the host.`;
  }

  return `"${specifier}" reaches past the framework to the host runtime under it. A package test ` +
    `is written against @scribe/alchemy/test, which stands between the two on purpose: Scribe ` +
    `holds the cases, expect and its matchers hold the assertions, and the Memory doubles hold ` +
    `the ports. Nothing a package test needs is outside it.`;
}

/** The message a direct reference to the host runtime reports with. */
function runtimeMessage(zone: "lib" | "test", filename: string): string {
  if (isEngineFile(filename)) {
    return "This reaches the host runtime directly. engine/kernel, engine/embedder, " +
      "engine/shell and engine/testing reach the listener, the process and the rest through " +
      "the ports in engine/runtime/scholium/, the one place allowed to name the host.";
  }

  if (zone === "lib") {
    return "This reaches the host runtime directly. A package's lib/ reaches the file system, " +
      "the environment, a subprocess and the rest through the ports in @scribe/alchemy, which " +
      "engine/runtime/scholium/ fills. No package is allowed to name the host.";
  }

  return "This reaches the host runtime directly. A package test declares its cases with Scribe, " +
    "not the host's own test runner, and reads the clock, the file system and the rest through " +
    "the doubles in @scribe/alchemy/test.";
}

/** A file this rule cannot yet hold to the standard the rest of the repository meets. */
function isExempt(filename: string): boolean {
  return EXEMPT_FILES.some((exempt) => filename.endsWith(`/${exempt}`));
}

/**
 * The four files this rule cannot yet tell "reaches the host" from "names it to refuse it".
 *
 * The first three make a clock or a timer move with `@std/testing/time`, and the package they
 * test reads `Date.now()` or poses `setInterval` directly rather than through a port: nothing in
 * `@scribe/alchemy/test` can simulate one until `pending_token.ts` and `CronRunner` take one as an
 * argument. The fourth, `wires.test.ts`, poses `installMock(Deno, "connect", ...)` to prove that
 * mounting the package dials nothing: naming the host to stop it from acting is not the same
 * gesture as reading or writing through it, and no port answers "nothing may call out" today.
 */
const EXEMPT_FILES = [
  "packages/auth/tests/tests/pending_token.test.ts",
  "packages/foundation/tests/tests/cron/runner.test.ts",
  "packages/foundation/tests/tests/cron/hardening_runner.test.ts",
  "packages/foundation/tests/tests/wiring/wires.test.ts",
];

export const sealedRuntime: Rule = {
  name: "sealed-runtime",

  check(sourceFile, filename) {
    const zone = sealedZone(filename);
    if (zone === null || isExempt(filename)) return [];

    const violations: Violation[] = [];

    forEachModuleSpecifier(sourceFile, ({ node, specifier }) => {
      if (FORBIDDEN_SPECIFIERS.some((prefix) => specifier.startsWith(prefix))) {
        violations.push({ node, message: importMessage(zone, filename, specifier) });
      }
    });

    forEachIdentifierNamed(sourceFile, "Deno", (node) => {
      violations.push({ node, message: runtimeMessage(zone, filename) });
    });

    return violations;
  },
};
