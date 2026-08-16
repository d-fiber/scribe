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

import { OK } from "@scribe/core/contracts/result.ts";
import type { StorageImage } from "@scribe/host/dependencies/database/storage/mod.ts";
import { accountStorage } from "@scribe/host/dependencies/security/auth/src/user/storage/account_storage.ts";
import { assertEquals } from "@std/assert";
import { createStorageMock, installStorageMock } from "@scribe/host/dependencies/database/storage/testing/mock.ts";

const uploadedImage: StorageImage = {
  path: "admin/a.png",
  url: "https://example.com/admin/a.png",
  blurHash: null,
};

Deno.test(
  "storage automock: when() configures a method inherited from ImageResource",
  async () => {
    const mock = createStorageMock();
    mock.when("admin.avatar.upload", () => Promise.resolve(new OK(uploadedImage)));
    assertEquals(
      await mock.target.admin.avatar.upload(new File([], "a.png")),
      new OK(uploadedImage),
    );
  },
);

Deno.test(
  "installStorageMock: swaps every kernel entity and restores them",
  async () => {
    const originalAdmin = accountStorage.admin;
    const originalUser = accountStorage.user;
    const mock = installStorageMock();
    mock.when("admin.avatar.upload", () => Promise.resolve(new OK(uploadedImage)));

    assertEquals(
      await accountStorage.admin.avatar.upload(new File([], "a.png")),
      new OK(uploadedImage),
    );

    mock.restore();
    assertEquals(accountStorage.admin, originalAdmin);
    assertEquals(accountStorage.user, originalUser);
  },
);
