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
import type { AppColors, AppFonts, ColorToken } from "../../types.ts";
import { makeAppIcon } from "../../primitives/media/icon.tsx";
import type { AppIconName } from "../../primitives/media/icon.tsx";
import type { TextColor } from "../../primitives/text/text.tsx";
import { themeMode } from "../../theme.ts";

export type ChipSize = "small" | "medium" | "large";
export type ChipShape = "rounded" | "circular";
export type ChipVariant =
  | "primary"
  | "fill"
  | "invert"
  | "outline"
  | "highlight"
  | "error"
  | "success";

export interface AppChipPrefix {
  icon?: AppIconName;
  imageUrl?: string;
}

export interface AppChipProps {
  label: string;
  variant?: ChipVariant;
  size?: ChipSize;
  shape?: ChipShape;
  prefix?: AppChipPrefix;
  href?: string;
  deleteHref?: string;
}

export interface AppChipItem {
  label: string;
  href: string;
  isSelected: boolean;
  prefix?: AppChipPrefix;
}

export interface AppChipGroupProps {
  items: AppChipItem[];
  size?: ChipSize;
  shape?: ChipShape;
  spacing?: number;
}

const basePadding = 10;

const paddings: Record<ChipSize, { x: number; y: number }> = {
  small: { x: basePadding, y: basePadding / 2 },
  medium: { x: basePadding / 1.5, y: basePadding / 1.5 },
  large: { x: basePadding, y: basePadding },
};

const iconSizes: Record<ChipSize, number> = {
  small: 14,
  medium: 16,
  large: 18,
};

const imageSizes: Record<ChipSize, number> = {
  small: 18,
  medium: 22,
  large: 26,
};

const radii: Record<ChipShape, string> = {
  rounded: "8px",
  circular: "9999px",
};

const labelGap = basePadding / 2;
const deleteIconSize = 10;

export function makeAppChip(colors: AppColors, fonts: AppFonts) {
  const { AppIcon } = makeAppIcon(colors);
  const l = colors.light;
  const d = colors.dark;

  const backgrounds: Record<ChipVariant, ColorToken> = {
    primary: { light: l.action.primary, dark: d.action.primary },
    fill: { light: l.surface.fill, dark: d.surface.fill },
    invert: { light: d.background.primary, dark: l.background.primary },
    outline: { light: "transparent", dark: "transparent" },
    highlight: {
      light: l.action.tintedBackground,
      dark: d.action.tintedBackground,
    },
    error: { light: l.feedback.error, dark: d.feedback.error },
    success: { light: l.feedback.success, dark: d.feedback.success },
  };

  const foregrounds: Record<ChipVariant, TextColor> = {
    primary: "onPrimary",
    fill: "primary",
    invert: "primaryInvert",
    outline: "primary",
    highlight: "actionPrimary",
    error: "onPrimary",
    success: "onPrimary",
  };

  const AppChipStyle = [
    themeMode({
      tokens: backgrounds,
      attribute: "data-chip",
      property: "background-color",
    }),
    themeMode({
      tokens: {
        outline: { light: l.outline.border, dark: d.outline.border },
      },
      attribute: "data-chip",
      property: "border-color",
    }),
  ].join("\n");

  function Prefix(
    { prefix, size, color }: {
      prefix: AppChipPrefix;
      size: ChipSize;
      color: TextColor;
    },
  ) {
    if (prefix.imageUrl !== undefined) {
      return (
        <img
          src={prefix.imageUrl}
          alt=""
          width={imageSizes[size]}
          height={imageSizes[size]}
          style={{
            width: `${imageSizes[size]}px`,
            height: `${imageSizes[size]}px`,
            borderRadius: "9999px",
            objectFit: "cover",
          }}
        />
      );
    }

    if (prefix.icon === undefined) return null;

    return <AppIcon name={prefix.icon} size={iconSizes[size]} color={color} />;
  }

  function AppChip({
    label,
    variant = "primary",
    size = "medium",
    shape = "rounded",
    prefix,
    href,
    deleteHref,
  }: AppChipProps) {
    const color = foregrounds[variant];
    const padding = paddings[size];

    const style: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      gap: `${labelGap}px`,
      padding: `${padding.y}px ${padding.x}px`,
      borderRadius: radii[shape],
      backgroundColor: backgrounds[variant].light,
      border: variant === "outline"
        ? `1px solid ${l.outline.border}`
        : "1px solid transparent",
      boxSizing: "border-box",
      textDecoration: "none",
      ...fonts.body2,
    };

    const content = (
      <>
        {prefix !== undefined && (
          <Prefix prefix={prefix} size={size} color={color} />
        )}
        {label}
        {deleteHref !== undefined && (
          <a
            href={deleteHref}
            aria-label={label}
            style={{ display: "inline-flex", color: "inherit" }}
          >
            <AppIcon name="clear" size={deleteIconSize} color={color} />
          </a>
        )}
      </>
    );

    if (href === undefined) {
      return (
        <span data-chip={variant} data-color={color} style={style}>
          {content}
        </span>
      );
    }

    return (
      <a href={href} data-chip={variant} data-color={color} style={style}>
        {content}
      </a>
    );
  }

  function AppChipGroup({
    items,
    size = "medium",
    shape = "rounded",
    spacing = basePadding,
  }: AppChipGroupProps) {
    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: `${spacing}px`,
        }}
      >
        {items.map((item) => (
          <AppChip
            key={item.href}
            label={item.label}
            href={item.href}
            prefix={item.prefix}
            size={size}
            shape={shape}
            variant={item.isSelected ? "primary" : "fill"}
          />
        ))}
      </div>
    );
  }

  return { AppChip, AppChipGroup, AppChipStyle };
}
