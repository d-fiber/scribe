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
