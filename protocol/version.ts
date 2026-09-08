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

/**
 * The version of the wire contract itself, bumped when a change to `*.proto` would break a side
 * that has not rebuilt against it.
 *
 * @remarks
 * Not a package version: `sdk/js`'s own `SDK_VERSION` and `sdk/dart`'s equivalent each move on
 * their own release cadence, independently of this one, since shipping a new SDK release carries
 * no wire change most of the time. This is the number a host and a worker exchange at the
 * handshake to answer one question only, whether they speak the same contract.
 */
export const PROTOCOL_VERSION = "1.0.0";

/** `version`'s own major component, the part {@link speaksSameContract} compares. */
export function majorOf(version: string): string {
  return version.split(".")[0] ?? "";
}

/** Whether `hostProtocolVersion` and this side's own {@link PROTOCOL_VERSION} share a major version. */
export function speaksSameContract(hostProtocolVersion: string): boolean {
  return majorOf(hostProtocolVersion) === majorOf(PROTOCOL_VERSION);
}
