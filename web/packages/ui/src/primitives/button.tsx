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
