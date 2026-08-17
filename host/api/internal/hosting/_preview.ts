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

import { RequestScope } from "@scribe/core/runtime/scope.ts";
import {
  ConfirmAccountOutcome,
  EmailChangeOutcome,
  HOSTING_FORM_FIELDS,
  LinkInterstitialKind,
  LinkOutcome,
  ResetFormError,
  ResetOutcome,
  VpnOutcome,
} from "./_contract.ts";
import {
  confirmAccountDeeplink,
  confirmAccountStatus,
  emailChangeStatus,
  linkInterstitial,
  linkStatus,
  notFound,
  resetForm,
  resetStatus,
  vpnDownload,
  vpnStatus,
} from "./_page.ts";

const PORT = Number(Deno.env.get("PREVIEW_PORT") ?? 4507);
const SAMPLE_TOKEN = "preview-token";
const LOCALES = ["fr", "en"] as const;
const ASSETS_PREFIX = "/assets/";
const ASSETS_ROOT = new URL(import.meta.resolve("@assets/"));
const ASSETS_CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
  webp: "image/webp",
  ico: "image/x-icon",
};

Deno.env.set("APP_URL", `http://localhost:${PORT}`);

async function asset(pathname: string): Promise<Response> {
  const name = pathname.slice(ASSETS_PREFIX.length);
  if (!name || name.includes("/")) return new Response("not found", { status: 404 });

  const extension = name.split(".").pop() ?? "";
  try {
    const bytes = await Deno.readFile(new URL(name, ASSETS_ROOT));
    return new Response(bytes, {
      headers: {
        "content-type": ASSETS_CONTENT_TYPES[extension] ?? "application/octet-stream",
        "cache-control": "no-store",
      },
    });
  } catch {
    return new Response("not found", { status: 404 });
  }
}

interface PreviewPage {
  readonly path: string;
  readonly label: string;
  readonly render: () => Response;
}

const PAGES: readonly PreviewPage[] = [
  {
    path: "/reset/form",
    label: "reset/form: the form",
    render: () => resetForm(SAMPLE_TOKEN),
  },
  {
    path: "/reset/form/mismatch",
    label: "reset/form: passwords that differ, with the error banner",
    render: () => resetForm(SAMPLE_TOKEN, ResetFormError.PasswordsDoNotMatch),
  },
  ...Object.values(ResetOutcome).map((outcome) => ({
    path: `/reset/status/${outcome}`,
    label: `reset/status: ${outcome}`,
    render: () => resetStatus(outcome),
  })),
  ...Object.values(ConfirmAccountOutcome).map((outcome) => ({
    path: `/confirm-account/status/${outcome}`,
    label: `confirm-account/status: ${outcome}`,
    render: () => confirmAccountStatus(outcome),
  })),
  {
    path: "/confirm-account/deeplink",
    label: "confirm-account/deeplink: redirects to the app scheme",
    render: () => confirmAccountDeeplink("poppin://auth/confirm#access_token=preview"),
  },
  {
    path: "/not-found",
    label: "not-found: the shared page for a missing route",
    render: () => notFound(),
  },
  ...Object.values(EmailChangeOutcome).map((outcome) => ({
    path: `/email-change/status/${outcome}`,
    label: `email-change/status: ${outcome}`,
    render: () => emailChangeStatus(outcome),
  })),
  {
    path: "/vpn/download",
    label: "vpn/download: the form",
    render: () => vpnDownload(),
  },
  ...Object.values(VpnOutcome).map((outcome) => ({
    path: `/vpn/status/${outcome}`,
    label: `vpn/status: ${outcome}`,
    render: () => vpnStatus(outcome),
  })),
  {
    path: "/link/interstitial/deeplink",
    label: "link/interstitial: deeplink with the store fallback",
    render: () =>
      linkInterstitial({
        kind: LinkInterstitialKind.Deeplink,
        target: "poppin://brand?id=preview",
        fallbackUrl: "https://apps.apple.com/app/id000000000",
        beaconUrl: "/l/preview/outcome",
        preview: null,
      }),
  },
  {
    path: "/link/interstitial/redirect",
    label: "link/interstitial: an external redirect",
    render: () =>
      linkInterstitial({
        kind: LinkInterstitialKind.Redirect,
        target: "https://example.com",
        fallbackUrl: null,
        beaconUrl: "/l/preview/outcome",
        preview: null,
      }),
  },
  ...Object.values(LinkOutcome).map((outcome) => ({
    path: `/link/status/${outcome}`,
    label: `link/status: ${outcome}`,
    render: () => linkStatus(outcome),
  })),
];

function withLocale<T>(locale: string, render: () => T): T {
  const request = new Request("http://localhost/hosting", {
    headers: { "accept-language": locale },
  });
  return RequestScope.run(request, new Uint8Array(0), render, "127.0.0.1");
}

function index(locale: string): Response {
  const groups = new Map<string, PreviewPage[]>();
  for (const page of PAGES) {
    const family = page.path.split("/")[1] ?? "";
    const bucket = groups.get(family) ?? [];
    bucket.push(page);
    groups.set(family, bucket);
  }

  const sections = [...groups]
    .map(([family, pages]) => {
      const items = pages
        .map(
          (page) => `<li><a href="${page.path}?lang=${locale}">${page.label}</a> <code>${page.path}</code></li>`,
        )
        .join("");
      return `<h2>${family}</h2><ul>${items}</ul>`;
    })
    .join("");

  const switcher = LOCALES.map((code) =>
    code === locale ? `<strong>${code}</strong>` : `<a href="/?lang=${code}">${code}</a>`
  ).join(" · ");

  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>hosting preview</title>
<style>body{font:14px/1.6 ui-monospace,monospace;max-width:52rem;margin:3rem auto;padding:0 1rem}
h1{font-size:1.1rem}h2{font-size:.95rem;margin-top:2rem;text-transform:uppercase;letter-spacing:.08em;opacity:.6}
ul{list-style:none;padding:0}li{padding:.35rem 0;border-bottom:1px solid #8883}
code{opacity:.45;float:right}a{color:inherit}</style></head>
<body><h1>hosting preview <span style="float:right">${switcher}</span></h1>
<p style="opacity:.6">These pages are rendered by <code>_page.ts</code>, with the same renderers, the same CSP and the same HTTP codes as in production. The reset form can be submitted, browser validation included.</p>
${sections}</body></html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}

function submitted(bytes: Uint8Array, locale: string): Response {
  const form = new URLSearchParams(new TextDecoder().decode(bytes));
  const password = form.get(HOSTING_FORM_FIELDS.newPassword) ?? "";
  const confirmation = form.get(HOSTING_FORM_FIELDS.confirmNewPassword) ?? "";

  if (password !== confirmation) {
    return withLocale(locale, () => resetForm(SAMPLE_TOKEN, ResetFormError.PasswordsDoNotMatch));
  }
  return withLocale(locale, () => resetStatus(ResetOutcome.PasswordUpdated));
}

Deno.serve({ port: PORT }, async (request) => {
  const url = new URL(request.url);
  const locale = url.searchParams.get("lang") ?? LOCALES[0];

  if (request.method === "POST") {
    return submitted(new Uint8Array(await request.arrayBuffer()), locale);
  }

  if (url.pathname === "/") return index(locale);

  if (url.pathname.startsWith(ASSETS_PREFIX)) return await asset(url.pathname);

  const page = PAGES.find((candidate) => candidate.path === url.pathname);
  if (!page) return new Response("not found", { status: 404 });

  return withLocale(locale, page.render);
});

console.info(`[hosting-preview] http://localhost:${PORT}`);
