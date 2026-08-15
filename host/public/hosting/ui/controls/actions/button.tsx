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
