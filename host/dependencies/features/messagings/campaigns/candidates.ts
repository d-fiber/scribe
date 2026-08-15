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

import { rest } from "@scribe/host/dependencies/database/rest/rest.ts";
import { type CampaignCandidate, type CampaignFilters, isSet } from "./filters.ts";

const PAGE_SIZE = 1000;

export interface UserCandidateRow {
  readonly userId: string;
  readonly email: string | null;
  readonly candidate: CampaignCandidate;
}

export interface AdminCandidateRow {
  readonly adminId: string;
  readonly email: string;
  readonly candidate: CampaignCandidate;
}

function neededRelations(filters: CampaignFilters) {
  return {
    devices: isSet(filters.deviceOs) ||
      isSet(filters.appVersion) ||
      isSet(filters.appVersionMin) ||
      isSet(filters.appVersionMax) ||
      isSet(filters.country),
    settings: isSet(filters.localization),
  };
}

export async function fetchUserCandidates(
  filters: CampaignFilters,
): Promise<UserCandidateRow[]> {
  const needs = neededRelations(filters);
  const results: UserCandidateRow[] = [];

  for (let offset = 0;; offset += PAGE_SIZE) {
    const page = await rest
      .internal_t__app_users()
      .select((s) => ({
        user_id: s.user_id,
        email: s.email,
        is_email_verified: s.is_email_verified,
        is_phone_verified: s.is_phone_verified,
        created_at: s.created_at,
        ...(needs.devices && {
          app_user_devices: s.embed("internal_t__app_user_devices", (d) => ({
            os: d.os,
            app_version: d.app_version,
            country: d.country,
          })),
        }),
        ...(needs.settings && {
          app_user_settings: s.embed("internal_t__app_user_settings", (st) => ({
            localization: st.localization,
          })),
        }),
      }))
      .range(offset, offset + PAGE_SIZE - 1)
      .get();

    for (const row of page) {
      results.push({
        userId: row.user_id,
        email: row.email,
        candidate: {
          devices: (row.app_user_devices ?? []).map((d) => ({
            os: d.os,
            appVersion: d.app_version,
            country: d.country,
          })),
          localization: row.app_user_settings?.localization ?? null,
          isEmailVerified: row.is_email_verified,
          isPhoneVerified: row.is_phone_verified,
          createdAt: row.created_at,
        },
      });
    }

    if (page.length < PAGE_SIZE) break;
  }

  return results;
}

export async function fetchAdminCandidates(
  filters: CampaignFilters,
): Promise<AdminCandidateRow[]> {
  const needs = neededRelations(filters);
  const results: AdminCandidateRow[] = [];

  for (let offset = 0;; offset += PAGE_SIZE) {
    const page = await rest
      .internal_t__admin_users()
      .select((s) => ({
        admin_id: s.admin_id,
        email: s.email,
        is_email_verified: s.is_email_verified,
        is_phone_verified: s.is_phone_verified,
        created_at: s.created_at,
        ...(needs.devices && {
          admin_users_devices: s.embed("internal_t__admin_users_devices", (d) => ({
            os: d.os,
            app_version: d.app_version,
            country: d.country,
          })),
        }),
        ...(needs.settings && {
          admin_users_settings: s.embed("internal_t__admin_users_settings", (st) => ({
            localization: st.localization,
          })),
        }),
      }))
      .range(offset, offset + PAGE_SIZE - 1)
      .get();

    for (const row of page) {
      results.push({
        adminId: row.admin_id,
        email: row.email,
        candidate: {
          devices: (row.admin_users_devices ?? []).map((d) => ({
            os: d.os,
            appVersion: d.app_version,
            country: d.country,
          })),
          localization: row.admin_users_settings?.localization ?? null,
          isEmailVerified: row.is_email_verified,
          isPhoneVerified: row.is_phone_verified,
          createdAt: row.created_at,
        },
      });
    }

    if (page.length < PAGE_SIZE) break;
  }

  return results;
}

interface LastSignInRow {
  readonly id: string;
  readonly last_sign_in_at: string | null;
}

export async function fetchLastSignInAt(
  ids: readonly string[],
): Promise<Map<string, number | null>> {
  const result = new Map<string, number | null>();
  if (ids.length === 0) return result;

  const { data, error } = await rest.rpc<LastSignInRow>(
    "get_last_sign_in_at",
    { p_ids: ids },
  );
  if (error) {
    console.error("[fetchLastSignInAt]", error);
    return result;
  }

  for (const row of (data ?? []) as LastSignInRow[]) {
    result.set(
      row.id,
      row.last_sign_in_at ? new Date(row.last_sign_in_at).getTime() : null,
    );
  }
  return result;
}
