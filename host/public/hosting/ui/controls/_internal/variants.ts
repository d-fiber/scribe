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

import type { AppColors, ColorToken } from "../../types.ts";
import type { TextColor } from "../../primitives/text/text.tsx";

export type ButtonVariant =
  | "filled"
  | "gray"
  | "tinted"
  | "plain"
  | "outline"
  | "invert"
  | "destructive"
  | "warning";

export interface VariantColors {
  bg: ColorToken;
  fg: ColorToken;
  fgColor: TextColor;
  border: ColorToken;
}

const transparent: ColorToken = { light: "transparent", dark: "transparent" };

export function makeVariantColors(
  colors: AppColors,
): Record<ButtonVariant, VariantColors> {
  const l = colors.light;
  const d = colors.dark;

  return {
    filled: {
      bg: { light: l.action.primary, dark: d.action.primary },
      fg: { light: l.action.onPrimary, dark: d.action.onPrimary },
      fgColor: "onPrimary",
      border: transparent,
    },
    gray: {
      bg: { light: l.surface.fill, dark: d.surface.fill },
      fg: { light: l.action.primary, dark: d.action.primary },
      fgColor: "actionPrimary",
      border: transparent,
    },
    tinted: {
      bg: { light: l.action.tintedBackground, dark: d.action.tintedBackground },
      fg: { light: l.action.primary, dark: d.action.primary },
      fgColor: "actionPrimary",
      border: transparent,
    },
    plain: {
      bg: transparent,
      fg: { light: l.action.primary, dark: d.action.primary },
      fgColor: "actionPrimary",
      border: transparent,
    },
    outline: {
      bg: transparent,
      fg: { light: l.action.primary, dark: d.action.primary },
      fgColor: "actionPrimary",
      border: { light: l.action.primary, dark: d.action.primary },
    },
    invert: {
      bg: { light: d.background.primary, dark: l.background.primary },
      fg: { light: d.text.primary, dark: l.text.primary },
      fgColor: "primaryInvert",
      border: transparent,
    },
    destructive: {
      bg: { light: l.feedback.error, dark: d.feedback.error },
      fg: { light: l.action.onPrimary, dark: d.action.onPrimary },
      fgColor: "onPrimary",
      border: transparent,
    },
    warning: {
      bg: { light: l.surface.fill, dark: d.surface.fill },
      fg: { light: l.feedback.warning, dark: d.feedback.warning },
      fgColor: "warning",
      border: transparent,
    },
  };
}

export function variantTokens(
  variants: Record<ButtonVariant, VariantColors>,
  pick: (variant: VariantColors) => ColorToken,
  keepTransparent = true,
): Record<string, ColorToken> {
  return Object.fromEntries(
    Object.entries(variants)
      .map(([key, variant]) => [key, pick(variant)] as const)
      .filter(([, token]) => keepTransparent || token.light !== "transparent"),
  );
}
