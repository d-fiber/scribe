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

import type { DeviceOs, Localization } from "@scribe/core/contracts/enums.ts";

export interface CampaignFilters {
  readonly deviceOs?: DeviceOs | null;
  readonly appVersion?: string | null;
  readonly appVersionMin?: string | null;
  readonly appVersionMax?: string | null;
  readonly country?: string | null;
  readonly localization?: Localization | null;
  readonly isEmailVerified?: boolean | null;
  readonly isPhoneVerified?: boolean | null;
  readonly createdAfter?: number | null;
  readonly createdBefore?: number | null;
  readonly inactiveDays?: number | null;
}

export function isSet<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export interface CampaignDeviceCandidate {
  readonly os: DeviceOs;
  readonly appVersion: string | null;
  readonly country: string;
}

export interface CampaignCandidate {
  readonly devices: readonly CampaignDeviceCandidate[];
  readonly localization: Localization | null;
  readonly isEmailVerified: boolean;
  readonly isPhoneVerified: boolean;
  readonly createdAt: number;
  readonly lastSignInAt?: number | null;
}

function parseVersion(version: string): [number, number, number] {
  const parts = version.split("+")[0].split(".");
  const result: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < Math.min(parts.length, 3); i++) {
    const n = parseInt(parts[i].replace(/\D.*$/, ""), 10);
    result[i] = Number.isNaN(n) ? 0 : n;
  }
  return result;
}

export function compareSemver(a: string, b: string): number {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  for (let i = 0; i < 3; i++) {
    if (va[i] !== vb[i]) return va[i] - vb[i];
  }
  return 0;
}

export function matchesDeviceFilters(
  devices: readonly CampaignDeviceCandidate[],
  filters: CampaignFilters,
): boolean {
  const hasDeviceFilter =
    isSet(filters.deviceOs) ||
    isSet(filters.appVersion) ||
    isSet(filters.appVersionMin) ||
    isSet(filters.appVersionMax) ||
    isSet(filters.country);
  if (!hasDeviceFilter) return true;

  return devices.some((device) => {
    if (isSet(filters.deviceOs) && device.os !== filters.deviceOs) {
      return false;
    }
    if (isSet(filters.appVersion) && device.appVersion !== filters.appVersion) {
      return false;
    }
    if (isSet(filters.appVersionMin)) {
      if (device.appVersion === null) return false;
      if (compareSemver(device.appVersion, filters.appVersionMin) < 0) {
        return false;
      }
    }
    if (isSet(filters.appVersionMax)) {
      if (device.appVersion === null) return false;
      if (compareSemver(device.appVersion, filters.appVersionMax) > 0) {
        return false;
      }
    }
    if (isSet(filters.country) && device.country !== filters.country) {
      return false;
    }
    return true;
  });
}

export function matchesGenericFilters(
  candidate: CampaignCandidate,
  filters: CampaignFilters,
): boolean {
  if (
    isSet(filters.localization) &&
    candidate.localization !== filters.localization
  ) {
    return false;
  }
  if (
    isSet(filters.isEmailVerified) &&
    candidate.isEmailVerified !== filters.isEmailVerified
  ) {
    return false;
  }
  if (
    isSet(filters.isPhoneVerified) &&
    candidate.isPhoneVerified !== filters.isPhoneVerified
  ) {
    return false;
  }
  if (
    isSet(filters.createdAfter) &&
    candidate.createdAt < filters.createdAfter
  ) {
    return false;
  }
  if (
    isSet(filters.createdBefore) &&
    candidate.createdAt > filters.createdBefore
  ) {
    return false;
  }
  if (isSet(filters.inactiveDays)) {
    const cutoff = Date.now() - filters.inactiveDays * 24 * 60 * 60 * 1000;
    const lastSignInAt = candidate.lastSignInAt;
    const isInactive = lastSignInAt == null || lastSignInAt <= cutoff;
    if (!isInactive) return false;
  }
  return true;
}

export function matchesCampaignFilters(
  candidate: CampaignCandidate,
  filters: CampaignFilters,
): boolean {
  return (
    matchesDeviceFilters(candidate.devices, filters) &&
    matchesGenericFilters(candidate, filters)
  );
}

export function parseCampaignFilters(
  raw: Record<string, unknown> | null,
): CampaignFilters {
  if (!raw) return {};
  return {
    deviceOs: raw.device_os as CampaignFilters["deviceOs"],
    appVersion: raw.app_version as CampaignFilters["appVersion"],
    appVersionMin: raw.app_version_min as CampaignFilters["appVersionMin"],
    appVersionMax: raw.app_version_max as CampaignFilters["appVersionMax"],
    country: raw.country as CampaignFilters["country"],
    localization: raw.localization as CampaignFilters["localization"],
    isEmailVerified:
      raw.is_email_verified as CampaignFilters["isEmailVerified"],
    isPhoneVerified:
      raw.is_phone_verified as CampaignFilters["isPhoneVerified"],
    createdAfter: raw.created_after as CampaignFilters["createdAfter"],
    createdBefore: raw.created_before as CampaignFilters["createdBefore"],
    inactiveDays: raw.inactive_days as CampaignFilters["inactiveDays"],
  };
}
