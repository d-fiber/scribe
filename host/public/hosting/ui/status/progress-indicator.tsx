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
