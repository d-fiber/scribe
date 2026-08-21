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
