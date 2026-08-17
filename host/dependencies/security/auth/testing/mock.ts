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

import "@scribe/core/testing/settings.ts";
// The `clients.security.auth` tree, covering sign_in, sign_up, reset_password,
// session and user, is deep, and every flow returns a different `Result<T, E>`
// shape. There is no safe universal default here, unlike broadcast. It needs
// `--allow-net` and `tests/.env.test`, the way `rest/install_rest.ts` does.

import { clients } from "@scribe/host/dependencies/clients.ts";
import { type AutoMock, createAutoMock } from "@scribe/core/testing/auto_mock.ts";
import { type InstalledMock, installMock } from "@scribe/core/testing/install.ts";

export function createAuthMock(): AutoMock<typeof clients.security.auth> {
  return createAutoMock(clients.security.auth);
}

export function installAuthMock():
  & AutoMock<typeof clients.security.auth>
  & InstalledMock {
  const mock = createAuthMock();
  const installed = installMock(clients.security, "auth", mock.target);
  return Object.assign(mock, installed);
}
