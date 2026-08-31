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

import type { Future } from "@scribe/alchemy";
import { type ProjectHost, ProjectSlot } from "@scribe/contracts/project_host.ts";

interface SlotSpec {
  readonly load: () => Future<unknown>;
  readonly degradesSilently: boolean;
}

const SLOTS: Record<ProjectSlot, SlotSpec> = {
  [ProjectSlot.ThemeColors]: {
    load: () => import("@app/public/theme/colors.ts"),
    degradesSilently: true,
  },
  [ProjectSlot.ThemeFonts]: {
    load: () => import("@app/public/theme/fonts.ts"),
    degradesSilently: true,
  },
};

/**
 * The {@link ProjectHost} this framework installs: a project's own code, imported in-process.
 *
 * @remarks
 * Every slot resolves through a dynamic `@app/` import, cached after the first resolution so a
 * slot that failed once does not retry the import on every later call.
 */
export class InProcessHost implements ProjectHost {
  readonly #resolved = new Map<ProjectSlot, unknown>();

  /**
   * The {@link ProjectHost.load} implementation.
   *
   * @remarks
   * Whether a failed import logs depends on `degradesSilently`: a theme override is optional by
   * design, so a project that never wrote one should not see a warning at every boot, while a slot
   * meant to always exist would need its failure heard. Both currently declared slots degrade
   * silently, since neither theme override is required.
   */
  async load<T>(slot: ProjectSlot): Future<T | null> {
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
