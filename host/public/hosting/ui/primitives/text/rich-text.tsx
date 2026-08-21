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
import type { AppColors, AppFonts } from "../../types.ts";
import type { TextAlign, TextColor } from "./text.tsx";
import { makeTextColors } from "./text.tsx";

export type RichTextIconPosition = "left" | "right";

export interface AppRichTextItem {
  text: string;
  color?: TextColor;
  href?: string;
  icon?: React.ReactNode;
  iconPosition?: RichTextIconPosition;
  isEnabled?: boolean;
}

export interface AppRichTextProps {
  items: AppRichTextItem[];
  align?: TextAlign;
}

const opaqueAlpha = 255;
const disabledAlpha = 127;
const iconFontRatio = 0.7;
const iconGap = 12;

export function makeAppRichText(colors: AppColors, fonts: AppFonts) {
  const textColors = makeTextColors(colors);

  const AppRichTextStyle =
    `[data-rich-icon] svg { width: ${iconFontRatio}em; height: ${iconFontRatio}em; }`;

  function separatorOf(item: AppRichTextItem, isLast: boolean): string {
    return isLast || item.text.endsWith(" ") ? "" : " ";
  }

  function colorOf(item: AppRichTextItem): TextColor {
    if (item.color !== undefined) return item.color;
    return item.href !== undefined ? "actionPrimary" : "primary";
  }

  function Content({
    item,
    separator,
  }: {
    item: AppRichTextItem;
    separator: string;
  }) {
    if (item.icon === undefined) return <>{item.text + separator}</>;

    const isIconFirst = (item.iconPosition ?? "left") === "left";

    return (
      <>
        <span
          data-rich-icon=""
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: `${iconGap}px`,
            verticalAlign: "middle",
          }}
        >
          {isIconFirst && item.icon}
          {item.text}
          {!isIconFirst && item.icon}
        </span>
        {separator}
      </>
    );
  }

  function Item({
    item,
    isLast,
  }: {
    item: AppRichTextItem;
    isLast: boolean;
  }) {
    const isEnabled = item.isEnabled ?? true;
    const color = colorOf(item);
    const style = {
      color: textColors[color].light,
      opacity: isEnabled ? undefined : disabledAlpha / opaqueAlpha,
    };
    const content = (
      <Content item={item} separator={separatorOf(item, isLast)} />
    );

    if (item.href === undefined || !isEnabled) {
      return (
        <span data-color={color} style={style}>
          {content}
        </span>
      );
    }

    return (
      <a href={item.href} data-color={color} style={style}>
        {content}
      </a>
    );
  }

  function make(scale: keyof AppFonts) {
    return function AppRichTextVariant({ items, align }: AppRichTextProps) {
      return (
        <p
          data-rich-text="text"
          style={{
            ...fonts[scale],
            textAlign: align,
            marginTop: 0,
            marginBottom: 0,
          }}
        >
          {items.map((item, index) => (
            <Item
              key={`${index}-${item.text}`}
              item={item}
              isLast={index === items.length - 1}
            />
          ))}
        </p>
      );
    };
  }

  const AppRichText = {
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

  return { AppRichText, AppRichTextStyle };
}
