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

import { contains, equals, expect, having, isA, throwsA } from "../../src/test/mod.ts";
import { DeclarationError, DEFAULT_DESCRIPTION, handsOverNothing, Package, VersionError } from "../../mod.ts";

Deno.test("a manifest carries what the chain gave it", () => {
  const declared = Package.named("realtime")
    .describedAs("Broadcasts a row's life to the callers a channel lets in.")
    .version("1.2.0")
    .runsOn("^3.0.0")
    .dependsOn({ audiences: "^1.0.0" })
    .build();

  expect(declared.name, equals("realtime"), "the manifest lost its name");
  expect(
    declared.description,
    equals("Broadcasts a row's life to the callers a channel lets in."),
    "the manifest lost its description",
  );
  expect(declared.version.toString(), equals("1.2.0"), "the manifest lost its version");
  expect(declared.scribe.toString(), equals("^3.0.0"), "the manifest lost the framework it runs on");
  expect(declared.dependencies["audiences"]?.toString(), equals("^1.0.0"), "the manifest lost its dependency");
});

Deno.test("a package that says nothing beyond its version and its framework is a package", () => {
  const declared = Package.named("audiences").version("1.0.0").runsOn("^3.0.0").build();

  expect(Object.keys(declared.dependencies).length, equals(0), "a package that asks for nothing carries a dependency");
  expect(declared.description, equals(DEFAULT_DESCRIPTION), "a package nobody described was described anyway");
});

Deno.test("a package that describes itself with nothing is refused", () => {
  expect(
    () => Package.named("realtime").describedAs("   "),
    throwsA(
      having(isA(DeclarationError), (raised) => raised.message, "message", contains("describes itself with nothing")),
    ),
  );
});

Deno.test("a name with a capital letter cannot open a manifest", () => {
  expect(
    () => Package.named("Realtime"),
    throwsA(having(isA(DeclarationError), (raised) => raised.message, "message", contains("cannot name a package"))),
  );
});

Deno.test("a name with a digit cannot open a manifest", () => {
  expect(
    () => Package.named("s3"),
    throwsA(having(isA(DeclarationError), (raised) => raised.message, "message", contains("cannot name a package"))),
  );
});

Deno.test("a name with a doubled underscore cannot open a manifest", () => {
  expect(
    () => Package.named("dynamic__links"),
    throwsA(having(isA(DeclarationError), (raised) => raised.message, "message", contains("cannot name a package"))),
  );
});

Deno.test("a name the framework keeps cannot open a manifest", () => {
  expect(
    () => Package.named("core"),
    throwsA(having(isA(DeclarationError), (raised) => raised.message, "message", contains("keeps for itself"))),
  );
});

Deno.test("a version that is not three numbers is refused", () => {
  expect(
    () => Package.named("realtime").version("1.2"),
    throwsA(having(isA(VersionError), (raised) => raised.message, "message", contains("is not a version"))),
  );
});

Deno.test("a framework constraint that cannot be read is refused", () => {
  expect(
    () => Package.named("realtime").version("1.0.0").runsOn("3.x"),
    throwsA(having(isA(VersionError), (raised) => raised.message, "message", contains("is not a bound"))),
  );
});

Deno.test("a package cannot ask for itself", () => {
  expect(
    () => Package.named("realtime").version("1.0.0").runsOn("^3.0.0").dependsOn({ realtime: "^1.0.0" }),
    throwsA(having(isA(DeclarationError), (raised) => raised.message, "message", contains("asks for itself"))),
  );
});

Deno.test("a dependency on something that cannot name a package is refused", () => {
  expect(
    () => Package.named("realtime").version("1.0.0").runsOn("^3.0.0").dependsOn({ Audiences: "^1.0.0" }),
    throwsA(having(isA(DeclarationError), (raised) => raised.message, "message", contains("cannot name a package"))),
  );
});

Deno.test("a package that hands the stack nothing declares nothing", () => {
  const declared = Package.named("audiences").version("1.0.0").runsOn("^3.0.0").build();

  expect(handsOverNothing(declared.artefacts), equals(true), "a package that took no step declared something");
  expect(declared.artefacts.db, equals(null), "a package that took no step named a sql directory");
  expect(declared.artefacts.protocol, equals(null), "a package that took no step named a protocol directory");
  expect(declared.artefacts.ops.length, equals(0), "a package that took no step named a service");
});

Deno.test("a package carries what it said it hands the stack", () => {
  const declared = Package.named("foundation")
    .version("1.0.0")
    .runsOn("^3.0.0")
    .hands({
      db: { init: "./db/init/", provisioning: "./db/provisioning/" },
      protocol: "./protocol/",
      ops: ["./ops/database/", "./ops/queue/"],
    })
    .build();

  expect(declared.artefacts.db?.init, equals("db/init"), "the init directory was lost");
  expect(declared.artefacts.db?.provisioning, equals("db/provisioning"), "the provisioning directory was lost");
  expect(declared.artefacts.db?.migrations, equals(null), "a directory nobody named came back declared");
  expect(declared.artefacts.protocol, equals("protocol"), "the protocol directory was lost");
  expect([...declared.artefacts.ops], equals(["ops/database", "ops/queue"]), "the services were lost");
});

Deno.test("a db block naming no directory is the same as no db block", () => {
  const declared = Package.named("audiences").version("1.0.0").runsOn("^3.0.0").hands({ db: {} }).build();

  expect(declared.artefacts.db, equals(null), "an empty block declared a directory");
});

Deno.test("what a package hands the stack cannot be changed once it is built", () => {
  const declared = Package.named("audiences").version("1.0.0").runsOn("^3.0.0").hands({ protocol: "./wire/" }).build();

  expect(Object.isFrozen(declared.artefacts), equals(true), "the artefacts of a built manifest are writable");
});

Deno.test("an absolute path is refused", () => {
  expect(
    () => Package.named("audiences").version("1.0.0").runsOn("^3.0.0").hands({ protocol: "/srv/protocol" }),
    throwsA(having(isA(DeclarationError), (raised) => raised.message, "message", contains("is an absolute path"))),
  );
});

Deno.test("a path that climbs out of the package is refused", () => {
  expect(
    () => Package.named("audiences").version("1.0.0").runsOn("^3.0.0").hands({ protocol: "../auth/protocol" }),
    throwsA(having(isA(DeclarationError), (raised) => raised.message, "message", contains("climbs out"))),
  );
});

Deno.test("a path written empty is refused rather than read as the package itself", () => {
  expect(
    () => Package.named("audiences").version("1.0.0").runsOn("^3.0.0").hands({ protocol: "   " }),
    throwsA(having(isA(DeclarationError), (raised) => raised.message, "message", contains("names nothing"))),
  );
});

Deno.test("two spellings of one service are refused as the duplicate they are", () => {
  expect(
    () => Package.named("audiences").version("1.0.0").runsOn("^3.0.0").hands({ ops: ["./ops/queue/", "ops/queue"] }),
    throwsA(having(isA(DeclarationError), (raised) => raised.message, "message", contains("twice"))),
  );
});

Deno.test("a path that climbs and comes back stays inside the package", () => {
  const declared = Package.named("audiences")
    .version("1.0.0")
    .runsOn("^3.0.0")
    .hands({ protocol: "./ops/../protocol" })
    .build();

  expect(declared.artefacts.protocol, equals("protocol"), "the path was not read as the place it points at");
});
