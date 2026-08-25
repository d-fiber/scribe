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

import type { AppColors, AppFonts } from "../../types.ts";
import { themeMode } from "../../theme.ts";

export type TextColor =
  | "primary"
  | "onPrimary"
  | "primaryInvert"
  | "actionPrimary"
  | "secondary"
  | "tertiary"
  | "placeholder"
  | "link"
  | "success"
  | "warning"
  | "error";

export type TextAlign = "left" | "center" | "right";

export interface AppTextProps {
  label: string;
  color?: TextColor;
  align?: TextAlign;
  lineHeight?: number;
}

export interface AppEyebrowProps {
  label: string;
  color?: TextColor;
}

export function makeTextColors(
  colors: AppColors,
): Record<TextColor, { light: string; dark: string }> {
  return {
    primary: {
      light: colors.light.text.primary,
      dark: colors.dark.text.primary,
    },
    onPrimary: {
      light: colors.light.action.onPrimary,
      dark: colors.dark.action.onPrimary,
    },
    secondary: {
      light: colors.light.text.secondary,
      dark: colors.dark.text.secondary,
    },
    tertiary: {
      light: colors.light.text.tertiary,
      dark: colors.dark.text.tertiary,
    },
    placeholder: {
      light: colors.light.text.placeholder,
      dark: colors.dark.text.placeholder,
    },
    link: { light: colors.light.action.link, dark: colors.dark.action.link },
    actionPrimary: {
      light: colors.light.action.primary,
      dark: colors.dark.action.primary,
    },
    success: {
      light: colors.light.feedback.success,
      dark: colors.dark.feedback.success,
    },
    warning: {
      light: colors.light.feedback.warning,
      dark: colors.dark.feedback.warning,
    },
    error: {
      light: colors.light.feedback.error,
      dark: colors.dark.feedback.error,
    },
    primaryInvert: {
      light: colors.dark.text.primary,
      dark: colors.light.text.primary,
    },
  };
}

export function makeAppText(colors: AppColors, fonts: AppFonts) {
  const textColors = makeTextColors(colors);

  const AppTextStyle = themeMode({ tokens: textColors });

  function make(scale: keyof AppFonts) {
    return function AppTextVariant({
      label,
      color = "primary",
      align,
      lineHeight,
    }: AppTextProps) {
      return (
        <p
          data-color={color}
          style={{
            ...fonts[scale],
            color: textColors[color].light,
            textAlign: align,
            marginTop: 0,
            marginBottom: 0,
            lineHeight: lineHeight !== undefined ? `${lineHeight}px` : undefined,
          }}
        >
          {label}
        </p>
      );
    };
  }

  function eyebrow({ label, color = "actionPrimary" }: AppEyebrowProps) {
    return (
      <div
        data-color={color}
        style={{
          ...fonts.caption1Strong,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: textColors[color].light,
        }}
      >
        {label}
      </div>
    );
  }

  const AppText = {
    display: make("display"),
    largeTitle: make("largeTitle"),
    title1: make("title1"),
    title2: make("title2"),
    title3: make("title3"),
    body1Strong: make("body1Strong"),
    body1: make("body1"),
    body2Strong: make("body2Strong"),
    body2: make("body2"),
    caption1Strong: make("caption1Strong"),
    caption1: make("caption1"),
    caption2Strong: make("caption2Strong"),
    caption2: make("caption2"),
    eyebrow,
  } as const;

  return { AppText, AppTextStyle };
}
