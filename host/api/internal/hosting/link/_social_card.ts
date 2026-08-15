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

import type { DynamicLinkPreview } from "@scribe/host/dependencies/features/devops/dynamic-links/dynamic-links.ts";
import { HtmlPage } from "@scribe/core/kernel/http/response/html.ts";
import { Env } from "@scribe/host/env.ts";

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escape(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

function meta(property: string, content: string): string {
  return `<meta property="${property}" content="${escape(content)}">`;
}

export function socialCard(preview: DynamicLinkPreview | null): Response {
  const title = preview?.title ?? Env.APP_NAME;
  const description = preview?.description ?? "";
  const image = preview?.imageUrl ?? "";

  const tags = [
    meta("og:type", "website"),
    meta("og:site_name", Env.APP_NAME),
    meta("og:title", title),
    ...(description ? [meta("og:description", description)] : []),
    ...(image ? [meta("og:image", image)] : []),
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">`,
    ...(description ? [`<meta name="description" content="${escape(description)}">`] : []),
  ].join("");

  const html = `<!doctype html><html lang="en"><head><meta charset="UTF-8">` +
    `<title>${escape(title)}</title>${tags}</head>` +
    `<body><h1>${escape(title)}</h1></body></html>`;

  return HtmlPage.render(html, 200);
}
