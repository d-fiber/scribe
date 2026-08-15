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

import type { AppColors, AppFonts } from "../../types.ts";
import { makeAppIcon } from "../../primitives/media/icon.tsx";
import type { AppIconName } from "../../primitives/media/icon.tsx";
import type { TextColor } from "../../primitives/text/text.tsx";
import { makeTextColors } from "../../primitives/text/text.tsx";

export interface AppTextButtonProps {
  label: string;
  href: string;
  color?: TextColor;
  prefix?: AppIconName;
  suffix?: AppIconName;
  isEnabled?: boolean;
}

const affixIconSize = 15;
const affixGap = 8;
const opaqueAlpha = 255;
const disabledAlpha = 127;

export function makeAppTextButton(colors: AppColors, fonts: AppFonts) {
  const { AppIcon } = makeAppIcon(colors);
  const textColors = makeTextColors(colors);

  const AppTextButtonStyle =
    `[data-text-button] { display: inline-flex; align-items: center; gap: ${affixGap}px; text-decoration: none; }`;

  function AppTextButton({
    label,
    href,
    color = "actionPrimary",
    prefix,
    suffix,
    isEnabled = true,
  }: AppTextButtonProps) {
    const style = {
      display: "inline-flex",
      alignItems: "center",
      gap: `${affixGap}px`,
      textDecoration: "none",
      color: textColors[color].light,
      ...fonts.body2Strong,
      opacity: isEnabled ? undefined : disabledAlpha / opaqueAlpha,
    } as const;

    const content = (
      <>
        {prefix !== undefined && (
          <AppIcon name={prefix} size={affixIconSize} color={color} />
        )}
        {label}
        {suffix !== undefined && (
          <AppIcon name={suffix} size={affixIconSize} color={color} />
        )}
      </>
    );

    if (!isEnabled) {
      return (
        <span data-text-button="" data-color={color} style={style}>
          {content}
        </span>
      );
    }

    return (
      <a href={href} data-text-button="" data-color={color} style={style}>
        {content}
      </a>
    );
  }

  return { AppTextButton, AppTextButtonStyle };
}
