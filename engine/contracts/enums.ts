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
 * The values a string enum declares, in declaration order.
 *
 * Useful to check that a value received from a caller is one the enum admits, since
 * TypeScript erases the enum type at runtime and leaves only the object.
 */
export function enumValues<T extends object>(e: T): T[keyof T][] {
  return Object.values(e) as T[keyof T][];
}

/** The kind of program a call comes from. */
export enum ClientType {
  /** A native mobile or desktop application. */
  APP = "app",

  /** A page loaded in a browser. */
  WEB = "web",

  /** A program that runs without someone watching it, such as a job or a service. */
  SOFT = "soft",
}

/** The form factor a device reports for itself. */
export enum DeviceCategory {
  /** A handset. */
  PHONE = "phone",

  /** A tablet. */
  TABLET = "tablet",

  /** A laptop or a desktop machine. */
  DESKTOP = "desktop",

  /** The device sent nothing the framework recognises. */
  UNKNOWN = "unknown",
}

/** The operating system a device runs. */
export enum DeviceOs {
  /** Android. */
  ANDROID = "android",

  /** iOS and iPadOS. */
  IOS = "ios",

  /** A Linux distribution. */
  LINUX = "linux",

  /** macOS. */
  MACOS = "macos",

  /** Windows. */
  WINDOWS = "windows",

  /** The device sent nothing the framework recognises. */
  UNKNOWN = "unknown",
}

/** The colour scheme a device asks the interface to use. */
export enum DeviceThemeMode {
  /** Whatever the operating system is set to. */
  SYSTEM = "system",

  /** The light scheme, whatever the operating system is set to. */
  LIGHT = "light",

  /** The dark scheme, whatever the operating system is set to. */
  DARK = "dark",
}

/** The language a device asks to be answered in. */
export enum Localization {
  /** English. */
  ENGLISH = "english",

  /** French. */
  FRENCH = "french",
}

/** An identity provider a caller can sign in or sign up through. */
export enum SocialProvider {
  /** Google, reached with a Google identity token. */
  GOOGLE = "google",

  /** Apple, reached with an Apple identity token. */
  APPLE = "apple",
}
