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
import { makeTextColors } from "../../primitives/text/text.tsx";
import { themeMode } from "../../theme.ts";

export interface AppRadioItem {
  label: string;
  value: string;
  isEnabled?: boolean;
}

export interface AppRadioProps {
  name: string;
  items: AppRadioItem[];
  value?: string;
  isRequired?: boolean;
}

const controlSize = 20;
const rowGap = 12;
const opaqueAlpha = 255;
const disabledAlpha = 127;

export function makeAppRadio(colors: AppColors, fonts: AppFonts) {
  const textColors = makeTextColors(colors);

  const AppRadioStyle = [
    `[data-radio="input"] { accent-color: ${colors.light.action.primary}; width: ${controlSize}px; height: ${controlSize}px; margin: 0; flex-shrink: 0; }`,
    `[data-radio="row"] { cursor: pointer; }`,
    `[data-radio="row"]:has([data-radio="input"]:disabled) { cursor: default; opacity: ${
      disabledAlpha / opaqueAlpha
    }; }`,
    themeMode({
      tokens: {
        input: {
          light: colors.light.action.primary,
          dark: colors.dark.action.primary,
        },
      },
      attribute: "data-radio",
      property: "accent-color",
    }),
  ].join("\n");

  function AppRadio({ name, items, value, isRequired = false }: AppRadioProps) {
    return (
      <div
        role="radiogroup"
        style={{ display: "flex", flexDirection: "column", width: "100%" }}
      >
        {items.map((item) => (
          <label
            key={item.value}
            data-radio="row"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: `${rowGap}px`,
              paddingTop: `${rowGap / 2}px`,
              paddingBottom: `${rowGap / 2}px`,
              ...fonts.body2,
              color: textColors.primary.light,
            }}
          >
            <span data-color="primary">{item.label}</span>
            <input
              type="radio"
              data-radio="input"
              name={name}
              value={item.value}
              defaultChecked={item.value === value}
              disabled={item.isEnabled === false}
              required={isRequired}
            />
          </label>
        ))}
      </div>
    );
  }

  return { AppRadio, AppRadioStyle };
}
