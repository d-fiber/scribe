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

// This file is auto-generated do not edit manually.
// Run: poppin gen code

export function enumValues<T extends object>(e: T): T[keyof T][] {
  return Object.values(e) as T[keyof T][];
}

export enum AvatarType {
  PHOTO = "photo",
  TEXT = "text",
  PLACEHOLDER = "placeholder",
}

export enum CampaignAudience {
  USER = "user",
  ADMIN = "admin",
}

export enum ClientType {
  APP = "app",
  WEB = "web",
  SOFT = "soft",
}

export enum DeviceCategory {
  PHONE = "phone",
  TABLET = "tablet",
  DESKTOP = "desktop",
  UNKNOWN = "unknown",
}

export enum DeviceOs {
  ANDROID = "android",
  IOS = "ios",
  LINUX = "linux",
  MACOS = "macos",
  WINDOWS = "windows",
  UNKNOWN = "unknown",
}

export enum DeviceThemeMode {
  SYSTEM = "system",
  LIGHT = "light",
  DARK = "dark",
}

export enum FeedbackType {
  VERY_SATISFIED = "very_satisfied",
  SLIGHTLY_SATISFIED = "slightly_satisfied",
  NEUTRAL = "neutral",
  SLIGHTLY_DISSATISFIED = "slightly_dissatisfied",
  VERY_DISSATISFIED = "very_dissatisfied",
}

export enum Gender {
  MALE = "male",
  FEMALE = "female",
  PREFER_NOT_TO_SAY = "prefer_not_to_say",
}

export enum Localization {
  ENGLISH = "english",
  FRENCH = "french",
}

export enum RemoteConfigAudience {
  PUBLIC = "public",
  AUTHENTICATED = "authenticated",
  USER = "user",
  ADMIN = "admin",
}

export enum SocialProvider {
  GOOGLE = "google",
  APPLE = "apple",
}
