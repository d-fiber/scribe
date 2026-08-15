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

import type { AppColors } from "../../types.ts";
import { makeAppIcon } from "../../primitives/media/icon.tsx";
import type { AppIconName } from "../../primitives/media/icon.tsx";
import { themeMode } from "../../theme.ts";
import type { InputShape } from "../_internal/sizes.ts";
import { inputRadius } from "../_internal/sizes.ts";
import type { ButtonVariant } from "../_internal/variants.ts";
import { makeVariantColors, variantTokens } from "../_internal/variants.ts";

export type IconButtonSize = "small" | "medium" | "large";

export interface AppIconButtonProps {
  icon: AppIconName;
  href: string;
  label: string;
  size?: IconButtonSize;
  shape?: InputShape;
}

const dimensions: Record<IconButtonSize, number> = {
  small: 35,
  medium: 40,
  large: 45,
};

const iconInset = 15;
const plainIconBonus = 5;

export function makeAppIconButton(colors: AppColors) {
  const { AppIcon } = makeAppIcon(colors);
  const variantColors = makeVariantColors(colors);

  const AppIconButtonStyle = [
    `[data-icon-button] { display: inline-flex; align-items: center; justify-content: center; text-decoration: none; }`,
    themeMode({
      tokens: variantTokens(variantColors, (v) => v.bg),
      attribute: "data-icon-button",
      property: "background-color",
    }),
    themeMode({
      tokens: variantTokens(variantColors, (v) => v.fg),
      attribute: "data-icon-button",
      property: "color",
    }),
    themeMode({
      tokens: variantTokens(variantColors, (v) => v.border, false),
      attribute: "data-icon-button",
      property: "border-color",
    }),
  ].join("\n");

  function make(variant: ButtonVariant) {
    return function AppIconButtonVariant({
      icon,
      href,
      label,
      size = "large",
      shape = "rounded",
    }: AppIconButtonProps) {
      const c = variantColors[variant];
      const dimension = dimensions[size];
      const isTransparent = c.bg.light === "transparent";
      const iconSize = dimension - iconInset +
        (isTransparent ? plainIconBonus : 0);

      return (
        <a
          href={href}
          aria-label={label}
          data-icon-button={variant}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: `${dimension}px`,
            height: `${dimension}px`,
            borderRadius: inputRadius[shape],
            backgroundColor: c.bg.light,
            color: c.fg.light,
            border: c.border.light === "transparent"
              ? "none"
              : `1px solid ${c.border.light}`,
            boxSizing: "border-box",
            textDecoration: "none",
          }}
        >
          <AppIcon name={icon} size={iconSize} color={c.fgColor} />
        </a>
      );
    };
  }

  const AppIconButton = {
    filled: make("filled"),
    gray: make("gray"),
    tinted: make("tinted"),
    plain: make("plain"),
    outline: make("outline"),
    invert: make("invert"),
    destructive: make("destructive"),
    warning: make("warning"),
  } as const;

  return { AppIconButton, AppIconButtonStyle };
}
