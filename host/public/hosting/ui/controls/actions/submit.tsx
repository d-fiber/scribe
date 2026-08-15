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
