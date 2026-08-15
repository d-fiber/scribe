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

import type { AppColors, AppFonts, ColorToken } from "../types.ts";
import { themeMode } from "../theme.ts";

export type SnackBarKind = "success" | "error";

export interface AppTopSnackBarProps {
  message: string;
}

const enterMs = 250;
const holdMs = 3000;
const leaveMs = 500;
const totalMs = enterMs + holdMs + leaveMs;
const enterStop = (enterMs / totalMs) * 100;
const holdStop = ((enterMs + holdMs) / totalMs) * 100;

const verticalPadding = 5;
const horizontalPadding = 16;

export function makeAppTopSnackBar(colors: AppColors, fonts: AppFonts) {
  const backgrounds: Record<SnackBarKind, ColorToken> = {
    success: {
      light: colors.light.feedback.success,
      dark: colors.dark.feedback.success,
    },
    error: {
      light: colors.light.feedback.error,
      dark: colors.dark.feedback.error,
    },
  };

  const foreground: ColorToken = {
    light: colors.light.action.onPrimary,
    dark: colors.dark.action.onPrimary,
  };

  const AppTopSnackBarStyle = [
    `@keyframes app-snack-bar {
  0% { transform: translateY(-100%); animation-timing-function: linear; }
  ${enterStop.toFixed(2)}% { transform: translateY(0); }
  ${
      holdStop.toFixed(2)
    }% { transform: translateY(0); animation-timing-function: cubic-bezier(0.35, 0.91, 0.33, 0.97); }
  100% { transform: translateY(-100%); }
}`,
    `[data-snack-bar] { animation: app-snack-bar ${totalMs}ms forwards; }`,
    `@media (prefers-reduced-motion: reduce) { [data-snack-bar] { animation: none; transform: translateY(0); } }`,
    themeMode({
      tokens: backgrounds,
      attribute: "data-snack-bar",
      property: "background-color",
    }),
    themeMode({
      tokens: { bar: foreground },
      attribute: "data-snack-bar-text",
      property: "color",
    }),
  ].join("\n");

  function make(kind: SnackBarKind) {
    return function AppTopSnackBarVariant({ message }: AppTopSnackBarProps) {
      return (
        <div
          data-snack-bar={kind}
          data-snack-bar-text="bar"
          role={kind === "error" ? "alert" : "status"}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1,
            backgroundColor: backgrounds[kind].light,
            color: foreground.light,
            paddingTop: `calc(env(safe-area-inset-top) + ${verticalPadding}px)`,
            paddingBottom: `${verticalPadding}px`,
            paddingLeft: `${horizontalPadding}px`,
            paddingRight: `${horizontalPadding}px`,
            textAlign: "center",
            boxSizing: "border-box",
            ...fonts.body2,
          }}
        >
          {message}
        </div>
      );
    };
  }

  const AppTopSnackBar = {
    success: make("success"),
    error: make("error"),
  } as const;

  return { AppTopSnackBar, AppTopSnackBarStyle };
}
