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
import { makeAppBadge } from "./controls/actions/badge.tsx";
import { makeAppButton } from "./controls/actions/button.tsx";
import { makeAppChip } from "./controls/actions/chip.tsx";
import { makeAppIconButton } from "./controls/actions/icon-button.tsx";
import { makeAppSubmit } from "./controls/actions/submit.tsx";
import { makeAppTextButton } from "./controls/actions/text-button.tsx";
import { makeField } from "./controls/inputs/_internal/field.tsx";
import { makeAppPinput } from "./controls/inputs/pinput.tsx";
import { makeAppTextField } from "./controls/inputs/textfield.tsx";
import { makeAppRadio } from "./controls/selection/radio.tsx";
import { makeAppSwitch } from "./controls/selection/switch.tsx";
import { AppMain } from "./layouts/main.tsx";
import { makeApp } from "./layouts/scaffold/app.tsx";
import { makeWebApp } from "./layouts/scaffold/web-app.tsx";
import { makeAppTopSnackBar } from "./overlays/top-snack-bar.tsx";
import { makeAppCard } from "./patterns/card.tsx";
import { AppSection } from "./patterns/section.tsx";
import { AppColumn } from "./primitives/layout/column.tsx";
import { AppRow } from "./primitives/layout/row.tsx";
import { makeAppSeparator } from "./primitives/layout/separator.tsx";
import { AppSpacing } from "./primitives/layout/spacing.tsx";
import { makeAppIcon } from "./primitives/media/icon.tsx";
import { AppLogo, AppLogoStyle } from "./primitives/media/logo.tsx";
import { makeAppLinkText } from "./primitives/text/link-text.tsx";
import { makeAppRichText } from "./primitives/text/rich-text.tsx";
import { makeAppText } from "./primitives/text/text.tsx";
import { makeAppEmpty } from "./status/empty.tsx";
import { AppEnability } from "./status/enability.tsx";
import { makeAppProgressIndicator } from "./status/progress-indicator.tsx";
import { makeAppSkeleton } from "./status/skeleton.tsx";
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
    title: string;
    lang?: string;
    favicon?: string;
    children: React.ReactNode;
  }) => React.ReactElement;
  readonly WebApp: ReturnType<typeof makeWebApp>["WebApp"];
  readonly AppCard: ReturnType<typeof makeAppCard>["AppCard"];
  readonly AppButton: ReturnType<typeof makeAppButton>["AppButton"];
  readonly AppSubmit: ReturnType<typeof makeAppSubmit>["AppSubmit"];
  readonly AppIconButton: ReturnType<typeof makeAppIconButton>["AppIconButton"];
  readonly AppTextButton: ReturnType<typeof makeAppTextButton>["AppTextButton"];
  readonly AppBadge: ReturnType<typeof makeAppBadge>["AppBadge"];
  readonly AppChip: ReturnType<typeof makeAppChip>["AppChip"];
  readonly AppChipGroup: ReturnType<typeof makeAppChip>["AppChipGroup"];
  readonly AppRadio: ReturnType<typeof makeAppRadio>["AppRadio"];
  readonly AppSwitch: ReturnType<typeof makeAppSwitch>["AppSwitch"];
  readonly AppTextField: ReturnType<typeof makeAppTextField>["AppTextField"];
  readonly AppPinput: ReturnType<typeof makeAppPinput>["AppPinput"];
  readonly AppIcon: ReturnType<typeof makeAppIcon>["AppIcon"];
  readonly AppText: ReturnType<typeof makeAppText>["AppText"];
  readonly AppRichText: ReturnType<typeof makeAppRichText>["AppRichText"];
  readonly AppLinkText: ReturnType<typeof makeAppLinkText>["AppLinkText"];
  readonly AppSeparator: ReturnType<typeof makeAppSeparator>["AppSeparator"];
  readonly AppSkeleton: ReturnType<typeof makeAppSkeleton>["AppSkeleton"];
  readonly AppProgressIndicator: ReturnType<
    typeof makeAppProgressIndicator
  >["AppProgressIndicator"];
  readonly AppEmpty: ReturnType<typeof makeAppEmpty>["AppEmpty"];
  readonly AppTopSnackBar: ReturnType<
    typeof makeAppTopSnackBar
  >["AppTopSnackBar"];
  readonly AppSpacing = AppSpacing;
  readonly AppMain = AppMain;
  readonly AppSection = AppSection;
  readonly AppRow = AppRow;
  readonly AppColumn = AppColumn;
  readonly AppLogo = AppLogo;
  readonly AppEnability = AppEnability;

  constructor({ colors, fonts, fontFamily, fontFaceCss }: DesignSystemConfig) {
    this.colors = colors;
    this.fonts = fonts;
    this.fontFamily = fontFamily;
    this.fontFaceCss = fontFaceCss;

    const { App: BaseApp } = makeApp(colors, fonts, fontFamily, fontFaceCss);
    const { AppCard, AppCardStyle } = makeAppCard(colors);
    const { AppButton, AppButtonStyle } = makeAppButton(colors, fonts);
    const { AppSubmit, AppSubmitStyle } = makeAppSubmit(colors, fonts);
    const { AppFieldStyle } = makeField(colors, fonts);
    const { AppTextField } = makeAppTextField(colors, fonts);
    const { AppPinput } = makeAppPinput(colors, fonts);
    const { AppIconButton, AppIconButtonStyle } = makeAppIconButton(colors);
    const { AppTextButton, AppTextButtonStyle } = makeAppTextButton(
      colors,
      fonts,
    );
    const { AppBadge, AppBadgeStyle } = makeAppBadge(colors, fonts);
    const { AppChip, AppChipGroup, AppChipStyle } = makeAppChip(colors, fonts);
    const { AppRadio, AppRadioStyle } = makeAppRadio(colors, fonts);
    const { AppSwitch, AppSwitchStyle } = makeAppSwitch(colors);
    const { AppIcon } = makeAppIcon(colors);
    const { AppText, AppTextStyle } = makeAppText(colors, fonts);
    const { AppRichText, AppRichTextStyle } = makeAppRichText(colors, fonts);
    const { AppLinkText, AppLinkTextStyle } = makeAppLinkText(colors, fonts);
    const { AppSeparator, AppSeparatorStyle } = makeAppSeparator(colors);
    const { AppSkeleton, AppSkeletonStyle } = makeAppSkeleton(colors);
    const { AppProgressIndicator, AppProgressIndicatorStyle } =
      makeAppProgressIndicator(colors);
    const { AppEmpty } = makeAppEmpty(colors, fonts);
    const { AppTopSnackBar, AppTopSnackBarStyle } = makeAppTopSnackBar(
      colors,
      fonts,
    );

    this.AppCard = AppCard;
    this.AppButton = AppButton;
    this.AppSubmit = AppSubmit;
    this.AppTextField = AppTextField;
    this.AppPinput = AppPinput;
    this.AppIconButton = AppIconButton;
    this.AppTextButton = AppTextButton;
    this.AppBadge = AppBadge;
    this.AppChip = AppChip;
    this.AppChipGroup = AppChipGroup;
    this.AppRadio = AppRadio;
    this.AppSwitch = AppSwitch;
    this.AppIcon = AppIcon;
    this.AppText = AppText;
    this.AppRichText = AppRichText;
    this.AppLinkText = AppLinkText;
    this.AppSeparator = AppSeparator;
    this.AppSkeleton = AppSkeleton;
    this.AppProgressIndicator = AppProgressIndicator;
    this.AppEmpty = AppEmpty;
    this.AppTopSnackBar = AppTopSnackBar;

    const styles = [
      AppCardStyle,
      AppButtonStyle,
      AppSubmitStyle,
      AppIconButtonStyle,
      AppTextButtonStyle,
      AppBadgeStyle,
      AppChipStyle,
      AppRadioStyle,
      AppSwitchStyle,
      AppFieldStyle,
      AppTextStyle,
      AppRichTextStyle,
      AppLinkTextStyle,
      AppSeparatorStyle,
      AppLogoStyle,
      AppSkeletonStyle,
      AppProgressIndicatorStyle,
      AppTopSnackBarStyle,
    ].join("\n");

    this.App = ({ title, lang, favicon, children }) => (
      <BaseApp title={title} lang={lang} favicon={favicon} extraStyles={styles}>
        {children}
      </BaseApp>
    );

    this.WebApp = makeWebApp({ colors, App: this.App }).WebApp;
  }
}
