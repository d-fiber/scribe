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

import type { AppColors } from "../types.ts";
import type { TextColor } from "../primitives/text/text.tsx";
import { themeMode } from "../theme.ts";

export type ProgressColor = Extract<
  TextColor,
  "primary" | "onPrimary" | "actionPrimary" | "secondary"
>;

const opaqueAlpha = 255;
const trackAlpha = 150;
const strokeWidth = 2;
const defaultSize = 10;
const spinDurationMs = 800;

export interface AppProgressIndicatorProps {
  size?: number;
  color?: ProgressColor;
}

export function makeAppProgressIndicator(colors: AppColors) {
  const progressColors: Record<ProgressColor, { light: string; dark: string }> =
    {
      primary: {
        light: colors.light.text.primary,
        dark: colors.dark.text.primary,
      },
      onPrimary: {
        light: colors.light.action.onPrimary,
        dark: colors.dark.action.onPrimary,
      },
      actionPrimary: {
        light: colors.light.action.primary,
        dark: colors.dark.action.primary,
      },
      secondary: {
        light: colors.light.text.secondary,
        dark: colors.dark.text.secondary,
      },
    };

  const AppProgressIndicatorStyle = [
    "@keyframes app-progress-spin { to { transform: rotate(360deg); } }",
    `[data-progress-arc] { animation: app-progress-spin ${spinDurationMs}ms linear infinite; }`,
    "@media (prefers-reduced-motion: reduce) { [data-progress-arc] { animation-duration: 2400ms; } }",
    themeMode({
      tokens: progressColors,
      attribute: "data-progress-track",
      property: "border-color",
    }),
    themeMode({
      tokens: progressColors,
      attribute: "data-progress-arc",
      property: "border-top-color",
    }),
  ].join("\n");

  function AppProgressIndicator({
    size = defaultSize,
    color = "onPrimary",
  }: AppProgressIndicatorProps) {
    const diameter = size * 2;
    const ring = {
      position: "absolute",
      inset: 0,
      borderRadius: "50%",
      borderStyle: "solid",
      borderWidth: `${strokeWidth}px`,
      boxSizing: "border-box",
    } as const;

    return (
      <span
        data-progress="spinner"
        role="progressbar"
        style={{
          display: "inline-block",
          position: "relative",
          width: `${diameter}px`,
          height: `${diameter}px`,
          flexShrink: 0,
        }}
      >
        <span
          data-progress-track={color}
          style={{
            ...ring,
            borderColor: progressColors[color].light,
            opacity: trackAlpha / opaqueAlpha,
          }}
        />
        <span
          data-progress-arc={color}
          style={{
            ...ring,
            borderColor: "transparent",
            borderTopColor: progressColors[color].light,
          }}
        />
      </span>
    );
  }

  return { AppProgressIndicator, AppProgressIndicatorStyle };
}
