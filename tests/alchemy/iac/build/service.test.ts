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

import "@scribe/scholium/runner.ts";
import { equals, expect, isA, Scribe, throwsA } from "@scribe/alchemy/test";
import {
  declaredServices,
  DuplicateDeclarationError,
  env,
  forgetServices,
  Image,
  Service,
  setting,
} from "@scribe/alchemy";

Scribe.test("declare resolves environment and tuning to a DeployValue each, a plain string as literal", () => {
  forgetServices();

  const declared = Service("service_env_resolve")
    .source(Image("registry/image:1"))
    .networks(["app"])
    .environment({ IMGPROXY_BIND: ":5001", DATABASE_URL: env("DATABASE_URL") })
    .tuning({ WORKERS: setting("workers"), FIXED: "4" })
    .declare();

  expect(
    declared.options.environment,
    equals({
      IMGPROXY_BIND: { kind: "literal", value: ":5001" },
      DATABASE_URL: { kind: "env", name: "DATABASE_URL" },
    }),
  );
  expect(
    declared.options.tuning,
    equals({
      WORKERS: { kind: "setting", key: "workers" },
      FIXED: { kind: "literal", value: "4" },
    }),
  );
});

Scribe.test("declare defaults environment and tuning to empty objects when neither is given", () => {
  forgetServices();

  const declared = Service("service_env_default").source(Image("registry/image:1")).networks(["app"]).declare();

  expect(declared.options.environment, equals({}));
  expect(declared.options.tuning, equals({}));
});

Scribe.test("a service name declared twice is refused", () => {
  forgetServices();

  Service("service_duplicate").source(Image("registry/image:1")).networks(["app"]).declare();

  expect(
    () => Service("service_duplicate").source(Image("registry/image:1")).networks(["app"]).declare(),
    throwsA(isA(DuplicateDeclarationError)),
  );
});

Scribe.test("declare carries the name and every other option through untouched", () => {
  forgetServices();

  const declared = Service("service_full")
    .source(Image("registry/image:1"))
    .networks(["app"])
    .restart("always")
    .profiles(["storage"])
    .volumes(["storage-data:/var/lib/storage:ro"])
    .declare();

  expect(declared.name, equals("service_full"));
  expect(declared.options.restart, equals("always"));
  expect(declared.options.profiles, equals(["storage"]));
  expect(declared.options.volumes, equals(["storage-data:/var/lib/storage:ro"]));
});

Scribe.test("Image builds an image source, Build a Dockerfile source with its own default", () => {
  expect(Image("registry/image:1"), equals({ kind: "image", reference: "registry/image:1" }));
});

Scribe.test("declaredServices lists every declared service, in declaration order", () => {
  forgetServices();

  Service("service_order_a").source(Image("registry/image:1")).networks(["app"]).declare();
  Service("service_order_b").source(Image("registry/image:1")).networks(["app"]).declare();

  expect(declaredServices().map((service) => service.name), equals(["service_order_a", "service_order_b"]));
});

Scribe.test("forgetServices empties the registry, so a name it held may be declared again", () => {
  forgetServices();
  Service("service_forget").source(Image("registry/image:1")).networks(["app"]).declare();
  forgetServices();

  const redeclared = Service("service_forget").source(Image("registry/image:1")).networks(["app"]).declare();
  expect(redeclared.name, equals("service_forget"), "the name freed by forgetting was still refused");
});
