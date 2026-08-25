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

import { Button, Section } from "@react-email/components";
import React from "react";
import type { AppColors, AppFonts } from "../types.ts";
import type { TextColor } from "./text.tsx";
import { makeAppText } from "./text.tsx";
import { themeMode } from "./theme.ts";

type ButtonSize = "small" | "medium" | "large";
type ButtonShape = "rounded" | "circular";

interface AppButtonProps {
  label: string;
  href: string;
  size?: ButtonSize;
  shape?: ButtonShape;
  isFlexible?: boolean;
}

export function makeAppButton(colors: AppColors, fonts: AppFonts) {
  const { AppText } = makeAppText(colors, fonts);
  const l = colors.light;
  const d = colors.dark;

  const variantColors: Record<
    string,
    {
      bg: { light: string; dark: string };
      fg: { light: string; dark: string };
      fgColor: TextColor;
      border: { light: string; dark: string };
    }
  > = {
    filled: {
      bg: { light: l.action.primary, dark: d.action.primary },
      fg: { light: l.action.onPrimary, dark: d.action.onPrimary },
      fgColor: "onPrimary",
      border: { light: "transparent", dark: "transparent" },
    },
    gray: {
      bg: { light: l.surface.fill, dark: d.surface.fill },
      fg: { light: l.action.primary, dark: d.action.primary },
      fgColor: "actionPrimary",
      border: { light: "transparent", dark: "transparent" },
    },
    tinted: {
      bg: { light: l.action.tintedBackground, dark: d.action.tintedBackground },
      fg: { light: l.action.primary, dark: d.action.primary },
      fgColor: "actionPrimary",
      border: { light: "transparent", dark: "transparent" },
    },
    plain: {
      bg: { light: "transparent", dark: "transparent" },
      fg: { light: l.action.primary, dark: d.action.primary },
      fgColor: "actionPrimary",
      border: { light: "transparent", dark: "transparent" },
    },
    outline: {
      bg: { light: "transparent", dark: "transparent" },
      fg: { light: l.action.primary, dark: d.action.primary },
      fgColor: "actionPrimary",
      border: { light: l.action.primary, dark: d.action.primary },
    },
    invert: {
      bg: { light: d.background.primary, dark: l.background.primary },
      fg: { light: d.text.primary, dark: l.text.primary },
      fgColor: "primaryInvert",
      border: { light: "transparent", dark: "transparent" },
    },
    destructive: {
      bg: { light: l.feedback.error, dark: d.feedback.error },
      fg: { light: l.action.onPrimary, dark: d.action.onPrimary },
      fgColor: "onPrimary",
      border: { light: "transparent", dark: "transparent" },
    },
    warning: {
      bg: { light: l.surface.fill, dark: d.surface.fill },
      fg: { light: l.feedback.warning, dark: d.feedback.warning },
      fgColor: "warning",
      border: { light: "transparent", dark: "transparent" },
    },
  };

  type VariantKey = keyof typeof variantColors;

  const bgTokens = Object.fromEntries(
    Object.entries(variantColors).map(([k, v]) => [k, v.bg]),
  ) as Record<VariantKey, { light: string; dark: string }>;

  const fgTokens = Object.fromEntries(
    Object.entries(variantColors).map(([k, v]) => [k, v.fg]),
  ) as Record<VariantKey, { light: string; dark: string }>;

  const borderTokens = Object.fromEntries(
    Object.entries(variantColors)
      .filter(([, v]) => v.border.light !== "transparent")
      .map(([k, v]) => [k, v.border]),
  ) as Record<string, { light: string; dark: string }>;

  const AppButtonStyle = [
    themeMode({
      tokens: bgTokens,
      attribute: "data-variant",
      property: "background-color",
    }),
    themeMode({
      tokens: fgTokens,
      attribute: "data-variant",
      property: "color",
    }),
    ...(Object.keys(borderTokens).length
      ? [
        themeMode({
          tokens: borderTokens,
          attribute: "data-variant",
          property: "border-color",
        }),
      ]
      : []),
  ].join("\n");

  const buttonSize = {
    small: { height: 30 },
    medium: { height: 35 },
    large: { height: 40 },
  } as const;

  const buttonShape = {
    rounded: "8px",
    circular: "9999px",
  } as const;

  function make(variant: VariantKey) {
    return function AppButtonVariant({
      label,
      href,
      size = "large",
      shape = "rounded",
      isFlexible = true,
    }: AppButtonProps) {
      const c = variantColors[variant];
      const sz = buttonSize[size];
      const r = buttonShape[shape];
      const hasBorder = c.border.light !== "transparent";

      const buttonStyle: React.CSSProperties = {
        display: "inline-block",
        background: c.bg.light,
        borderRadius: r,
        height: `${sz.height}px`,
        paddingLeft: isFlexible ? undefined : "16px",
        paddingRight: isFlexible ? undefined : "16px",
        boxSizing: "border-box",
        border: hasBorder ? `1px solid ${c.border.light}` : "none",
        ...(isFlexible ? { width: "100%" } : {}),
      };

      return (
        <Section style={{ textAlign: "center" }}>
          <Button href={href} data-variant={variant} style={buttonStyle}>
            <AppText.body2
              label={label}
              lineHeight={sz.height}
              color={c.fgColor}
            />
          </Button>
        </Section>
      );
    };
  }

  const AppButton = {
    filled: make("filled"),
    gray: make("gray"),
    tinted: make("tinted"),
    plain: make("plain"),
    outline: make("outline"),
    invert: make("invert"),
    destructive: make("destructive"),
    warning: make("warning"),
  } as const;

  return { AppButton, AppButtonStyle };
}
