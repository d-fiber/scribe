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

import type { AppColors } from "../../types.ts";
import { themeMode } from "../../theme.ts";

const sizes = {
  size0: 0.5,
  size8: 8,
  size16: 16,
  size20: 20,
  size24: 24,
  size32: 32,
  size40: 40,
  size56: 56,
  size64: 64,
} as const;

type SeparatorSize = keyof typeof sizes;

export function makeAppSeparator(colors: AppColors) {
  const AppSeparatorStyle = themeMode({
    tokens: {
      separator: {
        light: colors.light.outline.separator,
        dark: colors.dark.outline.separator,
      },
    },
    attribute: "data-separator",
    property: "border-top-color",
  });

  function make(size: SeparatorSize) {
    return function AppSeparatorVariant() {
      return (
        <div
          style={{
            paddingTop: `${sizes[size]}px`,
            paddingBottom: `${sizes[size]}px`,
          }}
        >
          <hr
            data-separator="separator"
            style={{
              borderTop: `0.5px solid ${colors.light.outline.separator}`,
              borderBottom: "none",
              borderLeft: "none",
              borderRight: "none",
              margin: 0,
              width: "100%",
            }}
          />
        </div>
      );
    };
  }

  const AppSeparator = {
    size0: make("size0"),
    size8: make("size8"),
    size16: make("size16"),
    size20: make("size20"),
    size24: make("size24"),
    size32: make("size32"),
    size40: make("size40"),
    size56: make("size56"),
    size64: make("size64"),
  } as const;

  return { AppSeparator, AppSeparatorStyle };
}
