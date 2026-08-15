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

import {
  type DeeplinkPayload,
  DynamicLinkKind,
  type DynamicLinkPayload,
} from "@scribe/host/dependencies/features/devops/dynamic-links/dynamic-links.ts";
import { DeviceOs } from "@scribe/core/contracts/enums.ts";
import { Env } from "@scribe/host/env.ts";
import { LinkInterstitialKind } from "../_contract.ts";

export interface LinkTarget {
  readonly kind: LinkInterstitialKind;
  readonly target: string;
  readonly fallbackUrl: string | null;
}

function configured(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

function storeUrl(platform: DeviceOs): string {
  if (platform === DeviceOs.ANDROID) {
    return configured(Env.APP_ANDROID_STORE_URL) ?? Env.MAIN_URL;
  }
  if (platform === DeviceOs.IOS) {
    return configured(Env.APP_IOS_STORE_URL) ?? Env.MAIN_URL;
  }
  return Env.MAIN_URL;
}

function deeplinkUrl(scheme: string, payload: DeeplinkPayload): string {
  const query = new URLSearchParams(payload.params ?? {}).toString();
  const base = `${scheme}://${payload.route}`;
  return query ? `${base}?${query}` : base;
}

function deeplinkTarget(
  payload: DeeplinkPayload,
  platform: DeviceOs,
): LinkTarget {
  const scheme = configured(Env.APP_DEEPLINK_SCHEME);

  if (!scheme) {
    console.error(
      "[hosting:link] APP_DEEPLINK_SCHEME is not configured, serving the store fallback instead of the deeplink",
    );
    return {
      kind: LinkInterstitialKind.Redirect,
      target: storeUrl(platform),
      fallbackUrl: null,
    };
  }

  return {
    kind: LinkInterstitialKind.Deeplink,
    target: deeplinkUrl(scheme, payload),
    fallbackUrl: storeUrl(platform),
  };
}

export function targetOf(
  payload: DynamicLinkPayload,
  platform: DeviceOs,
): LinkTarget {
  if (payload.kind === DynamicLinkKind.Redirect) {
    return {
      kind: LinkInterstitialKind.Redirect,
      target: payload.url,
      fallbackUrl: null,
    };
  }

  return deeplinkTarget(payload, platform);
}
