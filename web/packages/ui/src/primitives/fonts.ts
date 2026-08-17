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


// The family comes from the CSS variable, which the project's tokens.css
// overrides. The fallback is a system stack, never the typeface of one
// particular project.
export const fontFamily = "var(--app-font-family)";

export const fontFaceCss = "";

export const fonts = {
  display: {
    fontFamily,
    fontSize: "48px",
    fontWeight: "600",
    lineHeight: "1.17",
    letterSpacing: "-0.48px",
  },
  largeTitle: {
    fontFamily,
    fontSize: "34px",
    fontWeight: "600",
    lineHeight: "1.21",
    letterSpacing: "-0.17px",
  },
  title1: {
    fontFamily,
    fontSize: "28px",
    fontWeight: "600",
    lineHeight: "1.21",
    letterSpacing: "-0.5px",
  },
  title2: {
    fontFamily,
    fontSize: "24px",
    fontWeight: "600",
    lineHeight: "1.27",
    letterSpacing: "-0.4px",
  },
  title3: {
    fontFamily,
    fontSize: "21px",
    fontWeight: "600",
    lineHeight: "1.25",
    letterSpacing: "-0.038px",
  },
  body1Strong: {
    fontFamily,
    fontSize: "18px",
    fontWeight: "600",
    lineHeight: "1.29",
    letterSpacing: "-0.5px",
  },
  body1: {
    fontFamily,
    fontSize: "18px",
    fontWeight: "400",
    lineHeight: "1.29",
    letterSpacing: "-0.5px",
  },
  body2Strong: {
    fontFamily,
    fontSize: "16px",
    fontWeight: "600",
    lineHeight: "1.33",
    letterSpacing: "-0.25px",
  },
  body2: {
    fontFamily,
    fontSize: "16px",
    fontWeight: "400",
    lineHeight: "1.33",
    letterSpacing: "-0.25px",
  },
  caption1Strong: {
    fontFamily,
    fontSize: "13px",
    fontWeight: "600",
    lineHeight: "1.38",
    letterSpacing: "0.026px",
  },
  caption1: {
    fontFamily,
    fontSize: "13px",
    fontWeight: "400",
    lineHeight: "1.38",
    letterSpacing: "0.026px",
  },
  caption2Strong: {
    fontFamily,
    fontSize: "11px",
    fontWeight: "600",
    lineHeight: "1.38",
    letterSpacing: "0.033px",
  },
  caption2: {
    fontFamily,
    fontSize: "11px",
    fontWeight: "400",
    lineHeight: "1.33",
    letterSpacing: "0.033px",
  },
} as const;
