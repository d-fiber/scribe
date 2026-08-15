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

import { Env } from "@scribe/host/env.ts";
import { HtmlPage } from "@scribe/core/kernel/http/response/html.ts";
import { request } from "@scribe/core/runtime/http/request.ts";
import { renderToStaticMarkup } from "react-dom/server";
import {
  type ConfirmAccountOutcome,
  type EmailChangeOutcome,
  type HostingContent,
  type HostingPageData,
  HostingStatus,
  type LinkInterstitialData,
  type LinkOutcome,
  type ResetFormError,
  type ResetOutcome,
  type VpnOutcome,
} from "./_contract.ts";
import { HostingPage, rendererFor } from "./_renderers.ts";

const DOCTYPE = "<!doctype html>";
const UNAVAILABLE_STATUS = 503;

const UNAVAILABLE_HTML =
  `<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Page unavailable</title></head><body><h1>Page unavailable</h1><p>This page cannot be displayed right now. Please try again in a moment.</p></body></html>`;

function requestLocale(): string | null {
  const header = request.header("accept-language");
  if (!header) return null;

  const preferred = header.split(",")[0]?.split(";")[0]?.trim();
  if (!preferred) return null;

  const language = preferred.split("-")[0]?.trim().toLowerCase();
  return language ? language : null;
}

function pageData(): HostingPageData {
  return { locale: requestLocale(), appName: Env.APP_NAME };
}

function document(content: HostingContent): string {
  return DOCTYPE + renderToStaticMarkup(content);
}

function page(content: HostingContent | null, status: number): Response {
  if (content === null) {
    return HtmlPage.render(UNAVAILABLE_HTML, UNAVAILABLE_STATUS);
  }
  return HtmlPage.render(document(content), status);
}

function formPage(content: HostingContent | null, status: number): Response {
  if (content === null) {
    return HtmlPage.render(UNAVAILABLE_HTML, UNAVAILABLE_STATUS);
  }
  return HtmlPage.renderForm(document(content), status);
}

function interstitialPage(
  content: HostingContent | null,
  status: number,
): Response {
  if (content === null) {
    return HtmlPage.render(UNAVAILABLE_HTML, UNAVAILABLE_STATUS);
  }
  return HtmlPage.renderInterstitial(document(content), status);
}

export function confirmAccountStatus(outcome: ConfirmAccountOutcome): Response {
  const render = rendererFor(HostingPage.ConfirmAccountStatus);
  const content = render ? render({ ...pageData(), outcome }) : null;
  return page(content, HostingStatus.confirmAccount(outcome));
}

export function confirmAccountDeeplink(href: string): Response {
  const render = rendererFor(HostingPage.ConfirmAccountDeeplink);
  const content = render ? render({ ...pageData(), href }) : null;
  return page(content, 200);
}

export function notFound(): Response {
  const render = rendererFor(HostingPage.NotFound);
  const content = render ? render(pageData()) : null;
  return page(content, 404);
}

export function emailChangeStatus(outcome: EmailChangeOutcome): Response {
  const render = rendererFor(HostingPage.EmailChangeStatus);
  const content = render ? render({ ...pageData(), outcome }) : null;
  return page(content, HostingStatus.emailChange(outcome));
}

export function resetStatus(outcome: ResetOutcome): Response {
  const render = rendererFor(HostingPage.ResetStatus);
  const content = render ? render({ ...pageData(), outcome }) : null;
  return page(content, HostingStatus.reset(outcome));
}

export function resetForm(
  token: string,
  error: ResetFormError | null = null,
): Response {
  const render = rendererFor(HostingPage.ResetForm);
  const content = render ? render({ ...pageData(), token, error }) : null;
  return formPage(content, error ? 400 : 200);
}

export function vpnStatus(outcome: VpnOutcome): Response {
  const render = rendererFor(HostingPage.VpnStatus);
  const content = render ? render({ ...pageData(), outcome }) : null;
  return page(content, HostingStatus.vpn(outcome));
}

export function vpnDownload(): Response {
  const render = rendererFor(HostingPage.VpnDownload);
  const content = render ? render(pageData()) : null;
  return formPage(content, 200);
}

export function linkStatus(outcome: LinkOutcome): Response {
  const render = rendererFor(HostingPage.LinkStatus);
  const content = render ? render({ ...pageData(), outcome }) : null;
  return page(content, HostingStatus.link(outcome));
}

export function linkInterstitial(
  data: Omit<LinkInterstitialData, keyof HostingPageData>,
): Response {
  const render = rendererFor(HostingPage.LinkInterstitial);
  const content = render ? render({ ...pageData(), ...data }) : null;
  return interstitialPage(content, 200);
}
