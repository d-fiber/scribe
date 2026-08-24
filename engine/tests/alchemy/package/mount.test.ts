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

import { equals, expect, isA, isFalse, isTrue, throwsA } from "@scribe/engine/alchemy/test/mod.ts";
import { Constraint, type LifecycleSteps, mount, Package } from "@scribe/engine/alchemy/mod.ts";

const realtime = Package.named("realtime").version("1.2.0").runsOn("^3.0.0").build();

Deno.test("mounting keeps the manifest it was given", () => {
  const mounted = mount(realtime, { scribe: {} });

  expect(mounted.manifest.name, equals("realtime"), "the mounted package lost its name");
  expect(mounted.manifest.version.toString(), equals("1.2.0"), "the mounted package lost its version");
});

Deno.test("a package that runs at no moment is mounted all the same", () => {
  const mounted = mount(realtime, { scribe: {} });

  expect(mounted.wires, equals(null), "a package that wires nothing came back with a step");
  expect(mounted.starts, equals(null), "a package that starts nothing came back with a step");
  expect(mounted.stops, equals(null), "a package that stops nothing came back with a step");
});

Deno.test("each moment the entry exports is the one that is handed over", () => {
  const ran: string[] = [];
  const mounted = mount(realtime, {
    scribe: {
      wires: () => void ran.push("wires"),
      starts: () => void ran.push("starts"),
      stops: () => void ran.push("stops"),
    },
  });

  mounted.wires?.();
  mounted.starts?.();
  mounted.stops?.();

  expect(ran, equals(["wires", "starts", "stops"]), "the moments were not the ones the entry exported");
});

Deno.test("what an entry exports beyond the three moments is left alone", () => {
  const entry = { Channel: class {}, scribe: { starts: () => {} } };
  const mounted = mount(realtime, entry);

  expect(mounted.wires, equals(null), "a surface of its own was taken for a moment");
  expect(typeof mounted.starts, equals("function"), "the one moment it did export was dropped");
});

Deno.test("a package that runs at no moment says so with an empty set of steps", () => {
  const none: LifecycleSteps = {};

  expect(mount(realtime, { scribe: none }).starts, equals(null));
});

Deno.test("a manifest cannot be changed once it is built", () => {
  expect(Object.isFrozen(realtime), isTrue, "a built manifest can still be written to");
  expect(Object.isFrozen(realtime.version), isTrue, "the version of a built manifest can be written to");
  expect(Object.isFrozen(realtime.scribe), isTrue, "the framework constraint of a built manifest can be written to");
});

Deno.test("the dependencies of a built manifest cannot be added to", () => {
  const declared = Package.named("realtime")
    .version("1.2.0")
    .runsOn("^3.0.0")
    .dependsOn({ audiences: "^1.0.0" })
    .build();

  expect(
    () => {
      (declared.dependencies as Record<string, Constraint>).smuggled = Constraint.parse("^9.0.0");
    },
    throwsA(isA(TypeError)),
    "a built manifest took a dependency nobody declared",
  );
  expect("smuggled" in declared.dependencies, isFalse);
});
