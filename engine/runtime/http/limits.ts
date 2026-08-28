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
 * The largest body this process will hold, whatever a caller declares.
 *
 * @remarks
 * It is a backstop and not the limit a project sets: what a node accepts is
 * `api.nodes.<name>.max_body_mb` in `config.yaml`, and the gateway answers 413
 * to a bigger one before the request reaches this process. This number only has
 * to sit above the largest a node may name, so the two never disagree and a
 * project reading its own manifest is not refused by something it cannot see.
 *
 * A body that reaches here past the gateway came from somewhere else: an
 * internal call, or a test.
 */
export const MAX_BODY_BYTES = 100 * 1024 * 1024;

/**
 * What a body is reserved at when the caller declares no length.
 *
 * @remarks
 * A chunked request names no size, and reserving {@link MAX_BODY_BYTES} for
 * each would spend the whole inflight budget on the first one. This is the
 * guess taken instead: small enough that a flood of them is survivable, large
 * enough that an ordinary payload fits without a second look.
 */
export const UNDECLARED_BODY_BYTES = 65_536;
