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

import { clients } from "@scribe/host/dependencies/clients.ts";
import { Env } from "@scribe/host/env.ts";
import { AdminRbacResolver } from "@scribe/core/kernel/identity/resolver/rbac_resolver.ts";
import { request } from "@scribe/core/runtime/http/request.ts";
import { ServerResponse } from "@scribe/core/kernel/http/response/json.ts";

const REALM = `Basic realm="${Env.APP_NAME} Intra"`;

function unauthorized(): Response {
  const res = ServerResponse.unauthorized();
  res.headers.set("WWW-Authenticate", REALM);
  return res;
}

export async function handleIntraAuth(): Promise<Response> {
  const authorization = request.headers().get("authorization") ??
    request.headers().get("Authorization");

  if (!authorization?.startsWith("Basic ")) return unauthorized();

  let email: string;
  let password: string;
  try {
    const decoded = atob(authorization.slice(6));
    const sep = decoded.indexOf(":");
    email = decoded.slice(0, sep);
    password = decoded.slice(sep + 1);
  } catch {
    return ServerResponse.badRequest();
  }

  if (!email || !password) return unauthorized();

  const permissionKey = request.headers().get("x-required-permission");
  if (!permissionKey) return unauthorized();

  const permission = `intra:${permissionKey}`;

  const adminId = await clients.security.auth.signIn.admin.intra.withEmailAndPassword(
    email,
    password,
  );
  if (!adminId) return unauthorized();

  const rbac = await AdminRbacResolver.resolve(adminId);
  if (!rbac?.permissions.includes(permission)) return unauthorized();

  return ServerResponse.ok();
}
