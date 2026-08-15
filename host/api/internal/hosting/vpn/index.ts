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
import { VpnAccessError, VpnAccessLink } from "@scribe/host/dependencies/security/vpn/mod.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { serve } from "@scribe/core/kernel/http/serve/mod.ts";
import { rateLimiter } from "@scribe/core/runtime/redis/rate_limiter/mod.ts";
import { request } from "@scribe/core/runtime/http/request.ts";
import { HOSTING_FORM_FIELDS, VpnOutcome } from "../_contract.ts";
import { vpnDownload, vpnStatus } from "../_page.ts";

function submittedForm(): URLSearchParams {
  const bytes = request.bytes();
  return new URLSearchParams(bytes ? new TextDecoder().decode(bytes) : "");
}

function expired(): Response {
  return vpnStatus(VpnOutcome.InvalidLink);
}

async function profileOf(
  adminId: string,
): Promise<{ firstName: string | null; lastName: string | null }> {
  const profile = await rest
    .internal_t__admin_users_profiles()
    .select((s) => ({ first_name: s.first_name, last_name: s.last_name }))
    .where((f) => f.admin_id.eq(adminId))
    .getOne();

  return {
    firstName: profile?.first_name ?? null,
    lastName: profile?.last_name ?? null,
  };
}

function attachment(filename: string, content: string): Response {
  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

serve(async () => {
  const rate = await rateLimiter.check({
    key: "html:vpn:download",
    limit: 10,
    window: Time.minutes(15),
    penalty: Time.minutes(15),
    maxPenalty: Time.hours(1),
    failOpen: false,
  });
  if (!rate.ok) {
    return vpnStatus(VpnOutcome.TooManyAttempts);
  }

  if (request.method() === "GET") return vpnDownload();

  if (request.method() !== "POST") return expired();

  const token = submittedForm().get(HOSTING_FORM_FIELDS.token) ?? "";
  if (!token) return expired();

  const adminId = await VpnAccessLink.ownerOf(token);
  if (adminId === null) return expired();

  const result = await VpnAccessLink.redeem(token, await profileOf(adminId));

  if (!result.ok) {
    if (result.error === VpnAccessError.InvalidOrExpiredToken) return expired();

    return vpnStatus(VpnOutcome.DownloadFailed);
  }

  return attachment(result.data.filename, result.data.content);
});
