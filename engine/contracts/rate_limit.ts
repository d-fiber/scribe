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

import { Duration } from "@scribe/alchemy";

/**
 * How long a limit keyed on a network address may hold a caller out.
 *
 * @remarks
 * A university, an office and a mobile carrier all put thousands of people behind one address, so
 * a bucket keyed on it punishes everyone for what one caller did. Fifteen minutes is long enough
 * to stop a script and short enough that a shared connection recovers on its own.
 *
 * It is a value to pass, not a rule anything applies on its own: only the code that built the key
 * knows whether it named an account or an address.
 *
 * It lives here rather than beside the limiter that reads it because the endpoint that passes it
 * is a layer of the framework, and a layer does not reach into a package for a number.
 */
export const SHARED_ADDRESS_MAX_PENALTY: Duration = Duration.minutes(15);

/**
 * How long a limit keyed on a network address should remember its strikes.
 *
 * Kept short for the same reason as {@link SHARED_ADDRESS_MAX_PENALTY}: a strike count that
 * survives a day would make the second visitor of the day pay for the first.
 */
export const SHARED_ADDRESS_STRIKE_MEMORY: Duration = Duration.hours(1);
