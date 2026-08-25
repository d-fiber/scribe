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

// This was called "AppSection" until 2026-07-29, and the name collided with the
// real Section of @react-email/components, a generic layout container, see
// ./section.tsx. This component is a bordered card with a background, holding
// either a centred badge through `item` or a list of label and value rows
// through `rows`, which is nothing like a generic layout.

import React from "react";
import type { AppColors, AppFonts } from "../types.ts";
import { AppSection } from "./section.tsx";
import { makeAppSeparator } from "./separator.tsx";
import { AppSpacing } from "./spacing.tsx";
import { makeAppText } from "./text.tsx";
import { themeMode } from "./theme.ts";

interface CardRowPrefix {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
}

export interface CardRowItem {
  prefix: CardRowPrefix;
  suffix: React.ReactNode;
}

export interface CardItem {
  label: string;
  isFlexible?: boolean;
}

type AppCardProps = { item: CardItem } | { rows: CardRowItem[] };

export function makeAppCard(colors: AppColors, fonts: AppFonts) {
  const { AppText } = makeAppText(colors, fonts);
  const { AppSeparator } = makeAppSeparator(colors);
  const l = colors.light;
  const d = colors.dark;

  const AppCardStyle = [
    themeMode({
      tokens: { container: { light: l.surface.fill, dark: d.surface.fill } },
      attribute: "data-card",
      property: "background-color",
    }),
    themeMode({
      tokens: {
        container: { light: l.outline.border, dark: d.outline.border },
      },
      attribute: "data-card",
      property: "border-color",
    }),
    themeMode({
      tokens: {
        label: { light: l.text.tertiary, dark: d.text.tertiary },
        value: { light: l.text.primary, dark: d.text.primary },
        subtitle: { light: l.text.secondary, dark: d.text.secondary },
      },
      attribute: "data-card-el",
      property: "color",
    }),
  ].join("\n");

  const containerStyle: React.CSSProperties = {
    width: "100%",
    background: l.surface.fill,
    borderRadius: "10px",
    border: `1px solid ${l.outline.border}`,
    borderCollapse: "separate" as const,
    overflow: "hidden",
    paddingLeft: "16px",
    paddingRight: "16px",
  };

  function rowPadding(i: number, total: number): string {
    if (i === 0) return "14px 0px 14px";
    if (i === total - 1) return "14px 0px 14px";
    return "14px 0px";
  }

  function AppCard(props: AppCardProps) {
    if ("item" in props) {
      const isFlexible = props.item.isFlexible ?? true;
      const itemContainerStyle: React.CSSProperties = {
        ...containerStyle,
        width: isFlexible ? "100%" : "auto",
      };
      return (
        <AppSection>
          <table
            data-card="container"
            align="center"
            cellPadding={0}
            cellSpacing={0}
            style={itemContainerStyle}
          >
            <tbody>
              <tr>
                <td style={{ padding: "14px 20px", textAlign: "center" }}>
                  <AppText.title3 label={props.item.label} />
                </td>
              </tr>
            </tbody>
          </table>
        </AppSection>
      );
    }

    return (
      <AppSection>
        <table
          data-card="container"
          align="center"
          cellPadding={0}
          cellSpacing={0}
          style={containerStyle}
        >
          <tbody>
            {props.rows.map((row, i) => (
              <React.Fragment key={i}>
                {i > 0 && (
                  <tr>
                    <td colSpan={2} style={{ padding: 0 }}>
                      <AppSeparator.size0 />
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: rowPadding(i, props.rows.length) }}>
                    {row.prefix.icon && (
                      <div style={{ marginBottom: "4px" }}>
                        {row.prefix.icon}
                      </div>
                    )}
                    <AppText.body2 label={row.prefix.title} color="primary" />
                    {row.prefix.subtitle && (
                      <>
                        <AppSpacing.size4 />
                        <AppText.caption1
                          label={row.prefix.subtitle}
                          color="secondary"
                        />
                      </>
                    )}
                  </td>
                  <td
                    style={{
                      padding: rowPadding(i, props.rows.length),
                      textAlign: "right",
                    }}
                  >
                    {row.suffix}
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </AppSection>
    );
  }

  return { AppCard, AppCardStyle };
}
