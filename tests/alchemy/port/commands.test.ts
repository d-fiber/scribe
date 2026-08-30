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

import "@scribe/runtime/scholium/runner.ts";
import { Commands } from "@scribe/alchemy";
import { equals, expect, isA, isTrue, MemoryCommands, Scribe, throwsA } from "@scribe/alchemy/test";

Scribe.test(
  "a run is answered with the result the runner was built with",
  async () => {
    const runner = new MemoryCommands({
      code: 0,
      stdout: new Uint8Array([1, 2, 3]),
    });

    const result = await runner.run("ffmpeg", ["-version"]);

    expect(result.code, equals(0), "the exit code did not come back");
    expect(
      [...result.stdout],
      equals([1, 2, 3]),
      "the output did not come back",
    );
    expect(
      [...result.stderr],
      equals([]),
      "a stream nobody filled came back non-empty",
    );
  },
);

Scribe.test("a field left out of the answer takes its empty value", async () => {
  const runner = new MemoryCommands();

  const result = await runner.run("true", []);

  expect(result.code, equals(0), "the default exit code was not zero");
  expect(result.stdout.length, equals(0), "the default output was not empty");
});

Scribe.test(
  "the runner keeps every run it was asked for, with its arguments and its input",
  async () => {
    const runner = new MemoryCommands();

    await runner.run("ffmpeg", ["-i", "in.mp4"], {
      stdin: new Uint8Array([9]),
    });
    await runner.run("ffprobe", ["in.mp4"]);

    expect(runner.seen.length, equals(2), "the runs were not all kept");
    expect(
      runner.seen[0].program,
      equals("ffmpeg"),
      "the first program was wrong",
    );
    expect(
      runner.seen[0].args,
      equals(["-i", "in.mp4"]),
      "the first arguments were wrong",
    );
    expect(
      [...runner.seen[0].stdin!],
      equals([9]),
      "the standard input was not kept",
    );
    expect(
      runner.seen[1].stdin,
      equals(undefined),
      "an input nobody gave was kept",
    );
  },
);

Scribe.test(
  "a function answer sees the program and the arguments of the run",
  async () => {
    const runner = new MemoryCommands((program, args) =>
      program === "ffmpeg" && args.includes("-frames:v") ? { code: 0, stdout: new Uint8Array([7]) } : { code: 1 }
    );

    const sampled = await runner.run("ffmpeg", ["-frames:v", "5"]);
    const other = await runner.run("ffmpeg", ["-version"]);

    expect(
      [...sampled.stdout],
      equals([7]),
      "the matching run got the wrong answer",
    );
    expect(other.code, equals(1), "the non-matching run got the wrong answer");
  },
);

Scribe.test(
  "only hands back the single run, and throws once there is more than one",
  async () => {
    const runner = new MemoryCommands();

    await runner.run("true", []);
    expect(
      runner.only.program,
      equals("true"),
      "only did not hand back the single run",
    );

    await runner.run("true", []);
    expect(() => runner.only, throwsA(isA(Error)));
  },
);

Scribe.test(
  "the slot answers with whatever a host or a test put in it",
  async () => {
    const held = Commands.configured ? Commands.get() : null;
    Commands.use(new MemoryCommands({ code: 42 }));

    try {
      expect(Commands.configured, isTrue, "the slot stayed empty after use");
      const result = await Commands.get().run("anything", []);
      expect(
        result.code,
        equals(42),
        "the slot answered with the wrong runner",
      );
    } finally {
      if (held === null) Commands.clear();
      else Commands.use(held);
    }
  },
);
