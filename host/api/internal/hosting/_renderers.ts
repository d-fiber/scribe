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

import type {
  ConfirmAccountDeeplinkData,
  ConfirmAccountStatusData,
  EmailChangeStatusData,
  HostingContent,
  LinkInterstitialData,
  LinkStatusData,
  NotFoundData,
  ResetFormData,
  ResetStatusData,
  VpnDownloadData,
  VpnStatusData,
} from "./_contract.ts";
import { projectHost, ProjectSlot } from "@scribe/host/project/mod.ts";

export enum HostingPage {
  ConfirmAccountStatus = "confirm-account/status",
  ConfirmAccountDeeplink = "confirm-account/deeplink",
  NotFound = "not-found",
  EmailChangeStatus = "email-change/status",
  ResetStatus = "reset/status",
  ResetForm = "reset/form",
  VpnStatus = "vpn/status",
  VpnDownload = "vpn/download",
  LinkStatus = "link/status",
  LinkInterstitial = "link/interstitial",
}

interface HostingRenderers {
  readonly [HostingPage.ConfirmAccountStatus]: (
    d: ConfirmAccountStatusData,
  ) => HostingContent;
  readonly [HostingPage.ConfirmAccountDeeplink]: (
    d: ConfirmAccountDeeplinkData,
  ) => HostingContent;
  readonly [HostingPage.NotFound]: (d: NotFoundData) => HostingContent;
  readonly [HostingPage.EmailChangeStatus]: (
    d: EmailChangeStatusData,
  ) => HostingContent;
  readonly [HostingPage.ResetStatus]: (d: ResetStatusData) => HostingContent;
  readonly [HostingPage.ResetForm]: (d: ResetFormData) => HostingContent;
  readonly [HostingPage.VpnStatus]: (d: VpnStatusData) => HostingContent;
  readonly [HostingPage.VpnDownload]: (d: VpnDownloadData) => HostingContent;
  readonly [HostingPage.LinkStatus]: (d: LinkStatusData) => HostingContent;
  readonly [HostingPage.LinkInterstitial]: (
    d: LinkInterstitialData,
  ) => HostingContent;
}

interface HostingPages {
  readonly confirmAccount: {
    status(d: ConfirmAccountStatusData): HostingContent;
    deeplink(d: ConfirmAccountDeeplinkData): HostingContent;
  };
  readonly emailChange: { status(d: EmailChangeStatusData): HostingContent };
  readonly link: {
    status(d: LinkStatusData): HostingContent;
    interstitial(d: LinkInterstitialData): HostingContent;
  };
  readonly notFound: { page(d: NotFoundData): HostingContent };
  readonly reset: {
    status(d: ResetStatusData): HostingContent;
    form(d: ResetFormData): HostingContent;
  };
  readonly vpn: {
    status(d: VpnStatusData): HostingContent;
    download(d: VpnDownloadData): HostingContent;
  };
}

let RENDERERS: HostingRenderers | null = null;

const pages = await projectHost.load<HostingPages>(ProjectSlot.HostingPages);

if (pages) {
  const { confirmAccount, emailChange, link, notFound, reset, vpn } = pages;
  RENDERERS = {
    [HostingPage.ConfirmAccountStatus]: (d) => confirmAccount.status(d),
    [HostingPage.ConfirmAccountDeeplink]: (d) => confirmAccount.deeplink(d),
    [HostingPage.NotFound]: (d) => notFound.page(d),
    [HostingPage.EmailChangeStatus]: (d) => emailChange.status(d),
    [HostingPage.ResetStatus]: (d) => reset.status(d),
    [HostingPage.ResetForm]: (d) => reset.form(d),
    [HostingPage.VpnStatus]: (d) => vpn.status(d),
    [HostingPage.VpnDownload]: (d) => vpn.download(d),
    [HostingPage.LinkStatus]: (d) => link.status(d),
    [HostingPage.LinkInterstitial]: (d) => link.interstitial(d),
  };
}

export function rendererFor<K extends HostingPage>(
  page: K,
): HostingRenderers[K] | null {
  return RENDERERS ? RENDERERS[page] : null;
}
