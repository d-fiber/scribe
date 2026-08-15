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
