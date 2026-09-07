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
import { equals, expect, Scribe } from "@scribe/alchemy/test";
import {
  DATABASE_MOMENTS,
  DECLARES_EXPORT,
  DEPLOY,
  DEPLOY_ENTRIES,
  REQUIRED_DATABASE_MOMENTS,
  SERVICE_FRAGMENTS,
} from "@scribe/alchemy";

Scribe.test("the deploy directory is named deploy", () => {
  expect(DEPLOY, equals("deploy"));
});

Scribe.test("a package's SQL plays at three moments, in the order they run", () => {
  expect(DATABASE_MOMENTS, equals(["init", "migrations", "provisioning"]));
});

Scribe.test("a package cannot leave out init or migrations, and provisioning is the one it may", () => {
  expect(REQUIRED_DATABASE_MOMENTS, equals(["init", "migrations"]));
  expect(
    DATABASE_MOMENTS.filter((moment) => !REQUIRED_DATABASE_MOMENTS.includes(moment)),
    equals(["provisioning"]),
  );
});

Scribe.test("a service fragment is one of exactly seven named files", () => {
  expect(
    SERVICE_FRAGMENTS,
    equals([
      "capacity.yaml",
      "docker-compose.yaml",
      "kong.yml",
      "overlay.yaml",
      "replicas.yaml",
      "resources.yaml",
      "tuning.yaml",
    ]),
  );
});

Scribe.test("deploy holds db and nothing but the six other named entries", () => {
  expect(
    DEPLOY_ENTRIES,
    equals([
      "db",
      "services",
      "recipes",
      "deploy.ts",
      "overlay.yaml",
      "configuration.yaml",
      "packages.env",
    ]),
  );
  expect(DEPLOY_ENTRIES.includes("db"), equals(true), "db is the one entry a package cannot omit");
});

Scribe.test("a package lets a project declare against it through an export named declares", () => {
  expect(DECLARES_EXPORT, equals("declares"));
});
