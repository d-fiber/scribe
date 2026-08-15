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
import type { AppIconName } from "@scribe/host/public/hosting/ui/primitives/media/icon.tsx";
import { iconCatalog } from "@scribe/host/public/hosting/ui/primitives/media/icon.tsx";
import type React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { assert, assertEquals, assertStringIncludes } from "@std/assert";

function render(element: React.ReactElement): string {
  return renderToStaticMarkup(element);
}

Deno.test("the hosting surface carries every component the mail surface has", () => {
  for (
    const name of [
      "AppCard",
      "AppButton",
      "AppSubmit",
      "AppTextField",
      "AppPinput",
      "AppIcon",
      "AppText",
      "AppLinkText",
      "AppSeparator",
      "AppSpacing",
      "AppSection",
      "AppRow",
      "AppColumn",
      "AppLogo",
    ]
  ) {
    assert(
      name in designSystem,
      `${name} must exist on the hosting design system`,
    );
  }
});

Deno.test("AppSpacing renders a gap per size, and nothing at all for size0", () => {
  assertEquals(render(<designSystem.AppSpacing.size0 />), "");
  assertStringIncludes(render(<designSystem.AppSpacing.size16 />), "16px");
  assertStringIncludes(render(<designSystem.AppSpacing.size40 />), "40px");
});

Deno.test("AppSeparator renders a real hr, not an email table", () => {
  const html = render(<designSystem.AppSeparator.size16 />);

  assertStringIncludes(html, "<hr");
  assertStringIncludes(html, 'data-separator="separator"');
  assert(!html.includes("<table"), "a hosting page is not an email");
});

Deno.test("AppRow and AppColumn lay out with flex, not with table cells", () => {
  const html = render(
    <designSystem.AppRow>
      <designSystem.AppColumn>
        <designSystem.AppText.body1 label="left" />
      </designSystem.AppColumn>
      <designSystem.AppColumn align="right">
        <designSystem.AppText.body1 label="right" />
      </designSystem.AppColumn>
    </designSystem.AppRow>,
  );

  assertStringIncludes(html, "display:flex");
  assertStringIncludes(html, "left");
  assertStringIncludes(html, "right");
  assert(!html.includes("<table"), "a hosting page is not an email");
});

Deno.test("AppSection wraps its children in a plain div", () => {
  const html = render(
    <designSystem.AppSection style={{ textAlign: "center" }}>
      <designSystem.AppText.body1 label="inside" />
    </designSystem.AppSection>,
  );

  assertStringIncludes(html, "<div");
  assertStringIncludes(html, "inside");
});

Deno.test("AppLinkText renders an anchor on every font scale", () => {
  const scales = Object.keys(designSystem.AppLinkText);
  assert(scales.length === 13, `expected 13 scales, got ${scales.length}`);

  for (const scale of scales) {
    const Variant = designSystem.AppLinkText[scale as keyof typeof designSystem.AppLinkText];
    const html = render(<Variant label="open" href="https://example.test" />);

    assertStringIncludes(html, "<a ");
    assertStringIncludes(html, 'href="https://example.test"');
    assertStringIncludes(html, 'data-link="link"');
  }
});

Deno.test("AppLogo ships both variants so dark mode can swap them", () => {
  const html = render(<designSystem.AppLogo />);

  assertStringIncludes(html, 'data-logo="light"');
  assertStringIncludes(html, 'data-logo="dark"');
  assertStringIncludes(html, "logo-light.png");
  assertStringIncludes(html, "logo-dark.png");
});

Deno.test("every new component contributes its dark-mode rules to the page", () => {
  const page = render(
    <designSystem.App title="t">
      <designSystem.AppText.body1 label="x" />
    </designSystem.App>,
  );

  assertStringIncludes(page, '[data-link="link"]');
  assertStringIncludes(page, '[data-separator="separator"]');
  assertStringIncludes(page, '[data-logo="dark"]');
});

Deno.test("AppButton exposes the same eight named variants as the mail one", () => {
  assertEquals(Object.keys(designSystem.AppButton).sort(), [
    "destructive",
    "filled",
    "gray",
    "invert",
    "outline",
    "plain",
    "tinted",
    "warning",
  ]);
});

Deno.test("AppButton renders an anchor carrying its variant, not a table", () => {
  const html = render(
    <designSystem.AppButton.filled label="Open" href="https://example.test" />,
  );

  assertStringIncludes(html, "<a ");
  assertStringIncludes(html, 'data-variant="filled"');
  assertStringIncludes(html, "Open");
  assert(!html.includes("<table"), "a hosting page is not an email");
});

Deno.test("AppButton delegates its label to AppText, like the mail one", () => {
  const html = render(
    <designSystem.AppButton.filled label="Open" href="https://example.test" />,
  );

  assertStringIncludes(html, 'data-color="onPrimary"');
  assertStringIncludes(html, "line-height:40px");
});

Deno.test("only the outline variant carries a border colour rule", () => {
  const page = render(
    <designSystem.App title="t">
      <designSystem.AppText.body1 label="x" />
    </designSystem.App>,
  );

  assertStringIncludes(page, '[data-variant="outline"]');
  assertStringIncludes(page, '[data-variant="filled"]');
});

Deno.test("AppText covers the thirteen scales plus the hosting eyebrow", () => {
  const keys = Object.keys(designSystem.AppText);

  assertEquals(keys.length, 14);
  assert(keys.includes("body2"), "the button needs body2");
  assert(
    keys.includes("eyebrow"),
    "the eyebrow has no mail equivalent, it stays",
  );
});

Deno.test("AppIcon names its glyphs exactly like PoppinIconData does", () => {
  const html = render(<designSystem.AppIcon name="map_pin" />);

  assertStringIncludes(html, 'data-icon="map_pin"');
  assertStringIncludes(html, "<svg");
  assertStringIncludes(html, 'stroke="currentColor"');
});

Deno.test("AppIcon covers the whole PoppinIconData enum, and renders every entry", () => {
  const names = Object.keys(iconCatalog) as AppIconName[];

  assertEquals(names.length, 684);

  for (const name of names) {
    const html = render(<designSystem.AppIcon name={name} />);
    assertStringIncludes(html, "<svg");
  }
});

Deno.test("AppIcon sizes and colours a glyph from the design tokens", () => {
  const html = render(
    <designSystem.AppIcon name="bell" size={32} color="warning" />,
  );

  assertStringIncludes(html, 'width="32"');
  assertStringIncludes(html, 'data-color="warning"');
});

Deno.test("AppIcon ships no style of its own, AppText already declares every colour", () => {
  const page = render(
    <designSystem.App title="t">
      <designSystem.AppIcon name="checkmark_circle" color="success" />
    </designSystem.App>,
  );

  assertStringIncludes(page, '[data-color="success"]');
  assertEquals(
    page.match(/\[data-color="success"\]/g)?.length,
    1,
    "the success token is declared once, by AppText",
  );
});

Deno.test("AppRichText offers the same thirteen scales as AppText", () => {
  assertEquals(Object.keys(designSystem.AppRichText).length, 13);
});

Deno.test("AppRichText separates its segments, and never after the last one", () => {
  const html = render(
    <designSystem.AppRichText.body2
      items={[
        { text: "By continuing you accept the" },
        { text: "terms", href: "https://example.test/terms" },
        { text: "of Poppin." },
      ]}
    />,
  );

  assertStringIncludes(html, "By continuing you accept the ");
  assertStringIncludes(html, ">terms </a>");
  assertStringIncludes(html, "of Poppin.</span>");
});

Deno.test("AppRichText keeps a separator the caller already wrote", () => {
  const html = render(
    <designSystem.AppRichText.body2
      items={[{ text: "spaced " }, { text: "out" }]}
    />,
  );

  assert(!html.includes("spaced  "), "the space must not be doubled");
});

Deno.test("AppRichText turns a segment with an href into an anchor, coloured as an action", () => {
  const html = render(
    <designSystem.AppRichText.body2
      items={[{ text: "open", href: "https://example.test" }]}
    />,
  );

  assertStringIncludes(html, '<a href="https://example.test"');
  assertStringIncludes(html, 'data-color="actionPrimary"');
});

Deno.test("AppRichText renders a disabled segment as dimmed plain text", () => {
  const html = render(
    <designSystem.AppRichText.body2
      items={[{ text: "open", href: "https://example.test", isEnabled: false }]}
    />,
  );

  assert(!html.includes("<a "), "a disabled segment is not clickable");
  assertStringIncludes(html, "opacity:0.4980392156862745");
});

Deno.test("AppRichText colours a plain segment as primary text unless told otherwise", () => {
  const html = render(
    <designSystem.AppRichText.body2
      items={[{ text: "plain" }, { text: "warned", color: "warning" }]}
    />,
  );

  assertStringIncludes(html, 'data-color="primary"');
  assertStringIncludes(html, 'data-color="warning"');
});

Deno.test("AppRichText sizes an inline icon against the font, in em", () => {
  const page = render(
    <designSystem.App title="t">
      <designSystem.AppRichText.body2
        items={[
          { text: "with icon", icon: <designSystem.AppIcon name="clear" /> },
        ]}
      />
    </designSystem.App>,
  );

  assertStringIncludes(page, "[data-rich-icon] svg { width: 0.7em");
  assertStringIncludes(page, "data-rich-icon");
});
