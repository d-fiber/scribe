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

import { Link } from "@react-email/components";
import type { AppColors, AppFonts } from "../types.ts";
import { themeMode } from "./theme.ts";

export type LinkTextAlign = "left" | "center" | "right";

interface AppLinkTextProps {
  label: string;
  href: string;
  align?: LinkTextAlign;
}

export function makeAppLinkText(colors: AppColors, fonts: AppFonts) {
  const AppLinkTextStyle = themeMode({
    tokens: {
      link: { light: colors.light.action.link, dark: colors.dark.action.link },
    },
  });

  function make(scale: keyof typeof fonts) {
    return function AppLinkTextVariant({
      label,
      href,
      align,
    }: AppLinkTextProps) {
      return (
        <Link
          href={href}
          data-color="link"
          style={{
            ...fonts[scale],
            textAlign: align,
            color: colors.light.action.link,
          }}
        >
          {label}
        </Link>
      );
    };
  }

  const AppLinkText = {
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

  return { AppLinkText, AppLinkTextStyle };
}
