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
