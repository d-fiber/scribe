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

import { Body, Head, Html, Section } from "@react-email/components";
import React from "react";
import { AppPreview } from "./components/preview.tsx";
import { AppSpacing } from "./components/spacing.tsx";
import { themeMode } from "./components/theme.ts";
import type { AppColors, AppFonts } from "./types.ts";

export function makeApp(
  colors: AppColors,
  _fonts: AppFonts,
  _fontFamily: string,
  fontFaceCss: string,
) {
  const l = colors.light;
  const d = colors.dark;

  const AppEmailStyle = [
    `[data-app="body"] { background-color: ${l.background.primary}; }`,
    `[data-app="card"] { background-color: ${l.surface.section}; }`,
    themeMode({
      tokens: {
        body: { light: l.background.primary, dark: d.background.primary },
        card: { light: l.surface.section, dark: d.surface.section },
      },
      attribute: "data-app",
      property: "background-color",
    }),
  ].join("\n");

  function App({
    children,
    extraStyles = "",
    preview,
  }: {
    children: React.ReactNode;
    extraStyles?: string;
    preview?: string;
  }) {
    return (
      <Html>
        <Head>
          <style>{fontFaceCss}</style>
          <style>{AppEmailStyle}</style>
          {extraStyles && <style>{extraStyles}</style>}
        </Head>
        <Body data-app="body" style={{ margin: "10px", padding: "10px" }}>
          {preview && <AppPreview>{preview}</AppPreview>}
          <AppSpacing.size32 />
          <Section
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              borderTop: "0",
              overflow: "hidden",
            }}
          >
            <AppSpacing.size16 />
            <Section
              style={{
                paddingLeft: "16px",
                paddingRight: "16px",
                paddingTop: "20px",
                paddingBottom: "20px",
              }}
            >
              {children}
            </Section>
          </Section>
          <AppSpacing.size32 />
        </Body>
      </Html>
    );
  }

  return { App, AppEmailStyle };
}
