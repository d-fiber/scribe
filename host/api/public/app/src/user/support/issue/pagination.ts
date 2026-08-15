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

import { accountStorage } from "@scribe/host/dependencies/security/auth/src/user/storage/account_storage.ts";
import { pagination } from "@scribe/core/contracts/pagination.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { rest } from "@scribe/host/dependencies/database/rest/rest.ts";
import { ApiContext, ApiEndpoint, Caller } from "@scribe/core/kernel/endpoint/api.ts";

const SIZE = 30;

type IssueResponse = { message: string | null; responded_at: number };
type IssueReport = {
  issue_id: string;
  screen_url: string;
  log_file_url: string | null;
  created_at: number;
  updated_at: number;
  responses: IssueResponse[];
};

export class PaginationIssueReportsEndpoint extends ApiEndpoint {
  protected access(): Caller {
    return Caller.User;
  }

  protected rateLimit() {
    return {
      limit: 60,
      window: Time.minutes(1),
      penalty: Time.minutes(1),
      maxPenalty: Time.minutes(5),
    };
  }

  protected async run(ctx: ApiContext): Promise<Response> {
    if (!ctx.id) return this.response.unauthorized();

    const body = ctx.body({ offset: Number });
    const from = Math.max(0, Math.floor(Number(body?.offset) || 0));

    const rows = await rest
      .internal_t__app_user_issue_reports()
      .select((s) => ({
        issue_id: s.issue_id,
        screen_url: s.screen_url,
        log_file_url: s.log_file_url,
        created_at: s.created_at,
        updated_at: s.updated_at,
      }))
      // RLS already scopes this to the caller, but filtering explicitly
      // too means a future change to the client (e.g. someone swapping
      // in .service by mistake) fails safe instead of silently returning
      // every user's issue reports.
      .where((f) => f.user_id.eq(ctx.id!))
      .order("created_at", { ascending: false })
      .range(from, from + SIZE)
      .get();

    const page = rows.slice(0, SIZE);
    const issueIds = page.map((r) => r.issue_id);

    const responsesByIssue = new Map<string, IssueResponse[]>();
    if (issueIds.length > 0) {
      const responses = await rest
        .internal_t__responses()
        .select((s) => ({
          target_id: s.target_id,
          message: s.message,
          responded_at: s.responded_at,
        }))
        .where((f) => f.target_type.eq("issue"))
        .where((f) => f.target_id.in(issueIds))
        .order("responded_at", { ascending: true })
        .get();

      for (const r of responses) {
        const list = responsesByIssue.get(r.target_id) ?? [];
        list.push({ message: r.message, responded_at: r.responded_at as number });
        responsesByIssue.set(r.target_id, list);
      }
    }

    const items: IssueReport[] = page.map((r) => ({
      issue_id: r.issue_id,
      screen_url: accountStorage.user.issue.urlOf(r.screen_url),
      log_file_url: r.log_file_url === null ? null : accountStorage.user.issue.urlOf(r.log_file_url),
      created_at: r.created_at as number,
      updated_at: r.updated_at as number,
      responses: responsesByIssue.get(r.issue_id) ?? [],
    }));

    const result = pagination(rows, from, SIZE);
    return this.response.ok({ data: { ...result, items } });
  }
}
