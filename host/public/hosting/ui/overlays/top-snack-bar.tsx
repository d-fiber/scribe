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
