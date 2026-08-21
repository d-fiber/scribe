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
