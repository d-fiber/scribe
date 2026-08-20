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

import { vpn, VpnError } from "./client.ts";
import { PendingToken, PendingTokenPurpose } from "@scribe/auth/src/pending_token.ts";
import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import { Env } from "@scribe/host/env.ts";

export enum VpnAccessError {
  InvalidOrExpiredToken = "invalid_or_expired_token",
  Unexpected = "unexpected",
}

export interface VpnConfiguration {
  readonly filename: string;
  readonly content: string;
}

export type VpnConfigurationResult = Result<VpnConfiguration, VpnAccessError>;

const _token = new PendingToken(PendingTokenPurpose.VpnAccess);

function _filenameFor(
  firstName: string | null,
  lastName: string | null,
): string {
  if (!firstName || !lastName) return "vpn.conf";

  const sanitize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase();

  return `${sanitize(firstName)}-${sanitize(lastName)}-vpn.conf`;
}

export class VpnAccessLink {
  static get ttlMs(): number {
    return _token.ttlMs;
  }

  static async issue(adminId: string): Promise<string | null> {
    const token = await _token.issue(adminId, "admin", null);
    if (!token) return null;

    return `${Env.SUPABASE_URL}/functions/v1/hosting/vpn#token=${
      encodeURIComponent(
        token,
      )
    }`;
  }

  static async redeem(
    token: string,
    identity: { firstName: string | null; lastName: string | null },
  ): Promise<VpnConfigurationResult> {
    const payload = await _token.payload(token.trim());
    if (!payload || payload.role !== "admin") {
      return new Failure(VpnAccessError.InvalidOrExpiredToken);
    }

    if (!(await _token.consume(token.trim()))) {
      return new Failure(VpnAccessError.InvalidOrExpiredToken);
    }

    const peer = await vpn.getByOwner(payload.identifier);
    if (!peer.ok) {
      return new Failure(
        peer.error === VpnError.NotFound ? VpnAccessError.InvalidOrExpiredToken : VpnAccessError.Unexpected,
      );
    }

    const configuration = await vpn.configuration(peer.data.id);
    if (!configuration.ok) return new Failure(VpnAccessError.Unexpected);

    return new OK({
      filename: _filenameFor(identity.firstName, identity.lastName),
      content: configuration.data,
    });
  }

  static async ownerOf(token: string): Promise<string | null> {
    const trimmed = token.trim();
    const payload = await _token.payload(trimmed);
    if (!payload || payload.role !== "admin") return null;
    if (!(await _token.exists(trimmed))) return null;
    return payload.identifier;
  }
}
