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

import { database } from "@scribe/foundation/lib/src/database/database.ts";
import { Failure, Ok, okay, type Result } from "@scribe/alchemy";
import { Repository } from "./core/repository.ts";

export const FOUNDATION_SMTP_ACCOUNTS = {
  account: "account",
  noreply: "noreply",
} as const;

export interface SmtpAccountCredentials {
  readonly name: string;
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
}

export interface SmtpAccount {
  readonly name: string;
  readonly host: string | null;
  readonly port: number | null;
  readonly username: string | null;
  readonly isConfigured: boolean;
  readonly isActive: boolean;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface UpsertSmtpAccountInput {
  readonly name: string;
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
}

export enum SmtpAccountError {
  NotFound = "not_found",
  Incomplete = "incomplete",
  Reserved = "reserved",
  InUse = "in_use",
  Backend = "backend",
}

export interface SmtpAccountService {
  credentials(
    name: string,
  ): Promise<Result<SmtpAccountCredentials, SmtpAccountError>>;
  list(): Promise<Result<SmtpAccount[], SmtpAccountError>>;
  get(name: string): Promise<Result<SmtpAccount, SmtpAccountError>>;
  upsert(
    input: UpsertSmtpAccountInput,
  ): Promise<Result<SmtpAccount, SmtpAccountError>>;
  setActive(
    name: string,
    isActive: boolean,
  ): Promise<Result<void, SmtpAccountError>>;
  clearCredentials(name: string): Promise<Result<void, SmtpAccountError>>;
  remove(name: string): Promise<Result<void, SmtpAccountError>>;
}

interface CredentialsRow {
  name: string;
  host: string | null;
  port: number | null;
  username: string | null;
  password: string | null;
}

interface SummaryRow {
  name: string;
  host: string | null;
  port: number | null;
  username: string | null;
  is_configured: boolean;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

type DeleteOutcome = "deleted" | "not_found" | "in_use" | "reserved";

const DELETE_FAILURES: Record<string, SmtpAccountError> = {
  not_found: SmtpAccountError.NotFound,
  in_use: SmtpAccountError.InUse,
  reserved: SmtpAccountError.Reserved,
};

export class SmtpAccountRepository
  extends Repository<SmtpAccountError>
  implements SmtpAccountService
{
  protected override get backendError(): SmtpAccountError {
    return SmtpAccountError.Backend;
  }

  credentials(
    name: string,
  ): Promise<Result<SmtpAccountCredentials, SmtpAccountError>> {
    return this.guard(async () => {
      const { data, error } = await database.rpc<CredentialsRow[]>(
        "smtp_account_credentials",
        { p_name: name },
      );
      if (error) throw error;

      const row = (data ?? [])[0];
      if (!row) return new Failure(SmtpAccountError.NotFound);

      if (
        row.host === null ||
        row.port === null ||
        row.username === null ||
        row.password === null
      ) {
        return new Failure(SmtpAccountError.Incomplete);
      }

      return new Ok({
        name: row.name,
        host: row.host,
        port: row.port,
        username: row.username,
        password: row.password,
      });
    });
  }

  list(): Promise<Result<SmtpAccount[], SmtpAccountError>> {
    return this.guard(async () => {
      const rows = await this.#summaries("smtp_accounts_list");
      return new Ok(rows.map((row) => this.#domain(row)));
    });
  }

  get(name: string): Promise<Result<SmtpAccount, SmtpAccountError>> {
    return this.guard(async () => {
      const row = (
        await this.#summaries("smtp_account_summary", { p_name: name })
      )[0];
      return row
        ? new Ok(this.#domain(row))
        : new Failure(SmtpAccountError.NotFound);
    });
  }

  upsert(
    input: UpsertSmtpAccountInput,
  ): Promise<Result<SmtpAccount, SmtpAccountError>> {
    return this.guard(async () => {
      const { error } = await database.rpc("upsert_smtp_account", {
        p_name: input.name,
        p_host: input.host,
        p_port: input.port,
        p_username: input.username,
        p_password: input.password,
      });
      if (error) throw error;

      return this.get(input.name);
    });
  }

  setActive(
    name: string,
    isActive: boolean,
  ): Promise<Result<void, SmtpAccountError>> {
    return this.#toggle("set_smtp_account_active", {
      p_name: name,
      p_is_active: isActive,
    });
  }

  clearCredentials(name: string): Promise<Result<void, SmtpAccountError>> {
    return this.#toggle("clear_smtp_account_credentials", { p_name: name });
  }

  remove(name: string): Promise<Result<void, SmtpAccountError>> {
    return this.guard(async () => {
      const { data, error } = await database.rpc("delete_smtp_account", {
        p_name: name,
      });
      if (error) throw error;

      const failure = DELETE_FAILURES[data as unknown as DeleteOutcome];
      return failure ? new Failure(failure) : okay;
    });
  }

  #toggle(
    fn: string,
    args: Record<string, unknown>,
  ): Promise<Result<void, SmtpAccountError>> {
    return this.guard(async () => {
      const { data, error } = await database.rpc(fn, args);
      if (error) throw error;

      return data ? okay : new Failure(SmtpAccountError.NotFound);
    });
  }

  async #summaries(
    fn: string,
    args?: Record<string, unknown>,
  ): Promise<SummaryRow[]> {
    const { data, error } = await database.rpc<SummaryRow[]>(fn, args);
    if (error) throw error;
    return data ?? [];
  }

  #domain(row: SummaryRow): SmtpAccount {
    return {
      name: row.name,
      host: row.host,
      port: row.port,
      username: row.username,
      isConfigured: row.is_configured,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
