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
import { themeMode } from "../theme.ts";

const opaqueAlpha = 255;
const pulseFromAlpha = 120;
const pulseToAlpha = 80;
const pulseDurationMs = 1000;
const defaultRadius = 8;

export interface AppSkeletonProps {
  width: number | string;
  height: number | string;
  radius?: number;
}

function length(value: number | string): string {
  return typeof value === "number" ? `${value}px` : value;
}

export function makeAppSkeleton(colors: AppColors) {
  const skeletonColors = {
    block: {
      light: colors.light.text.placeholder,
      dark: colors.dark.text.placeholder,
    },
  };

  const AppSkeletonStyle = [
    `@keyframes app-skeleton-pulse { from { opacity: ${
      pulseFromAlpha / opaqueAlpha
    }; } to { opacity: ${pulseToAlpha / opaqueAlpha}; } }`,
    `[data-skeleton="block"] { animation: app-skeleton-pulse ${pulseDurationMs}ms ease-in-out infinite alternate; }`,
    `@media (prefers-reduced-motion: reduce) { [data-skeleton="block"] { animation: none; opacity: ${
      pulseFromAlpha / opaqueAlpha
    }; } }`,
    themeMode({
      tokens: skeletonColors,
      attribute: "data-skeleton",
      property: "background-color",
    }),
  ].join("\n");

  function AppSkeleton({
    width,
    height,
    radius = defaultRadius,
  }: AppSkeletonProps) {
    return (
      <div
        data-skeleton="block"
        style={{
          width: length(width),
          height: length(height),
          borderRadius: `${radius}px`,
          backgroundColor: skeletonColors.block.light,
          opacity: pulseFromAlpha / opaqueAlpha,
          flexShrink: 0,
        }}
      />
    );
  }

  return { AppSkeleton, AppSkeletonStyle };
}
