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

import type React from "react";
import type { AppColors, AppFonts } from "../../../types.ts";
import { makeAppText } from "../../../primitives/text/text.tsx";
import { themeMode } from "../../../theme.ts";
import type { ControlSize, InputShape } from "../../_internal/sizes.ts";
import {
  inputFont,
  inputHeight,
  inputRadius,
  textareaHeight,
} from "../../_internal/sizes.ts";

export interface AppFieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  size?: ControlSize;
  shape?: InputShape;
  opaque?: boolean;
  value?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  isEnabled?: boolean;
  isRequired?: boolean;
  readOnly?: boolean;
  minLength?: number;
  pattern?: string;
  requirement?: string;
}

export interface FieldStyleOptions {
  size: ControlSize;
  shape: InputShape;
  opaque: boolean;
  multiline?: boolean;
  centered?: boolean;
}

export function makeField(colors: AppColors, fonts: AppFonts) {
  const { AppText } = makeAppText(colors, fonts);
  const l = colors.light;
  const d = colors.dark;

  const AppFieldStyle = [
    `[data-input="field"]::placeholder { color: ${l.text.placeholder}; }`,
    `[data-input="field"]:focus { outline: 2px solid ${l.action.primary}; outline-offset: 1px; }`,
    `[data-input="field"]:disabled { opacity: 0.4; cursor: default; }`,
    themeMode({
      tokens: {
        field: { light: l.surface.fill, dark: d.surface.fill },
      },
      attribute: "data-input",
      property: "background-color",
    }),
    themeMode({
      tokens: {
        field: { light: l.text.primary, dark: d.text.primary },
      },
      attribute: "data-input",
      property: "color",
    }),
    themeMode({
      tokens: {
        field: { light: l.outline.border, dark: d.outline.border },
      },
      attribute: "data-input",
      property: "border-color",
    }),
  ].join("\n");

  function fieldStyle({
    size,
    shape,
    opaque,
    multiline = false,
    centered = false,
  }: FieldStyleOptions): React.CSSProperties {
    const font = fonts[inputFont[size]];

    return {
      width: "100%",
      boxSizing: "border-box",
      padding: opaque ? "12px 14px" : "12px 0",
      height: multiline ? undefined : `${inputHeight[size]}px`,
      minHeight: multiline ? `${textareaHeight[size]}px` : undefined,
      borderRadius: opaque ? inputRadius[shape] : "0",
      borderWidth: opaque ? "1px" : "0",
      borderStyle: "solid",
      borderColor: l.outline.border,
      backgroundColor: opaque ? l.surface.fill : "transparent",
      color: l.text.primary,
      resize: multiline ? "vertical" : undefined,
      ...font,
      textAlign: centered ? "center" : undefined,
      letterSpacing: centered ? "0.4em" : font.letterSpacing,
    };
  }

  function fieldAttributes({
    name,
    placeholder,
    value,
    autoFocus = false,
    isEnabled = true,
    isRequired = true,
    readOnly = false,
    requirement,
  }: AppFieldProps) {
    return {
      id: name,
      name,
      placeholder,
      defaultValue: value,
      autoFocus,
      disabled: !isEnabled,
      required: isRequired,
      readOnly,
      title: requirement,
      "data-input": "field",
    };
  }

  function Field({
    label,
    requirement,
    children,
  }: {
    label?: string;
    requirement?: string;
    children: React.ReactNode;
  }) {
    return (
      <div style={{ marginBottom: "16px" }}>
        {label && (
          <div style={{ marginBottom: "6px" }}>
            <AppText.caption1Strong label={label} align="left" />
          </div>
        )}
        {requirement && (
          <div style={{ marginBottom: "6px" }}>
            <AppText.caption2
              label={requirement}
              color="secondary"
              align="left"
            />
          </div>
        )}
        {children}
      </div>
    );
  }

  return { Field, fieldStyle, fieldAttributes, AppFieldStyle };
}
