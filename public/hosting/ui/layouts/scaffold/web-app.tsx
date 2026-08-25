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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FAVICON_VIEWBOX} ${FAVICON_VIEWBOX}">` +
    `<rect width="${FAVICON_VIEWBOX}" height="${FAVICON_VIEWBOX}" rx="${FAVICON_RADIUS}" fill="${fill}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function redirectScript(target: string): string {
  return `window.addEventListener('load', function () { window.location.href = ${JSON.stringify(target)}; });`;
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
