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
            border: c.border.light === "transparent" ? "none" : `1px solid ${c.border.light}`,
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
