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

import { designSystem } from "@scribe/host/public/hosting/design-system.tsx";
import type React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { assert, assertStringIncludes } from "@std/assert";

function render(element: React.ReactElement): string {
  return renderToStaticMarkup(element);
}

Deno.test("the hosting surface carries the four status widgets", () => {
  for (
    const name of [
      "AppEnability",
      "AppSkeleton",
      "AppProgressIndicator",
      "AppEmpty",
    ]
  ) {
    assert(
      name in designSystem,
      `${name} must exist on the hosting design system`,
    );
  }
});

Deno.test("AppEnability disables the controls it wraps, not only their opacity", () => {
  const disabled = render(
    <designSystem.AppEnability isEnabled={false}>
      <designSystem.AppSubmit label="Send" />
    </designSystem.AppEnability>,
  );

  assertStringIncludes(disabled, 'data-enability="disabled"');
  assertStringIncludes(disabled, "<fieldset");
  assertStringIncludes(disabled, "disabled=");
  assertStringIncludes(disabled, "pointer-events:none");
  assertStringIncludes(disabled, "opacity:0.5");
});

Deno.test("AppEnability leaves an enabled subtree untouched", () => {
  const enabled = render(
    <designSystem.AppEnability isEnabled>
      <designSystem.AppSubmit label="Send" />
    </designSystem.AppEnability>,
  );

  assertStringIncludes(enabled, 'data-enability="enabled"');
  assert(
    !enabled.includes("pointer-events:none"),
    "an enabled subtree still takes pointer events",
  );
});

Deno.test("AppSkeleton renders a sized block, in pixels or in any CSS length", () => {
  const fixed = render(<designSystem.AppSkeleton width={120} height={16} />);

  assertStringIncludes(fixed, 'data-skeleton="block"');
  assertStringIncludes(fixed, "width:120px");
  assertStringIncludes(fixed, "height:16px");
  assertStringIncludes(fixed, "border-radius:8px");

  const fluid = render(
    <designSystem.AppSkeleton width="100%" height={40} radius={20} />,
  );

  assertStringIncludes(fluid, "width:100%");
  assertStringIncludes(fluid, "border-radius:20px");
});

Deno.test("AppProgressIndicator renders a ring twice the requested size", () => {
  const html = render(<designSystem.AppProgressIndicator size={12} />);

  assertStringIncludes(html, 'data-progress="spinner"');
  assertStringIncludes(html, "width:24px");
  assertStringIncludes(html, "height:24px");
  assertStringIncludes(html, 'data-progress-track="onPrimary"');
  assertStringIncludes(html, 'data-progress-arc="onPrimary"');
});

Deno.test("AppProgressIndicator carries the requested colour on both rings", () => {
  const html = render(
    <designSystem.AppProgressIndicator color="actionPrimary" />,
  );

  assertStringIncludes(html, 'data-progress-track="actionPrimary"');
  assertStringIncludes(html, 'data-progress-arc="actionPrimary"');
});

Deno.test("AppEmpty composes icon, title, subtitle and footer, in that order", () => {
  const html = render(
    <designSystem.AppEmpty
      icon={<designSystem.AppIcon name="clear" color="error" size={56} />}
      title="Nothing here"
      subtitle="Come back later."
      footer={<designSystem.AppButton.filled label="Retry" href="#" />}
    />,
  );

  const positions = [
    html.indexOf('data-icon="clear"'),
    html.indexOf("Nothing here"),
    html.indexOf("Come back later."),
    html.indexOf("Retry"),
  ];

  assert(positions.every((index) => index >= 0), "every slot must be rendered");
  assert(
    positions.every((index, i) => i === 0 || positions[i - 1] < index),
    "the slots must keep the icon, title, subtitle, footer order",
  );
  assertStringIncludes(html, 'data-color="secondary"');
});

Deno.test("AppEmpty renders its title alone when nothing else is given", () => {
  const html = render(<designSystem.AppEmpty title="Nothing here" />);

  assertStringIncludes(html, "Nothing here");
  assert(!html.includes("data-icon"), "no icon was asked for");
  assert(!html.includes("<a "), "no footer was asked for");
});

Deno.test("the status widgets contribute their animations and dark-mode rules to the page", () => {
  const page = render(
    <designSystem.App title="t">
      <designSystem.AppSkeleton width={10} height={10} />
    </designSystem.App>,
  );

  assertStringIncludes(page, "@keyframes app-skeleton-pulse");
  assertStringIncludes(page, "@keyframes app-progress-spin");
  assertStringIncludes(page, '[data-skeleton="block"]');
  assertStringIncludes(page, '[data-progress-arc="onPrimary"]');
  assertStringIncludes(page, "prefers-reduced-motion");
});
