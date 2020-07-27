# Meta
[meta]: #meta
- Name: Opt-in Layer Caching
- Start Date: 2020-07-26
- Author(s): @sclevine
- RFC Pull Request: (leave blank)
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

This RFC proposes that in all restore cases, `<layers>/<layer>.toml` is instead restored as `<layers>/<layer>.toml.restore`. Additionally, `<layers>/<layer>.toml.restore` files and corresponding `<layers>/<layer>` directories would be immediately **removed** by the lifecycle at the end of the individual buildpack's build process. This means that such layers would not be exposed to subsequent buildpacks or exported into the app image.

Note that if we don't remove the layer directory immediately (or alternatively, rename it instead), subsequent buildpacks could still have layers that depend on them via recorded paths that were transmitted via build-time env vars during the previous build. Such layers may pass build-time validations that should actually fail.


# Drawbacks
[drawbacks]: #drawbacks

- This is a large breaking change that would immediately disable caching for all existing buildpacks.
- This requires that buildpacks replace their current cleanup logic with caching opt-in logic.
- Buildpack authors may forget to opt-in, resulting in slower builds.

# Alternatives
[alternatives]: #alternatives

- Keep current behavior.
- Rename the layer directory to `<layers>/<layer>.restore/` in addition to renaming the `<layers>/<layer>.toml` files to `<layers>/<layer>.toml.restore`. This would allow the lifecycle build phase to ignore the layers instead of deleting them, (which may be desirable for performance). The rename would have to apply to both files, given that `launch = true` + `cache = false` layers don't have a `<layers>/<layer>` directory that is restored.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

I would like feedback on the renaming UX. Renaming both the layer directory and TOML file seems messy, but having the lifecycle delete restored files during the buildpack build phase also seems messy.

# Spec. Changes
[spec-changes]: #spec-changes

This RFC would modify portions of the spec that deal with cache restoration.
