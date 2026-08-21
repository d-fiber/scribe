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
import { themeMode } from "../../theme.ts";
import type { ControlSize, InputShape } from "../_internal/sizes.ts";
import { inputHeight, inputRadius } from "../_internal/sizes.ts";

export interface AppSubmitProps {
  label: string;
  size?: ControlSize;
  shape?: InputShape;
  isEnabled?: boolean;
  isFlexible?: boolean;
}

export function makeAppSubmit(colors: AppColors, fonts: AppFonts) {
  const l = colors.light;
  const d = colors.dark;

  const AppSubmitStyle = [
    `[data-submit="button"] { cursor: pointer; }`,
    `[data-submit="button"]:disabled { opacity: 0.4; cursor: default; }`,
    themeMode({
      tokens: {
        button: { light: l.action.primary, dark: d.action.primary },
      },
      attribute: "data-submit",
      property: "background-color",
    }),
    themeMode({
      tokens: {
        button: { light: l.action.onPrimary, dark: d.action.onPrimary },
      },
      attribute: "data-submit",
      property: "color",
    }),
  ].join("\n");

  function AppSubmit({
    label,
    size = "large",
    shape = "rounded",
    isEnabled = true,
    isFlexible = true,
  }: AppSubmitProps) {
    return (
      <button
        type="submit"
        data-submit="button"
        disabled={!isEnabled}
        style={{
          width: isFlexible ? "100%" : undefined,
          marginTop: "8px",
          height: `${inputHeight[size]}px`,
          paddingLeft: isFlexible ? undefined : "28px",
          paddingRight: isFlexible ? undefined : "28px",
          boxSizing: "border-box",
          borderStyle: "none",
          borderRadius: inputRadius[shape],
          backgroundColor: l.action.primary,
          color: l.action.onPrimary,
          ...fonts.body2Strong,
        }}
      >
        {label}
      </button>
    );
  }

  return { AppSubmit, AppSubmitStyle };
}
