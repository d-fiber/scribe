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
import type { AppColors, AppFonts } from "../../types.ts";
import { makeAppText } from "../../primitives/text/text.tsx";
import { themeMode } from "../../theme.ts";
import type { ButtonShape, ControlSize } from "../_internal/sizes.ts";
import { buttonHeight, buttonRadius } from "../_internal/sizes.ts";
import type { ButtonVariant } from "../_internal/variants.ts";
import { makeVariantColors, variantTokens } from "../_internal/variants.ts";

export interface AppButtonProps {
  label: string;
  href: string;
  size?: ControlSize;
  shape?: ButtonShape;
  isFlexible?: boolean;
  id?: string;
}

export function makeAppButton(colors: AppColors, fonts: AppFonts) {
  const { AppText } = makeAppText(colors, fonts);

  const variantColors = makeVariantColors(colors);

  const bgTokens = variantTokens(variantColors, (v) => v.bg);
  const fgTokens = variantTokens(variantColors, (v) => v.fg);
  const borderTokens = variantTokens(variantColors, (v) => v.border, false);

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

  function make(variant: ButtonVariant) {
    return function AppButtonVariant({
      label,
      href,
      size = "large",
      shape = "rounded",
      isFlexible = true,
      id,
    }: AppButtonProps) {
      const c = variantColors[variant];
      const height = buttonHeight[size];
      const radius = buttonRadius[shape];
      const hasBorder = c.border.light !== "transparent";

      const buttonStyle: React.CSSProperties = {
        display: "inline-block",
        background: c.bg.light,
        borderRadius: radius,
        height: `${height}px`,
        paddingLeft: isFlexible ? undefined : "16px",
        paddingRight: isFlexible ? undefined : "16px",
        boxSizing: "border-box",
        border: hasBorder ? `1px solid ${c.border.light}` : "none",
        textDecoration: "none",
        ...(isFlexible ? { width: "100%" } : {}),
      };

      return (
        <div style={{ textAlign: "center" }}>
          <a href={href} id={id} data-variant={variant} style={buttonStyle}>
            <AppText.body2
              label={label}
              lineHeight={height}
              color={c.fgColor}
              align="center"
            />
          </a>
        </div>
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
