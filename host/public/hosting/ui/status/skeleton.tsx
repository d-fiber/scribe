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
