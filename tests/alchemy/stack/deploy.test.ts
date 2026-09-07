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
import { contains, equals, expect, having, isA, isNotNull, isNull, Scribe, throwsA } from "@scribe/alchemy/test";
import {
  declaredDeploy,
  Deploy,
  DuplicateDeclarationError,
  forgetDeploy,
  forgetServices,
  Image,
  Role,
  Service,
  setting,
  Sql,
} from "@scribe/alchemy";

Scribe.test("a setting read on a service's environment without a matching declaration is refused", () => {
  forgetDeploy();
  forgetServices();

  const workers = Service("deploy_missing_setting")
    .source(Image("registry/image:1"))
    .networks(["app"])
    .environment({ WORKERS: setting("workers") })
    .declare();

  expect(
    () => Deploy({ services: [workers] }),
    throwsA(having(isA(Error), (raised) => raised.message, "message", contains('setting("workers")'))),
  );
});

Scribe.test("a setting read on a service's tuning without a matching declaration is refused", () => {
  forgetDeploy();
  forgetServices();

  const workers = Service("deploy_missing_tuning_setting")
    .source(Image("registry/image:1"))
    .networks(["app"])
    .tuning({ WORKERS: setting("workers") })
    .declare();

  expect(
    () => Deploy({ services: [workers] }),
    throwsA(having(isA(Error), (raised) => raised.message, "message", contains('setting("workers")'))),
  );
});

Scribe.test("a setting read on the configuration's own environment without a declaration is refused", () => {
  forgetDeploy();

  expect(
    () => Deploy({ configuration: { env: { DATABASE_URL: setting("databaseUrl") } } }),
    throwsA(having(isA(Error), (raised) => raised.message, "message", contains('setting("databaseUrl")'))),
  );
});

Scribe.test("a setting declared in configuration.settings is accepted wherever it is read", () => {
  forgetDeploy();
  forgetServices();

  const workers = Service("deploy_declared_setting")
    .source(Image("registry/image:1"))
    .networks(["app"])
    .environment({ WORKERS: setting("workers") })
    .declare();

  const declared = Deploy({
    services: [workers],
    configuration: { settings: { workers: { doc: "How many workers to run.", type: "integer", default: 4 } } },
  });

  expect(declared.options.services?.[0].options.environment.WORKERS, equals({ kind: "setting", key: "workers" }));
});

Scribe.test("configuration.env is resolved to a DeployValue each, a plain string as literal", () => {
  forgetDeploy();

  const declared = Deploy({
    configuration: { env: { LOG_LEVEL: "info", HOST: { kind: "literal", value: "0.0.0.0" } } },
  });

  expect(declared.options.configuration.env.LOG_LEVEL, equals({ kind: "literal", value: "info" }));
  expect(declared.options.configuration.env.HOST, equals({ kind: "literal", value: "0.0.0.0" }));
});

Scribe.test("Deploy declared a second time is refused", () => {
  forgetDeploy();
  Deploy({});

  expect(() => Deploy({}), throwsA(isA(DuplicateDeclarationError)));
});

Scribe.test("declaredDeploy answers null before Deploy is called, and the declaration after", () => {
  forgetDeploy();
  expect(declaredDeploy(), isNull);

  Deploy({});
  expect(declaredDeploy(), isNotNull, "Deploy did not register under declaredDeploy");
});

Scribe.test("Role and Sql carry their fields through without reaching anything", () => {
  expect(
    Role("supabase_storage_admin", { passwordEnv: "STORAGE_ADMIN_PASSWORD" }),
    equals({
      kind: "role",
      name: "supabase_storage_admin",
      options: { passwordEnv: "STORAGE_ADMIN_PASSWORD" },
    }),
  );
  expect(Sql("select 1;"), equals({ kind: "raw", sql: "select 1;" }));
});

Scribe.test("forgetDeploy empties the registry, so Deploy may be called again", () => {
  forgetDeploy();
  Deploy({});
  forgetDeploy();

  Deploy({});
  expect(declaredDeploy(), isNotNull, "the declaration freed by forgetting was still refused");
});
