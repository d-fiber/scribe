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
import { assert, assertEquals, assertStringIncludes } from "@std/assert";

function render(element: React.ReactElement): string {
  return renderToStaticMarkup(element);
}

Deno.test("the hosting surface carries every control ported from poppin_ui", () => {
  for (
    const name of [
      "AppIconButton",
      "AppTextButton",
      "AppBadge",
      "AppChip",
      "AppChipGroup",
      "AppRadio",
      "AppSwitch",
      "AppTopSnackBar",
    ]
  ) {
    assert(
      name in designSystem,
      `${name} must exist on the hosting design system`,
    );
  }
});

Deno.test("AppIconButton offers the same eight variants as AppButton", () => {
  assertEquals(
    Object.keys(designSystem.AppIconButton).sort(),
    Object.keys(designSystem.AppButton).sort(),
  );
});

Deno.test("AppIconButton renders a square anchor carrying an accessible name", () => {
  const html = render(
    <designSystem.AppIconButton.filled
      icon="heart"
      href="https://example.test"
      label="Ajouter aux favoris"
    />,
  );

  assertStringIncludes(html, "<a ");
  assertStringIncludes(html, 'aria-label="Ajouter aux favoris"');
  assertStringIncludes(html, 'data-icon-button="filled"');
  assertStringIncludes(html, "width:45px");
  assertStringIncludes(html, "height:45px");
  assertStringIncludes(html, 'data-icon="heart"');
});

Deno.test("AppIconButton grows its glyph on the transparent variants", () => {
  const filled = render(
    <designSystem.AppIconButton.filled icon="bell" href="#" label="x" />,
  );
  const plain = render(
    <designSystem.AppIconButton.plain icon="bell" href="#" label="x" />,
  );

  assertStringIncludes(filled, 'width="30"');
  assertStringIncludes(plain, 'width="35"');
});

Deno.test("AppTextButton renders an anchor with its optional affixes", () => {
  const html = render(
    <designSystem.AppTextButton
      label="Continuer"
      href="https://example.test"
      prefix="paperplane"
      suffix="chevron_right"
    />,
  );

  assertStringIncludes(html, "<a ");
  assertStringIncludes(html, 'data-color="actionPrimary"');
  assertStringIncludes(html, 'data-icon="paperplane"');
  assertStringIncludes(html, 'data-icon="chevron_right"');
  assertStringIncludes(html, "Continuer");
});

Deno.test("AppTextButton drops the anchor when it is disabled", () => {
  const html = render(
    <designSystem.AppTextButton label="Continuer" href="#" isEnabled={false} />,
  );

  assert(!html.includes("<a "), "a disabled text button is not clickable");
  assertStringIncludes(html, "opacity:0.4980392156862745");
});

Deno.test("AppBadge.count clamps the value exactly like the Flutter one", () => {
  assertStringIncludes(render(<designSystem.AppBadge.count count={7} />), ">7<");
  assertStringIncludes(render(<designSystem.AppBadge.count count={0} />), ">0<");
  assertStringIncludes(
    render(<designSystem.AppBadge.count count={-3} />),
    ">0<",
  );
  assertStringIncludes(
    render(<designSystem.AppBadge.count count={999} />),
    ">999<",
  );
  assertStringIncludes(
    render(<designSystem.AppBadge.count count={1000} />),
    ">+999<",
  );
});

Deno.test("AppBadge sizes its box, and only the count badge stretches", () => {
  const count = render(<designSystem.AppBadge.count count={7} size="large" />);
  const indicator = render(<designSystem.AppBadge.indicator size="large" />);

  assertStringIncludes(count, "min-width:20px");
  assertStringIncludes(indicator, "width:20px");
  assert(!indicator.includes("min-width"), "an indicator never stretches");
});

Deno.test("AppBadge paints each variant on its feedback colour", () => {
  const html = render(
    <designSystem.AppBadge.icon icon="checkmark" variant="success" />,
  );

  assertStringIncludes(html, 'data-badge="success"');
  assertStringIncludes(html, 'data-icon="checkmark"');
});

Deno.test("AppChip renders a span, and an anchor once it is clickable", () => {
  const plain = render(<designSystem.AppChip label="Paris" />);
  const linked = render(
    <designSystem.AppChip label="Paris" href="https://example.test" />,
  );

  assertStringIncludes(plain, "<span");
  assert(!plain.includes("<a "), "a chip without href is not a link");
  assertStringIncludes(linked, '<a href="https://example.test"');
  assertStringIncludes(linked, 'data-chip="primary"');
});

Deno.test("AppChip mounts its prefix, either an icon or an image", () => {
  const icon = render(
    <designSystem.AppChip label="Autour de moi" prefix={{ icon: "map_pin" }} />,
  );
  const image = render(
    <designSystem.AppChip
      label="Marque"
      prefix={{ imageUrl: "https://example.test/logo.png" }}
    />,
  );

  assertStringIncludes(icon, 'data-icon="map_pin"');
  assertStringIncludes(image, '<img src="https://example.test/logo.png"');
});

Deno.test("AppChip only draws a border on the outline variant", () => {
  const outline = render(
    <designSystem.AppChip label="Filtre" variant="outline" />,
  );
  const fill = render(<designSystem.AppChip label="Filtre" variant="fill" />);

  assertStringIncludes(outline, "background-color:transparent");
  assertStringIncludes(fill, "border:1px solid transparent");
});

Deno.test("AppChipGroup marks the selected chip as primary and the rest as fill", () => {
  const html = render(
    <designSystem.AppChipGroup
      items={[
        { label: "Tout", href: "?f=all", isSelected: true },
        { label: "Ouverts", href: "?f=open", isSelected: false },
      ]}
    />,
  );

  assertStringIncludes(html, 'data-chip="primary"');
  assertStringIncludes(html, 'data-chip="fill"');
  assertStringIncludes(html, 'href="?f=all"');
});

Deno.test("AppRadio posts one named group of native inputs", () => {
  const html = render(
    <designSystem.AppRadio
      name="plan"
      value="yearly"
      items={[
        { label: "Mensuel", value: "monthly" },
        { label: "Annuel", value: "yearly" },
        { label: "Équipe", value: "team", isEnabled: false },
      ]}
    />,
  );

  assertEquals(html.match(/type="radio"/g)?.length, 3);
  assertEquals(html.match(/name="plan"/g)?.length, 3);
  assertStringIncludes(html, 'checked="" value="yearly"');
  assertStringIncludes(html, 'disabled="" name="plan" value="team"');
  assertEquals(html.match(/checked=""/g)?.length, 1);
  assertStringIncludes(html, 'role="radiogroup"');
  assertStringIncludes(html, "<label");
});

Deno.test("AppSwitch is a native checkbox announced as a switch", () => {
  const html = render(
    <designSystem.AppSwitch name="notifications" label="Notifications" isChecked />,
  );

  assertStringIncludes(html, 'type="checkbox"');
  assertStringIncludes(html, 'role="switch"');
  assertStringIncludes(html, 'aria-label="Notifications"');
  assertStringIncludes(html, 'name="notifications"');
  assertStringIncludes(html, 'checked=""');
});

Deno.test("the new controls carry no script, and ship their rules to the page", () => {
  const page = render(
    <designSystem.App title="t">
      <designSystem.AppSwitch name="n" label="n" />
      <designSystem.AppRadio name="r" items={[{ label: "a", value: "a" }]} />
      <designSystem.AppChip label="c" />
    </designSystem.App>,
  );

  assert(!page.includes("<script"), "a hosting page ships no JavaScript");
  assertStringIncludes(page, '[data-switch="input"]:checked');
  assertStringIncludes(page, '[data-radio="input"]');
  assertStringIncludes(page, '[data-chip="outline"]');
  assertStringIncludes(page, '[data-icon-button="filled"]');
});

Deno.test("AppTopSnackBar pins a full-width banner over the page", () => {
  const html = render(
    <designSystem.AppTopSnackBar.success message="Compte confirmé" />,
  );

  assertStringIncludes(html, 'data-snack-bar="success"');
  assertStringIncludes(html, "position:fixed");
  assertStringIncludes(html, "top:0");
  assertStringIncludes(html, "Compte confirmé");
  assertStringIncludes(html, "env(safe-area-inset-top)");
});

Deno.test("AppTopSnackBar announces an error louder than a success", () => {
  const success = render(
    <designSystem.AppTopSnackBar.success message="ok" />,
  );
  const error = render(<designSystem.AppTopSnackBar.error message="ko" />);

  assertStringIncludes(success, 'role="status"');
  assertStringIncludes(error, 'role="alert"');
  assertStringIncludes(error, 'data-snack-bar="error"');
});

Deno.test("AppTopSnackBar auto-dismisses in CSS, on the Flutter timings", () => {
  const page = render(
    <designSystem.App title="t">
      <designSystem.AppTopSnackBar.error message="ko" />
    </designSystem.App>,
  );

  assertStringIncludes(page, "@keyframes app-snack-bar");
  assertStringIncludes(page, "animation: app-snack-bar 3750ms forwards");
  assertStringIncludes(page, "6.67% { transform: translateY(0); }");
  assertStringIncludes(page, "86.67% { transform: translateY(0)");
  assert(!page.includes("<script"), "a hosting page ships no JavaScript");
});

Deno.test("AppTopSnackBar keeps its message on screen when motion is reduced", () => {
  const page = render(
    <designSystem.App title="t">
      <designSystem.AppTopSnackBar.success message="ok" />
    </designSystem.App>,
  );

  assertStringIncludes(
    page,
    "@media (prefers-reduced-motion: reduce) { [data-snack-bar] { animation: none; transform: translateY(0); } }",
  );
});
