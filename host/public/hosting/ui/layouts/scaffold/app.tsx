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
