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

import { LinkInterstitialKind } from "@scribe/host/api/internal/hosting/_contract.ts";
import { isCrawler, platformOf } from "@scribe/host/api/internal/hosting/link/_client.ts";
import { targetOf } from "@scribe/host/api/internal/hosting/link/_target.ts";
import {
  DYNAMIC_LINK_PAYLOAD_VERSION,
  DynamicLinkKind,
  type DynamicLinkPayload,
} from "@scribe/host/dependencies/features/devops/dynamic-links/dynamic-links.ts";
import { DeviceOs } from "@scribe/core/contracts/enums.ts";
import { Env } from "@scribe/host/env.ts";
import { assert, assertEquals } from "@std/assert";

const IOS_STORE = "https://apps.apple.com/app/id1";
const ANDROID_STORE = "https://play.google.com/store/apps/details?id=app";

const DEEPLINK: DynamicLinkPayload = {
  v: DYNAMIC_LINK_PAYLOAD_VERSION,
  kind: DynamicLinkKind.Deeplink,
  route: "brand",
  params: { id: "42" },
};

const REDIRECT: DynamicLinkPayload = {
  v: DYNAMIC_LINK_PAYLOAD_VERSION,
  kind: DynamicLinkKind.Redirect,
  url: "https://brand.test/page",
};

function withStores<T>(body: () => T, scheme: string | null = "poppin"): T {
  const previous = {
    scheme: Deno.env.get("APP_DEEPLINK_SCHEME"),
    ios: Deno.env.get("APP_IOS_STORE_URL"),
    android: Deno.env.get("APP_ANDROID_STORE_URL"),
  };

  if (scheme) Deno.env.set("APP_DEEPLINK_SCHEME", scheme);
  else Deno.env.delete("APP_DEEPLINK_SCHEME");
  Deno.env.set("APP_IOS_STORE_URL", IOS_STORE);
  Deno.env.set("APP_ANDROID_STORE_URL", ANDROID_STORE);

  try {
    return body();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      const name = {
        scheme: "APP_DEEPLINK_SCHEME",
        ios: "APP_IOS_STORE_URL",
        android: "APP_ANDROID_STORE_URL",
      }[key] as string;
      if (value === undefined) Deno.env.delete(name);
      else Deno.env.set(name, value);
    }
  }
}

Deno.test("a redirection carries the payload url and arms no fallback", () => {
  const target = withStores(() => targetOf(REDIRECT, DeviceOs.IOS));

  assertEquals(target, {
    kind: LinkInterstitialKind.Redirect,
    target: "https://brand.test/page",
    fallbackUrl: null,
  });
});

Deno.test("a deeplink is built from the scheme, the route and its params", () => {
  const target = withStores(() => targetOf(DEEPLINK, DeviceOs.ANDROID));

  assertEquals(target.kind, LinkInterstitialKind.Deeplink);
  assertEquals(target.target, "poppin://brand?id=42");
});

Deno.test("a deeplink without params carries no trailing question mark", () => {
  const target = withStores(() =>
    targetOf({
      v: DYNAMIC_LINK_PAYLOAD_VERSION,
      kind: DynamicLinkKind.Deeplink,
      route: "home",
    }, DeviceOs.IOS)
  );

  assertEquals(target.target, "poppin://home");
});

Deno.test("the store fallback follows the platform", () => {
  const expected: [DeviceOs, string][] = [
    [DeviceOs.IOS, IOS_STORE],
    [DeviceOs.ANDROID, ANDROID_STORE],
    [DeviceOs.MACOS, Env.MAIN_URL],
    [DeviceOs.WINDOWS, Env.MAIN_URL],
    [DeviceOs.UNKNOWN, Env.MAIN_URL],
  ];

  for (const [platform, fallback] of expected) {
    const target = withStores(() => targetOf(DEEPLINK, platform));
    assertEquals(target.fallbackUrl, fallback, `${platform} fallback`);
  }
});

Deno.test("a missing scheme degrades to the store instead of failing", () => {
  const target = withStores(() => targetOf(DEEPLINK, DeviceOs.IOS), null);

  assertEquals(target, {
    kind: LinkInterstitialKind.Redirect,
    target: IOS_STORE,
    fallbackUrl: null,
  });
});

Deno.test("link unfurlers are recognised as crawlers, real browsers are not", () => {
  const crawlers = [
    "facebookexternalhit/1.1",
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Slackbot-LinkExpanding 1.0",
    "WhatsApp/2.23",
    "TelegramBot (like TwitterBot)",
    "curl/8.4.0",
    "",
  ];
  const humans = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
  ];

  for (const agent of crawlers) {
    assert(isCrawler(agent), `"${agent}" must be treated as a crawler`);
  }
  for (const agent of humans) {
    assert(!isCrawler(agent), `"${agent}" must be treated as a human`);
  }
});

Deno.test("the platform is read from the user agent", () => {
  const expected: [string, DeviceOs][] = [
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", DeviceOs.IOS],
    ["Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)", DeviceOs.IOS],
    ["Mozilla/5.0 (Linux; Android 14; Pixel 8)", DeviceOs.ANDROID],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", DeviceOs.MACOS],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64)", DeviceOs.WINDOWS],
    ["Mozilla/5.0 (X11; Ubuntu; Linux x86_64)", DeviceOs.LINUX],
    ["something else entirely", DeviceOs.UNKNOWN],
  ];

  for (const [agent, platform] of expected) {
    assertEquals(platformOf(agent), platform, agent);
  }
});

Deno.test("an android user agent is never mistaken for linux", () => {
  assertEquals(
    platformOf("Mozilla/5.0 (Linux; Android 14; Pixel 8)"),
    DeviceOs.ANDROID,
  );
});
