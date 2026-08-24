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

/** What a caller has told about how it reads and writes. */
export interface Localization {
  /** The language it asks to be answered in, as a two letter code. */
  readonly language: string;

  /** The region its formats follow, as a two letter code. */
  readonly region: string;

  /** The zone its times are told in, as a name of the zone database. */
  readonly timezone: string;
}

/**
 * The device a call came from, as it described itself.
 *
 * @remarks
 * Every field is what the caller said, not what anything checked, and a caller that lies about any
 * of them is not caught here. It is worth reading for what it enables, a build a feature is held
 * back from or a push sent to the right handset, and never for a decision that has to hold.
 *
 * It is a shape of plain data. The protocol carries its own message of the same thing, and turning
 * one into the other happens where the protocol is spoken.
 */
export interface RequestDevice {
  /** What the caller calls this device, kept across launches of the application. */
  readonly deviceId: string;

  /** Which application is calling, by name. */
  readonly client: string;

  /** Which operating system it runs, by name and version. */
  readonly os: string;

  /** Which model of hardware, as the platform reports it. */
  readonly model: string;

  /** Which build of the application is calling. */
  readonly appVersion: string;

  /** Whether this is a real handset rather than a simulator. */
  readonly isPhysicalDevice: boolean;

  /** What kind of device it is, such as a phone or a tablet. */
  readonly deviceCategory: string;

  /** Where a push notification reaches this device, when it accepted them. */
  readonly notificationToken: string;

  /** What this device holds to prove it is the same one across calls. */
  readonly deviceToken: string;

  /** What it asks to be answered in. */
  readonly localization: Localization;

  /** Whether it is asking for the light or the dark rendering. */
  readonly themeMode: string;

  /** What binds this device to a session, when one has been opened. */
  readonly binding: string;

  /** When the device payload was written, in milliseconds since the epoch. */
  readonly iat: number;

  /** What makes this payload usable once and no more. */
  readonly nonce: string;
}
