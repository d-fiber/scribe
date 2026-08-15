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

import { Text } from "@react-email/components";
import type { AppColors, AppFonts } from "../types.ts";
import { themeMode } from "./theme.ts";

export type TextColor =
  | "primary"
  | "onPrimary"
  | "primaryInvert"
  | "actionPrimary"
  | "secondary"
  | "tertiary"
  | "placeholder"
  | "link"
  | "warning";
export type TextAlign = "left" | "center" | "right";

interface AppTextProps {
  label: string;
  color?: TextColor;
  align?: TextAlign;
  lineHeight?: number;
}

export function makeAppText(colors: AppColors, fonts: AppFonts) {
  const textColors: Record<TextColor, { light: string; dark: string }> = {
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
    warning: {
      light: colors.light.feedback.warning,
      dark: colors.dark.feedback.warning,
    },
    primaryInvert: {
      light: colors.dark.text.primary,
      dark: colors.light.text.primary,
    },
  };

  const AppTextStyle = themeMode({ tokens: textColors });

  function make(scale: keyof typeof fonts) {
    return function AppTextVariant({
      label,
      color = "primary",
      align,
      lineHeight,
    }: AppTextProps) {
      return (
        <Text
          data-color={color}
          style={{
            ...fonts[scale],
            color: textColors[color].light,
            textAlign: align,
            marginTop: 0,
            marginBottom: 0,
            lineHeight: lineHeight != undefined ? `${lineHeight}px` : undefined,
          }}
        >
          {label}
        </Text>
      );
    };
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
  } as const;

  return { AppText, AppTextStyle };
}
