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

import React from "react";
import type { TextColor } from "./text.tsx";
import { AppText } from "./text.tsx";

type ButtonSize = "small" | "medium" | "large";
type ButtonShape = "rounded" | "circular";

interface AppButtonProps {
  label: string;
  href?: string;
  onClick?: () => void;
  size?: ButtonSize;
  shape?: ButtonShape;
  isFlexible?: boolean;
}

const variantStyles: Record<
  string,
  { bg: string; fg: string; fgColor: TextColor; border?: string }
> = {
  filled: {
    bg: "var(--app-action-primary)",
    fg: "var(--app-action-on-primary)",
    fgColor: "onPrimary",
  },
  gray: {
    bg: "var(--app-surface-fill)",
    fg: "var(--app-action-primary)",
    fgColor: "actionPrimary",
  },
  tinted: {
    bg: "#FD8597",
    fg: "var(--app-action-primary)",
    fgColor: "actionPrimary",
  },
  plain: {
    bg: "transparent",
    fg: "var(--app-action-primary)",
    fgColor: "actionPrimary",
  },
  outline: {
    bg: "transparent",
    fg: "var(--app-action-primary)",
    fgColor: "actionPrimary",
    border: "var(--app-action-primary)",
  },
  invert: {
    bg: "var(--app-text-primary)",
    fg: "var(--app-bg-primary)",
    fgColor: "primaryInvert",
  },
  destructive: {
    bg: "var(--app-feedback-error)",
    fg: "var(--app-action-on-primary)",
    fgColor: "onPrimary",
  },
  warning: {
    bg: "var(--app-surface-fill)",
    fg: "var(--app-feedback-warning)",
    fgColor: "warning",
  },
} as const;

type VariantKey = keyof typeof variantStyles;

const buttonHeight: Record<ButtonSize, number> = {
  small: 30,
  medium: 35,
  large: 40,
};

const buttonRadius: Record<ButtonShape, string> = {
  rounded: "8px",
  circular: "9999px",
};

function make(variant: VariantKey) {
  return function AppButtonVariant({
    label,
    href,
    onClick,
    size = "large",
    shape = "rounded",
    isFlexible = true,
  }: AppButtonProps) {
    const v = variantStyles[variant];
    const h = buttonHeight[size];
    const r = buttonRadius[shape];

    const style: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: v.bg,
      borderRadius: r,
      height: h,
      paddingLeft: isFlexible ? undefined : 16,
      paddingRight: isFlexible ? undefined : 16,
      border: v.border ? `1px solid ${v.border}` : "none",
      cursor: "pointer",
      textDecoration: "none",
      boxSizing: "border-box",
      width: isFlexible ? "100%" : undefined,
    };

    const content = (
      <AppText.body2Strong label={label} color={v.fgColor} as="span" />
    );

    if (href) {
      return (
        <a href={href} style={style}>
          {content}
        </a>
      );
    }
    return (
      <button type="button" onClick={onClick} style={style}>
        {content}
      </button>
    );
  };
}

export const AppButton = {
  filled: make("filled"),
  gray: make("gray"),
  tinted: make("tinted"),
  plain: make("plain"),
  outline: make("outline"),
  invert: make("invert"),
  destructive: make("destructive"),
  warning: make("warning"),
} as const;
