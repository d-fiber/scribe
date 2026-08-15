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

import { DeviceOs } from "@scribe/core/contracts/enums.ts";

const CRAWLER_PATTERN =
  /bot|crawler|spider|facebookexternalhit|whatsapp|telegram|slack|discord|linkedinbot|embedly|quora|pinterest|skypeuripreview|vkshare|preview|curl|wget|headless|lighthouse|monitoring/i;

const IOS_PATTERN = /iphone|ipad|ipod|ios/i;
const ANDROID_PATTERN = /android/i;
const MACOS_PATTERN = /macintosh|mac os x/i;
const WINDOWS_PATTERN = /windows/i;
const LINUX_PATTERN = /linux|x11/i;

export function isCrawler(userAgent: string): boolean {
  return userAgent.length === 0 || CRAWLER_PATTERN.test(userAgent);
}

export function platformOf(userAgent: string): DeviceOs {
  if (ANDROID_PATTERN.test(userAgent)) return DeviceOs.ANDROID;
  if (IOS_PATTERN.test(userAgent)) return DeviceOs.IOS;
  if (MACOS_PATTERN.test(userAgent)) return DeviceOs.MACOS;
  if (WINDOWS_PATTERN.test(userAgent)) return DeviceOs.WINDOWS;
  if (LINUX_PATTERN.test(userAgent)) return DeviceOs.LINUX;
  return DeviceOs.UNKNOWN;
}
