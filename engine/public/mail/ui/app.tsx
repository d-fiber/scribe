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
