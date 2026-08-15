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

import type React from "react";
import type { AppColors } from "../../types.ts";

const FAVICON_VIEWBOX = 32;
const FAVICON_RADIUS = 8;

export interface WebAppProps {
  title: string;
  locale?: string | null;
  favicon?: string;
  redirectTo?: string;
  children: React.ReactNode;
}

export interface WebAppParts {
  colors: AppColors;
  App: (props: {
    title: string;
    lang?: string;
    favicon?: string;
    children: React.ReactNode;
  }) => React.ReactElement;
}

function squareFavicon(fill: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FAVICON_VIEWBOX} ${FAVICON_VIEWBOX}">` +
    `<rect width="${FAVICON_VIEWBOX}" height="${FAVICON_VIEWBOX}" rx="${FAVICON_RADIUS}" fill="${fill}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function redirectScript(target: string): string {
  return `window.addEventListener('load', function () { window.location.href = ${
    JSON.stringify(target)
  }; });`;
}

export function makeWebApp({ App, colors }: WebAppParts) {
  const defaultFavicon = squareFavicon(colors.light.action.primary);

  function WebApp({
    title,
    locale,
    favicon = defaultFavicon,
    redirectTo,
    children,
  }: WebAppProps) {
    return (
      <App title={title} lang={locale ?? "en"} favicon={favicon}>
        {children}
        {redirectTo && <script>{redirectScript(redirectTo)}</script>}
      </App>
    );
  }

  return { WebApp };
}
