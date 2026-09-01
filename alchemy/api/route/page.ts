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

/** The Content Security Policy keyword that allows nothing at all. */
const NO_SOURCE = "'none'";

/** The Content Security Policy keyword that allows the origin the page itself was served from. */
const SAME_ORIGIN = "'self'";

/**
 * The two things a page may be allowed to do, and the only two that ever differ between pages.
 *
 * @remarks
 * Everything else in the policy is the same for every page here, so a profile is these two fields
 * and nothing more. Keeping the shape closed is what makes a fourth case cost a named constant
 * that reads next to the others, rather than a policy assembled at a call site.
 */
interface PagePermissions {
  /** Where a form on the page may post, `'none'` when the page carries no form. */
  readonly formAction: string;

  /** Which origin the page may open a request to, `'none'` when it opens none. */
  readonly connectSrc: string;
}

/** A page that neither posts nor calls anywhere, which is what a page gets unless it asks otherwise. */
const SEALED: PagePermissions = {
  formAction: NO_SOURCE,
  connectSrc: NO_SOURCE,
};

/**
 * A page carrying a form that posts back to the address it was served from.
 *
 * @remarks
 * Without it the `form-action 'none'` of the sealed profile refuses the submission, which is what a
 * password reset page runs into. A page that has nothing to submit stays sealed, so the hardening
 * does not move for everybody to serve one case.
 */
const MAY_POST_A_FORM: PagePermissions = {
  formAction: SAME_ORIGIN,
  connectSrc: NO_SOURCE,
};

/**
 * A page whose script reports what happened back to the address it was served from.
 *
 * @remarks
 * Under `default-src 'none'` a beacon is refused **silently**, so an interstitial without this
 * never tells anybody whether the application opened or the visitor was sent to a store. The
 * origin it posts to is the page itself, so `'self'` is the whole opening.
 */
const MAY_CALL_ITS_OWN_ORIGIN: PagePermissions = {
  formAction: NO_SOURCE,
  connectSrc: SAME_ORIGIN,
};

/**
 * The policy a page is served under, with `permissions` deciding the two directives that vary.
 *
 * @remarks
 * `default-src 'none'` is the floor: a page here needs no external resource, so nothing may load
 * one and nothing may reach one either. `img-src 'self' data:` and `font-src data:` are what a
 * page serving its own logo needs and no more, and the inline style and script are what a page
 * rendered in one piece is made of, bounded by the floor that forbids every external origin.
 *
 * `connect-src` is written out even when it is `'none'`, where `default-src` would already have
 * covered it. It costs a few characters and it means the policy is read from the header rather
 * than deduced from what is missing.
 */
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

/**
 * The reply carrying `html` at `status`, hardened for a page that holds a session token in its body.
 *
 * @remarks
 * That one fact decides every header. `no-store` keeps a proxy or the browser's disk from holding
 * on to a page containing a refresh token, `no-referrer` keeps the address out of the next
 * request, `nosniff` stops the page being read as something other than what it says it is, and
 * `DENY` stops it being framed by somebody else.
 */
function htmlResponse(html: string, status: number, permissions: PagePermissions): Response {
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

/**
 * Every page an endpoint answers with, named after what the page is allowed to do.
 *
 * @remarks
 * It is to a page what {@link ServerResponse} is to a body: the endpoint says what it is answering
 * and never writes a header, so every page of every project is served under the same policy.
 *
 * No method takes a policy, which is the point. A caller cannot compose one at the call site, so
 * the three profiles are the three things a page here is ever allowed to do, and a fourth is a
 * constant added in this file and a method that names it.
 *
 * @example
 * ```ts ignore
 * return HtmlPage.render(confirmationPage);
 * return HtmlPage.renderForm(passwordResetPage);
 * ```
 */
export class HtmlPage {
  /** Answers `html` as a page that may neither post a form nor open a request. */
  static render(html: string, status = 200): Response {
    return htmlResponse(html, status, SEALED);
  }

  /** Answers `html` as a page whose form may post back to the address it was served from. */
  static renderForm(html: string, status = 200): Response {
    return htmlResponse(html, status, MAY_POST_A_FORM);
  }

  /** Answers `html` as a page whose script may report back to the address it was served from. */
  static renderInterstitial(html: string, status = 200): Response {
    return htmlResponse(html, status, MAY_CALL_ITS_OWN_ORIGIN);
  }
}
