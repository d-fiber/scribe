# Changelog

Every entry comes from a commit subject. Versions are not written by hand:
`.github/versioning/bump.py` compares the public surface of each component and
decides what the change is worth.

## 0.1.1 (2026-08-16)

Component versions: @dependencies/core 0.1.1, @scribe/sdk 0.1.1

### Fixed

- stop gitignore from swallowing the storage module (032ff74c)

### Security

- put the contributor agreement in force (617a27df)

### Tooling

- track host/deno.lock so CI resolves the same types (b75c28bc)
- keep host on the global cache so react types resolve (78dbabd5)
- use fiberstudio.app as the CLA employer domain (b560af31)
- let the owner bypass the rulesets and fix CODEOWNERS (f55faa27)
- install the npm dependencies before deno lint and check (2e119fc3)
