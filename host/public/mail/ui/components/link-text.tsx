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

import { Link } from "@react-email/components";
import type { AppColors, AppFonts } from "../types.ts";
import { themeMode } from "./theme.ts";

export type LinkTextAlign = "left" | "center" | "right";

interface AppLinkTextProps {
  label: string;
  href: string;
  align?: LinkTextAlign;
}

export function makeAppLinkText(colors: AppColors, fonts: AppFonts) {
  const AppLinkTextStyle = themeMode({
    tokens: {
      link: { light: colors.light.action.link, dark: colors.dark.action.link },
    },
  });

  function make(scale: keyof typeof fonts) {
    return function AppLinkTextVariant({
      label,
      href,
      align,
    }: AppLinkTextProps) {
      return (
        <Link
          href={href}
          data-color="link"
          style={{
            ...fonts[scale],
            textAlign: align,
            color: colors.light.action.link,
          }}
        >
          {label}
        </Link>
      );
    };
  }

  const AppLinkText = {
    display: make("display"),
    largeTitle: make("largeTitle"),
    title1: make("title1"),
    title2: make("title2"),
    title3: make("title3"),
    body1Strong: make("body1Strong"),
    body1: make("body1"),
    body2Strong: make("body2Strong"),
    body2: make("body2"),
    caption1Strong: make("caption1Strong"),
    caption1: make("caption1"),
    caption2Strong: make("caption2Strong"),
    caption2: make("caption2"),
  } as const;

  return { AppLinkText, AppLinkTextStyle };
}
