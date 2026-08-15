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
import {
  type DynamicLink,
  DynamicLinkOutcome,
} from "@scribe/host/dependencies/features/devops/dynamic-links/dynamic-links.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import type { DeviceOs } from "@scribe/core/contracts/enums.ts";
import { serve } from "@scribe/core/kernel/http/serve/mod.ts";
import { rateLimiter } from "@scribe/core/runtime/redis/rate_limiter/mod.ts";
import { request } from "@scribe/core/runtime/http/request.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";
import { LINK_BEACON_OUTCOMES, type LinkBeaconOutcome, LinkOutcome } from "../_contract.ts";
import { linkInterstitial, linkStatus } from "../_page.ts";
import { isCrawler, platformOf } from "./_client.ts";
import { socialCard } from "./_social_card.ts";
import { targetOf } from "./_target.ts";

const ROUTE_SEGMENT = "link";
const BEACON_SEGMENT = "outcome";
const PUBLIC_PREFIX = "/l";
const SLUG_PATTERN = /^[0-9A-Za-z]{4,32}$/;
const NO_CONTENT = 204;

const BEACON_OUTCOMES: Record<LinkBeaconOutcome, DynamicLinkOutcome> = {
  [LINK_BEACON_OUTCOMES.redirected]: DynamicLinkOutcome.Redirected,
  [LINK_BEACON_OUTCOMES.openedApp]: DynamicLinkOutcome.OpenedApp,
  [LINK_BEACON_OUTCOMES.storeFallback]: DynamicLinkOutcome.StoreFallback,
};

interface Route {
  readonly slug: string | null;
  readonly isBeacon: boolean;
}

function route(): Route {
  const segments = new URL(RequestScope.get().url).pathname
    .split("/")
    .filter(Boolean);

  const start = segments.lastIndexOf(ROUTE_SEGMENT);
  const rest = start >= 0 ? segments.slice(start + 1) : [];
  const slug = rest[0] ?? "";

  return {
    slug: SLUG_PATTERN.test(slug) ? slug : null,
    isBeacon: rest[1] === BEACON_SEGMENT,
  };
}

function beaconOutcome(): DynamicLinkOutcome | null {
  const body = request.raw();
  if (typeof body !== "object" || body === null) return null;

  const outcome = (body as { outcome?: unknown }).outcome;
  if (typeof outcome !== "string") return null;

  return BEACON_OUTCOMES[outcome as LinkBeaconOutcome] ?? null;
}

function record(
  link: DynamicLink,
  outcome: DynamicLinkOutcome,
  platform: DeviceOs,
): Promise<unknown> {
  return clients.devops.dynamicLinks.statistics.record({
    dynamicLinkId: link.id,
    outcome,
    platform,
    ipAddress: request.ip(),
    userAgent: request.userAgent(),
    referer: request.header("referer") ?? undefined,
  });
}

async function limited(): Promise<boolean> {
  const rate = await rateLimiter.check({
    key: "html:link",
    limit: 60,
    window: Time.minutes(1),
    penalty: Time.minutes(5),
    maxPenalty: Time.hours(1),
  });
  return !rate.ok;
}

async function beacon(slug: string): Promise<Response> {
  const outcome = beaconOutcome();
  if (!outcome) return new Response(null, { status: NO_CONTENT });

  const result = await clients.devops.dynamicLinks.link.get(slug);
  if (result.ok) {
    await record(result.data, outcome, platformOf(request.userAgent()));
  }

  return new Response(null, { status: NO_CONTENT });
}

async function interstitial(slug: string): Promise<Response> {
  const result = await clients.devops.dynamicLinks.link.get(slug);
  if (!result.ok) return linkStatus(LinkOutcome.InvalidLink);

  const link = result.data;
  const userAgent = request.userAgent();
  const platform = platformOf(userAgent);

  if (isCrawler(userAgent)) {
    await record(link, DynamicLinkOutcome.Crawler, platform);
    return socialCard(link.payload.preview ?? null);
  }

  await record(link, DynamicLinkOutcome.Served, platform);

  const { kind, target, fallbackUrl } = targetOf(link.payload, platform);
  const preview = link.payload.preview;

  return linkInterstitial({
    kind,
    target,
    fallbackUrl,
    beaconUrl: `${PUBLIC_PREFIX}/${slug}/${BEACON_SEGMENT}`,
    preview: preview
      ? {
        title: preview.title,
        description: preview.description ?? null,
        imageUrl: preview.imageUrl ?? null,
      }
      : null,
  });
}

serve(async () => {
  const { slug, isBeacon } = route();
  const method = request.method();

  if (!slug) return linkStatus(LinkOutcome.InvalidLink);
  if (await limited()) return linkStatus(LinkOutcome.TooManyAttempts);

  if (isBeacon) {
    if (method !== "POST") return linkStatus(LinkOutcome.InvalidLink);
    return await beacon(slug);
  }

  if (method !== "GET") return linkStatus(LinkOutcome.InvalidLink);
  return await interstitial(slug);
});
