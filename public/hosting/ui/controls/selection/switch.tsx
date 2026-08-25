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

export interface AppSwitchProps {
  name: string;
  label: string;
  value?: string;
  isChecked?: boolean;
  isEnabled?: boolean;
}

const trackWidth = 51;
const trackHeight = 31;
const thumbInset = 2;
const thumbSize = trackHeight - thumbInset * 2;
const thumbTravel = trackWidth - thumbSize - thumbInset * 2;

export function makeAppSwitch(colors: AppColors) {
  const l = colors.light;
  const d = colors.dark;

  const AppSwitchStyle = [
    `[data-switch="input"] { appearance: none; -webkit-appearance: none; position: relative; width: ${trackWidth}px; height: ${trackHeight}px; border-radius: ${
      trackHeight / 2
    }px; background-color: ${l.surface.inactive}; border: none; margin: 0; flex-shrink: 0; cursor: pointer; transition: background-color 200ms ease; }`,
    `[data-switch="input"]::after { content: ""; position: absolute; top: ${thumbInset}px; left: ${thumbInset}px; width: ${thumbSize}px; height: ${thumbSize}px; border-radius: 50%; background-color: ${l.action.onPrimary}; transition: transform 200ms ease; }`,
    `[data-switch="input"]:checked { background-color: ${l.action.primary}; }`,
    `[data-switch="input"]:checked::after { transform: translateX(${thumbTravel}px); }`,
    `[data-switch="input"]:disabled { cursor: default; opacity: 0.5; }`,
    `@media (prefers-reduced-motion: reduce) { [data-switch="input"], [data-switch="input"]::after { transition: none; } }`,
    themeMode({
      tokens: {
        input: { light: l.surface.inactive, dark: d.surface.inactive },
      },
      attribute: "data-switch",
      property: "background-color",
    }),
    `@media (prefers-color-scheme: dark) {\n  [data-switch="input"]:checked { background-color: ${d.action.primary} !important; }\n  [data-switch="input"]::after { background-color: ${d.action.onPrimary}; }\n}`,
  ].join("\n");

  function AppSwitch({
    name,
    label,
    value = "on",
    isChecked = false,
    isEnabled = true,
  }: AppSwitchProps) {
    return (
      <input
        type="checkbox"
        role="switch"
        data-switch="input"
        name={name}
        value={value}
        aria-label={label}
        defaultChecked={isChecked}
        disabled={!isEnabled}
      />
    );
  }

  return { AppSwitch, AppSwitchStyle };
}
