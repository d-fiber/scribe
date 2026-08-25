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

import React from "react";
import { makeApp } from "./app.tsx";
import { makeAppButton } from "./components/button.tsx";
import { makeAppCard } from "./components/card.tsx";
import { makeAppLinkText } from "./components/link-text.tsx";
import { AppLogo, AppLogoStyle } from "./components/logo.tsx";
import { AppColumn, AppRow } from "./components/row.tsx";
import { AppSection } from "./components/section.tsx";
import { makeAppSeparator } from "./components/separator.tsx";
import { AppSpacing } from "./components/spacing.tsx";
import { makeAppText } from "./components/text.tsx";
import type { AppColors, AppFonts } from "./types.ts";

export interface DesignSystemConfig {
  colors: AppColors;
  fonts: AppFonts;
  fontFamily: string;
  fontFaceCss: string;
}

export class DesignSystem {
  readonly colors: AppColors;
  readonly fonts: AppFonts;
  readonly fontFamily: string;
  readonly fontFaceCss: string;

  readonly App: (props: {
    children: React.ReactNode;
    preview?: string;
  }) => React.ReactElement;
  readonly AppLogo = AppLogo;
  readonly AppSpacing = AppSpacing;
  readonly AppRow = AppRow;
  readonly AppColumn = AppColumn;
  readonly AppSection = AppSection;
  readonly AppSeparator: ReturnType<typeof makeAppSeparator>["AppSeparator"];
  readonly AppCard: ReturnType<typeof makeAppCard>["AppCard"];
  readonly AppButton: ReturnType<typeof makeAppButton>["AppButton"];
  readonly AppLinkText: ReturnType<typeof makeAppLinkText>["AppLinkText"];
  readonly AppText: ReturnType<typeof makeAppText>["AppText"];

  constructor({ colors, fonts, fontFamily, fontFaceCss }: DesignSystemConfig) {
    this.colors = colors;
    this.fonts = fonts;
    this.fontFamily = fontFamily;
    this.fontFaceCss = fontFaceCss;

    const { App: BaseApp } = makeApp(colors, fonts, fontFamily, fontFaceCss);
    const { AppSeparator, AppSeparatorStyle } = makeAppSeparator(colors);
    const { AppCard, AppCardStyle } = makeAppCard(colors, fonts);
    const { AppButton, AppButtonStyle } = makeAppButton(colors, fonts);
    const { AppLinkText, AppLinkTextStyle } = makeAppLinkText(colors, fonts);
    const { AppText, AppTextStyle } = makeAppText(colors, fonts);

    this.AppSeparator = AppSeparator;
    this.AppCard = AppCard;
    this.AppButton = AppButton;
    this.AppLinkText = AppLinkText;
    this.AppText = AppText;

    const styles = [
      AppLogoStyle,
      AppSeparatorStyle,
      AppCardStyle,
      AppButtonStyle,
      AppLinkTextStyle,
      AppTextStyle,
    ].join("\n");

    this.App = ({ children, preview }) => (
      <BaseApp extraStyles={styles} preview={preview}>
        {children}
      </BaseApp>
    );
  }
}
