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
