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
