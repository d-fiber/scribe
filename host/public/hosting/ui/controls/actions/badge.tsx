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
import type { AppColors, AppFonts, ColorToken } from "../../types.ts";
import { makeAppIcon } from "../../primitives/media/icon.tsx";
import type { AppIconName } from "../../primitives/media/icon.tsx";
import { themeMode } from "../../theme.ts";

export type BadgeSize = "small" | "medium" | "large";
export type BadgeVariant = "primary" | "error" | "warning" | "success";

export interface AppBadgeCountProps {
  count: number;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export interface AppBadgeIconProps {
  icon: AppIconName;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export interface AppBadgeIndicatorProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const boxSize: Record<BadgeSize, number> = {
  small: 12,
  medium: 15,
  large: 20,
};

const iconSize: Record<BadgeSize, number> = {
  small: 10,
  medium: 13,
  large: 18,
};

const fontSize: Record<BadgeSize, number> = {
  small: 12,
  medium: 15,
  large: 17,
};

const lineHeightRatio = 1.1;
const countCeiling = 1000;
const countPadding = 6;

function countLabel(count: number): string {
  if (count <= 0) return "0";
  if (count >= countCeiling) return "+999";
  return String(count);
}

export function makeAppBadge(colors: AppColors, fonts: AppFonts) {
  const { AppIcon } = makeAppIcon(colors);

  const badgeColors: Record<BadgeVariant, ColorToken> = {
    primary: {
      light: colors.light.action.primary,
      dark: colors.dark.action.primary,
    },
    error: {
      light: colors.light.feedback.error,
      dark: colors.dark.feedback.error,
    },
    warning: {
      light: colors.light.feedback.warning,
      dark: colors.dark.feedback.warning,
    },
    success: {
      light: colors.light.feedback.success,
      dark: colors.dark.feedback.success,
    },
  };

  const foreground: ColorToken = {
    light: colors.light.action.onPrimary,
    dark: colors.dark.action.onPrimary,
  };

  const AppBadgeStyle = [
    themeMode({
      tokens: badgeColors,
      attribute: "data-badge",
      property: "background-color",
    }),
    themeMode({
      tokens: { badge: foreground },
      attribute: "data-badge-text",
      property: "color",
    }),
  ].join("\n");

  function shell(
    variant: BadgeVariant,
    size: BadgeSize,
    isExpandable: boolean,
    children: React.ReactNode,
  ) {
    const dimension = boxSize[size];

    return (
      <span
        data-badge={variant}
        data-badge-text="badge"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          height: `${dimension}px`,
          width: isExpandable ? undefined : `${dimension}px`,
          minWidth: isExpandable ? `${dimension}px` : undefined,
          paddingLeft: isExpandable ? `${countPadding}px` : undefined,
          paddingRight: isExpandable ? `${countPadding}px` : undefined,
          borderRadius: "100px",
          backgroundColor: badgeColors[variant].light,
          color: foreground.light,
          boxSizing: "border-box",
          flexShrink: 0,
        }}
      >
        {children}
      </span>
    );
  }

  function count({
    count,
    variant = "primary",
    size = "medium",
  }: AppBadgeCountProps) {
    return shell(
      variant,
      size,
      true,
      <span
        style={{
          ...fonts.caption2Strong,
          fontSize: `${fontSize[size]}px`,
          lineHeight: lineHeightRatio,
          textAlign: "center",
        }}
      >
        {countLabel(count)}
      </span>,
    );
  }

  function icon({
    icon,
    variant = "primary",
    size = "medium",
  }: AppBadgeIconProps) {
    return shell(
      variant,
      size,
      false,
      <AppIcon name={icon} size={iconSize[size]} color="onPrimary" />,
    );
  }

  function indicator({
    variant = "primary",
    size = "medium",
  }: AppBadgeIndicatorProps) {
    return shell(variant, size, false, null);
  }

  const AppBadge = { count, icon, indicator } as const;

  return { AppBadge, AppBadgeStyle };
}
