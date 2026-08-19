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
import { OK } from "@scribe/core/contracts/result.ts";
import type { StorageImage } from "@scribe/storage/mod.ts";
import { accountStorage } from "@scribe/host/dependencies/security/auth/src/user/storage/account_storage.ts";
import { assertEquals } from "@std/assert";
import {
  createAccountStorageMock,
  installAccountStorageMock,
} from "@scribe/host/dependencies/security/auth/testing/account_storage.ts";

const uploadedImage: StorageImage = {
  path: "admin/a1/avatar",
  url: "https://example.com/admin/a1/avatar",
  blurHash: null,
};

Deno.test(
  "account storage automock: when() configures a method inherited from ImageResource",
  async () => {
    const mock = createAccountStorageMock();
    mock.when("adminAvatar.upload", () => Promise.resolve(new OK(uploadedImage)));
    assertEquals(
      await mock.target.adminAvatar.upload(new File([], "a.png"), "a1"),
      new OK(uploadedImage),
    );
  },
);

Deno.test(
  "installAccountStorageMock: swaps every declared resource and restores them",
  async () => {
    const originalAvatar = accountStorage.adminAvatar;
    const originalIssue = accountStorage.userIssue;
    const mock = installAccountStorageMock();
    mock.when("adminAvatar.upload", () => Promise.resolve(new OK(uploadedImage)));

    assertEquals(
      await accountStorage.adminAvatar.upload(new File([], "a.png"), "a1"),
      new OK(uploadedImage),
    );

    mock.restore();
    assertEquals(accountStorage.adminAvatar, originalAvatar);
    assertEquals(accountStorage.userIssue, originalIssue);
  },
);

Deno.test("account storage: a user avatar renders under the account it belongs to", () => {
  assertEquals(
    accountStorage.userAvatar.url("u1"),
    "http://localhost:4000/storage/v1/object/public/public_bucket/users/u1/avatar",
  );
});

Deno.test("account storage: a user issue lands in the private bucket", () => {
  assertEquals(
    accountStorage.userIssue.url("u1"),
    "http://localhost:4001/storage/v1/object/private_bucket/users/u1/private/issue",
  );
});
