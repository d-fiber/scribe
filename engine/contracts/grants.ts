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

/** What a deployment grants one account. */
export interface Grants {
  /** What the deployment calls this account, in one word. */
  readonly role: string;

  /** What the account may do beyond what the role already says. */
  readonly permissions: string[];
}

/**
 * Where a deployment keeps what it grants.
 *
 * @remarks
 * The two questions are asked separately because a role is a fact about one account and the
 * permissions are a fact about the role, so a deployment that has ten thousand accounts and
 * six roles answers the second one from six rows.
 *
 * Nothing here reads what a role is called. A deployment that has one role, or a hundred, or
 * none at all is the same to this: the word travels to the endpoint that declared it and this
 * layer only carries it.
 */
export interface GrantSource {
  /** What `accountId` is called, or null when the deployment grants it nothing. */
  roleOf(accountId: string): Promise<string | null>;

  /** What `role` may do. Empty when it may do nothing beyond what its name says. */
  permissionsOf(role: string): Promise<string[]>;
}
