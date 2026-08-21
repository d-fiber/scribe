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
