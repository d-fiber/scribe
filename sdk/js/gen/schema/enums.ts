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
