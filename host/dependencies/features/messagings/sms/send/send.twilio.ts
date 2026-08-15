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

import { Env } from "@scribe/host/env.ts";
import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import type { SmsContent } from "../entities.ts";
import { SmsError, type SmsSenderService } from "./send.ts";

function isConfigured(): boolean {
  return Boolean(
    Env.TWILIO_ACCOUNT_SID && Env.TWILIO_AUTH_TOKEN && Env.TWILIO_MESSAGE_SERVICE_SID,
  );
}

export class SmsSenderTwilio implements SmsSenderService {
  async send(to: string, content: SmsContent): Promise<Result<void, SmsError>> {
    if (!isConfigured()) return new Failure(SmsError.NotConfigured);
    if (to.trim().length === 0) return new Failure(SmsError.InvalidPhone);

    const accountSid = Env.TWILIO_ACCOUNT_SID as string;
    const authToken = Env.TWILIO_AUTH_TOKEN as string;
    const messagingServiceSid = Env.TWILIO_MESSAGE_SERVICE_SID as string;

    const body = new URLSearchParams({
      To: to,
      MessagingServiceSid: messagingServiceSid,
      Body: content.text,
    });

    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          },
          body,
        },
      );
      if (!res.ok) return new Failure(SmsError.SendFailed);
      return new OK();
    } catch {
      return new Failure(SmsError.SendFailed);
    }
  }
}
