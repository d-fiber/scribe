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

import { Router } from "@scribe/core/kernel/http/routing/router.ts";
import type { MiddlewareHandler } from "hono";
import { Hono } from "hono";
import { permission } from "../../../../middleware.ts";
import { memberAuthority, refuseSelf } from "../../_authority.ts";
import { UpdateMemberBirthdayEndpoint } from "./birthday.ts";
import { UpdateMemberFirstnameEndpoint } from "./firstname.ts";
import { UpdateMemberGenderEndpoint } from "./gender.ts";
import { UpdateMemberLastnameEndpoint } from "./lastname.ts";
import { UpdateMemberPasswordEndpoint } from "./password.ts";
import { UpdateMemberPhoneEndpoint } from "./phone.ts";
import { UpdateMemberRoleEndpoint } from "./role.ts";

export class MemberUpdateRouter extends Router {
  constructor(adminOnly: MiddlewareHandler) {
    super(adminOnly);
  }

  protected routes(app: Hono): void {
    app.use("*", permission("team:update"), refuseSelf(), memberAuthority());
    app.patch("/password", (c) => UpdateMemberPasswordEndpoint.handle(c.req.param("adminId")!));
    app.patch("/phone", (c) => UpdateMemberPhoneEndpoint.handle(c.req.param("adminId")!));
    app.patch("/firstname", (c) => UpdateMemberFirstnameEndpoint.handle(c.req.param("adminId")!));
    app.patch("/lastname", (c) => UpdateMemberLastnameEndpoint.handle(c.req.param("adminId")!));
    app.patch("/gender", (c) => UpdateMemberGenderEndpoint.handle(c.req.param("adminId")!));
    app.patch("/birthday", (c) => UpdateMemberBirthdayEndpoint.handle(c.req.param("adminId")!));
    app.patch("/role", (c) => UpdateMemberRoleEndpoint.handle(c.req.param("adminId")!));
  }
}
