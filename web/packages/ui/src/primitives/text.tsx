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
import { fonts } from "./fonts.ts";

export type TextColor =
  | "primary"
  | "onPrimary"
  | "primaryInvert"
  | "actionPrimary"
  | "secondary"
  | "tertiary"
  | "placeholder"
  | "link"
  | "warning";

export type TextAlign = "left" | "center" | "right";

interface AppTextProps {
  label?: string;
  children?: React.ReactNode;
  color?: TextColor;
  align?: TextAlign;
  lineHeight?: number | string;
  as?: keyof React.JSX.IntrinsicElements;
}

const colorVar: Record<TextColor, string> = {
  primary: "var(--app-text-primary)",
  onPrimary: "var(--app-action-on-primary)",
  primaryInvert: "var(--app-text-primary)",
  actionPrimary: "var(--app-action-primary)",
  secondary: "var(--app-text-secondary)",
  tertiary: "var(--app-text-tertiary)",
  placeholder: "var(--app-text-placeholder)",
  link: "var(--app-action-link)",
  warning: "var(--app-feedback-warning)",
};

function make(scale: keyof typeof fonts) {
  return function AppTextVariant({
    label,
    children,
    color = "primary",
    align,
    lineHeight,
    as: Tag = "p",
  }: AppTextProps) {
    return (
      <Tag
        style={{
          ...fonts[scale],
          color: colorVar[color],
          textAlign: align,
          margin: 0,
          lineHeight: lineHeight != null ? lineHeight : undefined,
        }}
      >
        {label ?? children}
      </Tag>
    );
  };
}

export const AppText = {
  display: make("display"),
  largeTitle: make("largeTitle"),
  title1: make("title1"),
  title2: make("title2"),
  title3: make("title3"),
  body1Strong: make("body1Strong"),
  body1: make("body1"),
  body2Strong: make("body2Strong"),
  body2: make("body2"),
  caption1Strong: make("caption1Strong"),
  caption1: make("caption1"),
  caption2Strong: make("caption2Strong"),
  caption2: make("caption2"),
} as const;
