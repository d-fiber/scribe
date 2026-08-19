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


import { Size } from "@scribe/core/contracts/common/size.ts";
import {
  type FileResource,
  type ImageResource,
  type PathArgs,
  Storage,
  StorageVisibility,
} from "@scribe/storage/mod.ts";

const AVATAR = { extensions: ["png", "jpg", "jpeg"], maxSize: Size.megabytes(10) };
const ISSUE = { extensions: ["png", "jpg", "jpeg", "json"], maxSize: Size.megabytes(10) };

/** Everything a user account stores under its own identifier. */
export const userStorage: Storage<"users/{userId}"> = Storage.public("users/{userId}");

/** The branch of a user's folder a URL alone reads nothing of. */
export const userPrivateStorage: Storage<"users/{userId}/private"> = userStorage.child(
  "private",
  StorageVisibility.Private,
);

/** Everything an admin account stores under its own identifier. */
export const adminStorage: Storage<"admin/{adminId}"> = Storage.private("admin/{adminId}");

/** The picture shown for a user, readable by anyone holding its URL. */
export const userAvatar: ImageResource<PathArgs<"users/{userId}">> = userStorage.image(
  "avatar",
  AVATAR,
);

/** What a user attaches when reporting a problem, kept out of the open bucket. */
export const userIssue: FileResource<PathArgs<"users/{userId}/private">> = userPrivateStorage
  .file("issue", ISSUE);

/** The picture shown for an admin, behind the admin gateway like the rest of that bucket. */
export const adminAvatar: ImageResource<PathArgs<"admin/{adminId}">> = adminStorage.image(
  "avatar",
  AVATAR,
);

/**
 * The storage a route reaches for an account, whichever kind of account it is.
 *
 * The declarations above are what a route may also import one by one. They are gathered here so
 * that a test harness has a single object to swap, which is what `installAccountStorageMock`
 * does.
 */
export class AccountStorage {
  /** The picture shown for a user. */
  readonly userAvatar: typeof userAvatar = userAvatar;

  /** What a user attaches when reporting a problem. */
  readonly userIssue: typeof userIssue = userIssue;

  /** The picture shown for an admin. */
  readonly adminAvatar: typeof adminAvatar = adminAvatar;
}

/** The one instance a route reaches, and the one a test harness swaps. */
export const accountStorage: AccountStorage = new AccountStorage();
