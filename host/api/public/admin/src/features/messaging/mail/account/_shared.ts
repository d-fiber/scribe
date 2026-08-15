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

import type { SmtpAccount } from "@scribe/host/dependencies/features/messagings/mail/mail.ts";
import { SmtpAccountError } from "@scribe/host/dependencies/features/messagings/mail/mail.ts";
import { AdminMailEndpoint } from "../_shared.ts";

export { AdminMailEndpoint, objectOrNull, READ_RATE_LIMIT, trimmedOrNull, WRITE_RATE_LIMIT } from "../_shared.ts";

export const NAME_PATTERN = /^[a-z0-9._-]{1,64}$/;
export const MAX_PORT = 65535;

export function payload(account: SmtpAccount) {
  return {
    name: account.name,
    host: account.host,
    port: account.port,
    username: account.username,
    is_configured: account.isConfigured,
    is_active: account.isActive,
    created_at: account.createdAt,
    updated_at: account.updatedAt,
  };
}

export abstract class AdminSmtpAccountEndpoint extends AdminMailEndpoint {
  protected invalidName(): Response {
    return this.invalidField("name", "at most 64 characters of [a-z0-9._-]");
  }

  protected failure(error: SmtpAccountError): Response {
    if (error === SmtpAccountError.NotFound) return this.response.notFound();

    if (error === SmtpAccountError.Reserved) {
      return this.response.forbidden({
        code: "reserved_account",
        message: "The `account` and `noreply` accounts are part of the foundation and cannot be deleted.",
      });
    }

    if (error === SmtpAccountError.InUse) {
      return this.response.conflict({
        code: "account_in_use",
        message: "This account still has sent mails attached to it and cannot be deleted.",
      });
    }

    return this.response.unexpected();
  }
}

export abstract class AdminSmtpAccountNameEndpoint extends AdminSmtpAccountEndpoint {
  protected readonly name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }

  protected validName(): boolean {
    return NAME_PATTERN.test(this.name);
  }
}
