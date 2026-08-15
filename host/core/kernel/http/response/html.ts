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

const NOTHING = "'none'";
const SAME_ORIGIN = "'self'";

interface PagePermissions {
  readonly formAction: string;
  readonly connectSrc: string;
}

const SEALED: PagePermissions = {
  formAction: NOTHING,
  connectSrc: NOTHING,
};

const MAY_POST_A_FORM: PagePermissions = {
  formAction: SAME_ORIGIN,
  connectSrc: NOTHING,
};

const MAY_CALL_ITS_OWN_ORIGIN: PagePermissions = {
  formAction: NOTHING,
  connectSrc: SAME_ORIGIN,
};

function contentSecurityPolicy(permissions: PagePermissions): string {
  return [
    "default-src 'none'",
    "style-src 'unsafe-inline'",
    "script-src 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src data:",
    `connect-src ${permissions.connectSrc}`,
    "base-uri 'none'",
    `form-action ${permissions.formAction}`,
    "frame-ancestors 'none'",
  ].join("; ");
}

function htmlResponse(
  html: string,
  status: number,
  permissions: PagePermissions,
): Response {
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Security-Policy": contentSecurityPolicy(permissions),
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    },
  });
}

export class HtmlPage {
  static render(html: string, status = 200): Response {
    return htmlResponse(html, status, SEALED);
  }

  static renderForm(html: string, status = 200): Response {
    return htmlResponse(html, status, MAY_POST_A_FORM);
  }

  static renderInterstitial(html: string, status = 200): Response {
    return htmlResponse(html, status, MAY_CALL_ITS_OWN_ORIGIN);
  }
}
