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

import "@scribe/runtime/scholium/runner.ts";
import { Scribe } from "@scribe/alchemy/test";
import "@scribe/testing/settings.ts";
import { AppKeyFirewall } from "@scribe/kernel/identity/firewall/app_key.ts";
import { firewallSettings } from "@scribe/runtime/support/settings/firewall.ts";
import { InternalSecretFirewall } from "@scribe/kernel/identity/firewall/internal.ts";
import { constantTimeEqual } from "@scribe/runtime/support/crypto/constant_time.ts";
import { RequestScope } from "@scribe/runtime/scope.ts";
import { assert, assertFalse } from "@std/assert";

function withHeaders<T>(values: Record<string, string>, run: () => T): T {
  const req = new Request("http://api.test/", { headers: new Headers(values) });
  return RequestScope.run(req, new Uint8Array(0), run, "127.0.0.1");
}

const ADMIN_APP_KEYS = ["test-admin-app-key"];
const APP_KEYS = ["test-app-key"];

const VALID_ADMIN_KEY = ADMIN_APP_KEYS[0];
const VALID_APP_KEY = APP_KEYS[0];
const INTERNAL_SECRET = firewallSettings.get().internalSecret;

Scribe.test("app key firewall: the exact key passes", () => {
  assert(
    withHeaders(
      { "x-admin-app-key": VALID_ADMIN_KEY },
      () => AppKeyFirewall.verify("x-admin-app-key", ADMIN_APP_KEYS),
    ),
  );
});

Scribe.test("app key firewall: a missing header is refused", () => {
  assertFalse(
    withHeaders({}, () => AppKeyFirewall.verify("x-admin-app-key", ADMIN_APP_KEYS)),
  );
});

Scribe.test("app key firewall: near-miss keys are refused", () => {
  for (
    const candidate of [
      "",
      " ",
      VALID_ADMIN_KEY.slice(0, -1),
      `${VALID_ADMIN_KEY}x`,
      VALID_ADMIN_KEY.toUpperCase(),
      `${VALID_ADMIN_KEY}${VALID_ADMIN_KEY}`,
      `${VALID_ADMIN_KEY},${VALID_ADMIN_KEY}`,
    ]
  ) {
    assertFalse(
      withHeaders({ "x-admin-app-key": candidate }, () => AppKeyFirewall.verify("x-admin-app-key", ADMIN_APP_KEYS)),
      `"${candidate}" must not pass for the admin key`,
    );
  }
});

Scribe.test("app key firewall: surrounding whitespace is stripped by HTTP itself", () => {
  assert(
    withHeaders(
      { "x-admin-app-key": ` ${VALID_ADMIN_KEY} ` },
      () => AppKeyFirewall.verify("x-admin-app-key", ADMIN_APP_KEYS),
    ),
    "Headers.get() applies the OWS trim of the HTTP spec, so padding never reaches the comparison",
  );
});

Scribe.test("app key firewall: the app surface and the admin surface do not share keys", () => {
  assertFalse(
    withHeaders(
      { "x-admin-app-key": VALID_APP_KEY },
      () => AppKeyFirewall.verify("x-admin-app-key", ADMIN_APP_KEYS),
    ),
    "an app key must never open the admin API",
  );
  assertFalse(
    withHeaders({ "x-app-key": VALID_ADMIN_KEY }, () => AppKeyFirewall.verify("x-app-key", APP_KEYS)),
  );
});

Scribe.test("app key firewall: the header name is honoured, not guessed", () => {
  assertFalse(
    withHeaders({ "x-app-key": VALID_ADMIN_KEY }, () => AppKeyFirewall.verify("x-admin-app-key", ADMIN_APP_KEYS)),
    "the right key under the wrong header must not pass",
  );
});

Scribe.test("app key firewall: an empty allow-list refuses everything", () => {
  assertFalse(
    withHeaders({ "x-admin-app-key": VALID_ADMIN_KEY }, () => AppKeyFirewall.verify("x-admin-app-key", [])),
  );
  assertFalse(
    withHeaders({ "x-admin-app-key": "" }, () => AppKeyFirewall.verify("x-admin-app-key", [])),
  );
});

Scribe.test("internal firewall: only the exact internal secret passes", () => {
  assert(
    withHeaders({ "x-internal-secret": INTERNAL_SECRET }, () => InternalSecretFirewall.verify()),
  );

  for (const candidate of ["", "nope", INTERNAL_SECRET.slice(0, -1)]) {
    assertFalse(
      withHeaders({ "x-internal-secret": candidate }, () => InternalSecretFirewall.verify()),
    );
  }
  assertFalse(withHeaders({}, () => InternalSecretFirewall.verify()));
});

Scribe.test("internal firewall: an app key does not stand in for the internal secret", () => {
  assertFalse(
    withHeaders({ "x-internal-secret": VALID_ADMIN_KEY }, () => InternalSecretFirewall.verify()),
  );
});

Scribe.test("constantTimeEqual: agrees with === on the outcome", () => {
  assert(constantTimeEqual("abc", "abc"));
  assert(constantTimeEqual("", ""));
  assertFalse(constantTimeEqual("abc", "abd"));
  assertFalse(constantTimeEqual("abc", "abcd"));
  assertFalse(constantTimeEqual("abc", ""));
  assertFalse(constantTimeEqual("é", "e"));
});
