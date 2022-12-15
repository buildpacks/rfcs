# Meta
[meta]: #meta
- Name: Opt-in Layer Caching
- Start Date: 2020-07-26
- Author(s): @sclevine
- Status: Implemented
- RFC Pull Request: [rfcs#99](https://github.com/buildpacks/rfcs/pull/99)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

Restored layers are currently re-cached automatically. This RFC proposes that buildpacks must opt-in to re-caching.

# Motivation
[motivation]: #motivation

- If the latest version of the buildpack is not aware of layers created by **any** earlier version of the buildpack and it doesn't remove all unrecognized layers, those layers may stick around indefinitely. This may lead to unexpected behavior and/or security vulnerabilities.
- Logic to remove unrecognized layers could be removed from buildpacks and buildpack libraries like `libcnb`.

# What it is
[what-it-is]: #what-it-is

Currently, layers may be cached by setting flags in `<layers>/<layer>.toml` (`cache = true`, `launch = true`, or both, depending on the type of caching). If `cache = true` is set, both `<layers>/<layer>/` and `<layers>/<layer>.toml` are restored on the next build. If only `launch = true` is set, only `<layers>/<layer>.toml` is restored on the next build.

This RFC proposes that in all restore cases, `<layers>/<layer>.toml` is instead restored with no `launch`, `build`, or `cache` flags set. Additionally,  `<layers>/<layer>` directories with no flags set to true would be renamed to `<layers>/<layer>.ignore` by the lifecycle at the end of any individual buildpack's build process.

Note that if we don't rename the layer directory immediately (or alternatively, remove it), subsequent buildpacks could still have layers that depend on them via recorded paths that were transmitted via build-time env vars during the previous build. Such layers may pass build-time validations that should actually fail.


# Drawbacks
[drawbacks]: #drawbacks

- This is a large breaking change that would immediately disable caching for all existing buildpacks.
- This requires that buildpacks replace their current cleanup logic with caching opt-in logic.
- Buildpack authors may forget to opt-in, resulting in slower builds.

# Alternatives
[alternatives]: #alternatives

- Keep current behavior.
- Previous iterations of this proposal included renaming layer directories or TOML files before the build process.

# Spec. Changes
[spec-changes]: #spec-changes

This RFC would modify portions of the spec that deal with cache restoration.
