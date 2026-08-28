# Changelog

Every entry comes from a commit subject, grouped by its tag. The version is moved by hand in `deno.json`, and the
section below it is written by the CI the moment it moves, from the commits since the last tag.

## 1.0.0

The framework starts again here. What came before it was numbered by a tool that read the public surface of each
component and decided on its own what a change was worth, and eleven majors in a few weeks is what that produced while
the tree was being taken apart. Those numbers named nothing anybody had released, so they are gone rather than renamed.

This is the first version whose shape is meant to hold:

- every layer of `engine/` is a workspace member that declares what it may import, so a layer reaching upward fails
  `deno check` instead of a lint rule that stops working when the checkout is renamed
- the eight packages type check, and the gate looks at them
- `db/`, `packages/` and `public/` sit beside `engine/` rather than inside it
- the version lives in `deno.json`, because scribe is one Deno project
