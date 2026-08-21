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
import { themeMode } from "../../theme.ts";
import type { AppColors, AppFonts } from "../../types.ts";

export function makeApp(
  colors: AppColors,
  _fonts: AppFonts,
  fontFamily: string,
  fontFaceCss: string,
) {
  const l = colors.light;
  const d = colors.dark;

  const AppStyle = [
    "*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }",
    `[data-app="body"] { background-color: ${l.background.primary}; color: ${l.text.primary}; font-family: ${fontFamily}; }`,
    themeMode({
      tokens: {
        body: { light: l.background.primary, dark: d.background.primary },
      },
      attribute: "data-app",
      property: "background-color",
    }),
    themeMode({
      tokens: { body: { light: l.text.primary, dark: d.text.primary } },
      attribute: "data-app",
      property: "color",
    }),
  ].join("\n");

  function App({
    title,
    lang = "en",
    favicon,
    children,
    extraStyles = "",
  }: {
    title: string;
    lang?: string;
    favicon?: string;
    children: React.ReactNode;
    extraStyles?: string;
  }) {
    return (
      <html lang={lang}>
        <head>
          <meta charSet="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <meta name="color-scheme" content="light dark" />
          <title>{title}</title>
          {favicon && <link rel="icon" href={favicon} />}
          <style>{fontFaceCss}</style>
          <style>{AppStyle}</style>
          {extraStyles && <style>{extraStyles}</style>}
        </head>
        <body
          data-app="body"
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: "24px",
          }}
        >
          {children}
        </body>
      </html>
    );
  }

  return { App, AppStyle };
}
