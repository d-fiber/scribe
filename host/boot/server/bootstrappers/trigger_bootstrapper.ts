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

import { triggerRegistry } from "@scribe/foundation/src/trigger/core/registry.ts";
import { syncDeclaredSources } from "@scribe/foundation/src/trigger/db/sources.ts";
import { triggerRunner } from "@scribe/foundation/src/trigger/runner/trigger_runner.ts";
import type { Bootstrapper } from "../../lifecycle/bootstrapper.ts";

/**
 * Tells Postgres which tables emit, then starts draining what it writes.
 *
 * A failure here stops the boot on purpose. Everything else about a trigger fails loudly, but
 * a control table that was not written leaves the declarations armed and the tables silent,
 * which is the one failure nothing else would report.
 */
export class TriggerBootstrapper implements Bootstrapper {
  readonly name = "trigger";

  async boot(): Promise<void> {
    console.info(triggerRegistry.report());

    if (triggerRegistry.list().length > 0) {
      const tables = await syncDeclaredSources();
      console.info(`[trigger] ${tables} table(s) recorded as emitting`);
    }

    triggerRunner.start();
  }
}
