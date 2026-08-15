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

import { Messagings } from "../../gen/scribe/host/dependencies/features/messagings/protocol/messagings_pb.ts";
import { encodeJson } from "../contracts/json.ts";
import { host } from "./channel.ts";
import { raiseOn } from "./error.ts";

const CAPABILITY = "messagings";

export interface Recipient {
  readonly address: string;
  readonly name?: string;
}

export interface MailInput {
  readonly account?: string;
  readonly to: readonly Recipient[];
  readonly cc?: readonly Recipient[];
  readonly bcc?: readonly Recipient[];
  readonly subject: string;
  readonly template?: string;
  readonly templateData?: unknown;
  readonly html?: string;
  readonly text?: string;
}

export interface SmsInput {
  readonly to: string;
  readonly template?: string;
  readonly templateData?: unknown;
  readonly body?: string;
}

export interface PushInput {
  readonly tokens?: readonly string[];
  readonly userIds?: readonly string[];
  readonly template?: string;
  readonly templateData?: unknown;
  readonly title?: string;
  readonly body?: string;
  readonly data?: unknown;
}

function recipients(list: readonly Recipient[] = []) {
  return list.map((entry) => ({ address: entry.address, name: entry.name ?? "" }));
}

export const messagings = {
  async sendMail(input: MailInput): Promise<string> {
    const result = await host.client().call(Messagings.method.sendMail, {
      account: input.account ?? "",
      to: recipients(input.to),
      cc: recipients(input.cc),
      bcc: recipients(input.bcc),
      subject: input.subject,
      template: input.template ?? "",
      templateData: encodeJson(input.templateData ?? {}),
      html: input.html ?? "",
      text: input.text ?? "",
    });
    raiseOn(CAPABILITY, result.error);
    return result.messageId;
  },

  async sendSms(input: SmsInput): Promise<string> {
    const result = await host.client().call(Messagings.method.sendSms, {
      to: input.to,
      template: input.template ?? "",
      templateData: encodeJson(input.templateData ?? {}),
      body: input.body ?? "",
    });
    raiseOn(CAPABILITY, result.error);
    return result.messageId;
  },

  async sendPush(input: PushInput): Promise<{ sent: number; failed: number }> {
    const result = await host.client().call(Messagings.method.sendPush, {
      tokens: [...(input.tokens ?? [])],
      userIds: [...(input.userIds ?? [])],
      template: input.template ?? "",
      templateData: encodeJson(input.templateData ?? {}),
      title: input.title ?? "",
      body: input.body ?? "",
      data: encodeJson(input.data ?? {}),
    });
    raiseOn(CAPABILITY, result.error);
    return { sent: result.sent, failed: result.failed };
  },
};
