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

import type { Future } from "../../async/future.ts";
import { json } from "../../value/convert.ts";
import type { UnmodifiableList } from "../../value/list.ts";
import { parseBodyBytes, parseFormBytes } from "../body/parse.ts";
import type { BodySchema, FormSchema } from "../body/field_types.ts";
import type { BodyFromSchema, FormFromSchema } from "../body/inference.ts";
import type { Caller } from "./access.ts";
import type { RequestDevice } from "./device.ts";

/** Who made a call, once the framework has worked it out. */
export interface RequestUser {
  /** What identifies them, and what an owned row is keyed on. */
  readonly id: string;

  /** How this call was proved. */
  readonly caller: Caller;

  /**
   * What this deployment calls them, in one word, or empty when it calls them nothing.
   *
   * @remarks
   * It is an open string and not a list of names, because who a deployment has is not something
   * this layer can enumerate: an author, a moderator, a support agent, a tenant owner. Nothing
   * here reads it. What reads it is the deployment, which is the only side that knows what the
   * word means.
   */
  readonly role: string;

  /** What they are allowed to do beyond what the role already says. */
  readonly permissions: UnmodifiableList<string>;

  /**
   * Everything else whatever proved this call asserted about them, as it arrived.
   *
   * @remarks
   * An address, a telephone number, a tenant, a plan, whether a factor was verified: which of
   * those exist and which of them matter is a fact about a deployment. Naming any of them here
   * would make one of them the way an account is reached and the rest an afterthought, so none
   * of them is named and all of them are carried.
   */
  readonly claims: Readonly<Record<string, unknown>>;
}

/** Where a call came from, as an address was resolved. */
export interface IpLocation {
  /** The city the address resolved to, empty when it resolved to none. */
  readonly city: string;

  /** The country the address resolved to, empty when it resolved to none. */
  readonly country: string;
}

/**
 * One call, as plain data.
 *
 * @remarks
 * It is what the framework builds from whatever carried the call, and what
 * {@link RequestContext} is written over. Nothing here knows about a wire: the protocol has its
 * own message for this, and turning one into the other happens where the protocol is spoken.
 *
 * That separation is the whole point. An endpoint reads a context and never a message, so the
 * protocol may gain a field, change a name or be replaced without a single endpoint being touched.
 */
export interface Invoked {
  /** What names this call, and what a log line carries to be found again. */
  readonly invocationId: string;

  /** What names the whole exchange this call belongs to, across every service it touched. */
  readonly traceId: string;

  /** Who made it, or null when nobody said. */
  readonly user: RequestUser | null;

  /** Which verb, in upper case. */
  readonly method: string;

  /** The path as it was asked for. */
  readonly path: string;

  /** The address it came from. */
  readonly ip: string;

  /** What the caller says it is. */
  readonly userAgent: string;

  /** What session it belongs to, or null when it belongs to none. */
  readonly sessionId: string | null;

  /** What the path itself carried, by name. */
  readonly pathParams: Readonly<Record<string, string>>;

  /** What the query carried, by name. */
  readonly query: Readonly<Record<string, string>>;

  /** What the headers carried, by name, already in lower case. */
  readonly headers: Readonly<Record<string, string>>;

  /** The body as it arrived, or null when there was none. */
  readonly body: Uint8Array | null;

  /** The device it came from, or null when it did not say. */
  readonly device: RequestDevice | null;

  /** Where it came from, or null when nothing resolved the address. */
  readonly location: IpLocation | null;
}

/** What an unresolved address answers, so a caller never has to check for null. */
const NOWHERE: IpLocation = { city: "", country: "" };

/**
 * What an endpoint is handed, and the only thing it reads a call through.
 *
 * @remarks
 * Every member answers something already worked out. Nothing is parsed twice, nothing raises, and
 * what is absent is null rather than missing, so an endpoint reads a call in straight lines.
 *
 * @example
 * ```ts ignore
 * protected override async run(ctx: RequestContext): Future<Response> {
 *   if (!ctx.id) return this.response.unauthorized();
 *
 *   const body = ctx.body({ brand_id: Required(string) });
 *   if (!body) return this.response.badRequest();
 *
 *   return this.response.ok();
 * }
 * ```
 */
export class RequestContext {
  /** The call, as plain data. An endpoint rarely reads it: the members below are what it is for. */
  readonly invoked: Invoked;

  constructor(invoked: Invoked) {
    this.invoked = invoked;
  }

  /** Who made this call, or null when nobody said. */
  get user(): RequestUser | null {
    return this.invoked.user;
  }

  /**
   * What identifies whoever made this call, or null when nobody said.
   *
   * It is the first line of almost every endpoint, which is why it is a member of its own rather
   * than a walk through {@link user}.
   */
  get id(): string | null {
    return this.invoked.user?.id ?? null;
  }

  /** What names this call. */
  get invocationId(): string {
    return this.invoked.invocationId;
  }

  /** What names the whole exchange this call belongs to. */
  get traceId(): string {
    return this.invoked.traceId;
  }

  /** Which verb, in upper case. */
  get method(): string {
    return this.invoked.method;
  }

  /** The path as it was asked for. */
  get path(): string {
    return this.invoked.path;
  }

  /** The address this call came from. */
  get ip(): string {
    return this.invoked.ip;
  }

  /** What the caller says it is. */
  get userAgent(): string {
    return this.invoked.userAgent;
  }

  /** What session this call belongs to, or null when it belongs to none. */
  get sessionId(): string | null {
    return this.invoked.sessionId;
  }

  /** Everything the path itself carried, by name. */
  get pathParams(): Readonly<Record<string, string>> {
    return this.invoked.pathParams;
  }

  /** What the path carried under `name`, or null when it carried nothing. */
  param(name: string): string | null {
    return this.invoked.pathParams[name] ?? null;
  }

  /** What the query carried under `key`, or null when it carried nothing. */
  query(key: string): string | null {
    return this.invoked.query[key] ?? null;
  }

  /** What the headers carried under `name`, whatever case it was written in. */
  header(name: string): string | null {
    return this.invoked.headers[name.toLowerCase()] ?? null;
  }

  /**
   * The body read against `schema`.
   *
   * @returns What the shape asked for, or null when the body is not JSON or a mandatory field is
   * missing. The two are not told apart, because an endpoint does the same thing about either.
   */
  body<S extends BodySchema>(schema: S): BodyFromSchema<S> | null {
    return parseBodyBytes(schema, this.invoked.body);
  }

  /** The body read against `schema` as a form, which is what carries a file. */
  form<S extends FormSchema>(schema: S): Future<FormFromSchema<S> | null> {
    return parseFormBytes(schema, this.invoked.body, this.header("content-type") ?? "");
  }

  /**
   * The body as whatever JSON it spells, unchecked.
   *
   * @remarks
   * It answers null rather than raising on a body that is not JSON. It is for the rare shape a
   * schema cannot describe, and an endpoint that reaches for it is one nothing checks.
   */
  raw(): unknown | null {
    const body = this.invoked.body;
    if (body === null || body.byteLength === 0) return null;

    try {
      return json.decode(new TextDecoder().decode(body));
    } catch {
      return null;
    }
  }

  /** The device this call came from, or null when it did not say. */
  device(): RequestDevice | null {
    return this.invoked.device;
  }

  /** Where this call came from. It answers empty rather than null when nothing resolved it. */
  location(): IpLocation {
    return this.invoked.location ?? NOWHERE;
  }
}
