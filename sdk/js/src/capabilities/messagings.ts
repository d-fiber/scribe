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

import { Messagings } from "../../gen/scribe/engine/dependencies/features/messagings/protocol/messagings_pb.ts";
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
