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

export const colors = {
  light: {
    action: {
      primary: "#2563EB",
      onPrimary: "#FFFFFF",
      link: "#2563EB",
      tintedBackground: "#DBEAFE",
    },
    background: {
      primary: "#F5F5F5",
      secondary: "#FFFFFF",
    },
    feedback: {
      error: "#DC2626",
      success: "#16A34A",
      warning: "#D97706",
      info: "#2563EB",
    },
    outline: {
      border: "#E5E5E5",
      separator: "#D4D4D4",
    },
    surface: {
      section: "#FFFFFF",
      fill: "#F4F4F5",
      inactive: "#A1A1AA",
    },
    text: {
      primary: "#18181B",
      secondary: "#52525B",
      tertiary: "#A1A1AA",
      placeholder: "#71717A",
    },
  },
  dark: {
    action: {
      primary: "#3B82F6",
      onPrimary: "#FFFFFF",
      link: "#60A5FA",
      tintedBackground: "#1E3A8A",
    },
    background: {
      primary: "#0A0A0A",
      secondary: "#1A1A1A",
    },
    feedback: {
      error: "#F87171",
      success: "#4ADE80",
      warning: "#FBBF24",
      info: "#60A5FA",
    },
    outline: {
      border: "#3F3F46",
      separator: "#52525B",
    },
    surface: {
      section: "#18181B",
      fill: "#27272A",
      inactive: "#71717A",
    },
    text: {
      primary: "#FAFAFA",
      secondary: "#A1A1AA",
      tertiary: "#52525B",
      placeholder: "#71717A",
    },
  },
} as const;
