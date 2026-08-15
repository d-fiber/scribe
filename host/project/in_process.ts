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

import {
  type ProjectHost,
  ProjectSlot,
} from "@scribe/core/contracts/project_host.ts";

interface SlotSpec {
  readonly load: () => Promise<unknown>;
  readonly degradesSilently: boolean;
}

const SLOTS: Record<ProjectSlot, SlotSpec> = {
  [ProjectSlot.AdminRoutes]: {
    load: () => import("@app/api/admin/index.ts"),
    degradesSilently: false,
  },
  [ProjectSlot.AppRoutes]: {
    load: () => import("@app/api/app/index.ts"),
    degradesSilently: false,
  },
  [ProjectSlot.InternalRegistration]: {
    load: () => import("@app/api/internal/index.ts"),
    degradesSilently: false,
  },
  [ProjectSlot.GotrueEmailContext]: {
    load: () =>
      import("@app/api/internal/gotrue/email/resolve_app_user_context.ts"),
    degradesSilently: false,
  },
  [ProjectSlot.MailTemplates]: {
    load: () => import("@app/public/mails/index.ts"),
    degradesSilently: false,
  },
  [ProjectSlot.HostingPages]: {
    load: () => import("@app/public/hostings/index.ts"),
    degradesSilently: false,
  },
  [ProjectSlot.SmsTemplates]: {
    load: () => import("@app/public/sms/index.ts"),
    degradesSilently: false,
  },
  [ProjectSlot.ThemeColors]: {
    load: () => import("@app/public/theme/colors.ts"),
    degradesSilently: true,
  },
  [ProjectSlot.ThemeFonts]: {
    load: () => import("@app/public/theme/fonts.ts"),
    degradesSilently: true,
  },
};

export class InProcessHost implements ProjectHost {
  readonly #resolved = new Map<ProjectSlot, unknown>();

  async load<T>(slot: ProjectSlot): Promise<T | null> {
    const cached = this.#resolved.get(slot);
    if (cached !== undefined) return cached as T | null;

    const spec = SLOTS[slot];
    try {
      const module = await spec.load();
      this.#resolved.set(slot, module);
      return module as T;
    } catch (error) {
      if (!spec.degradesSilently) {
        console.error(`[project:${slot}] unavailable:`, error);
      }
      this.#resolved.set(slot, null);
      return null;
    }
  }
}
