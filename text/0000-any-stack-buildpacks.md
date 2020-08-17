# Meta
[meta]: #meta
- Name: Stackless Buildpacks
- Start Date: 2020-07-26
- Author(s): @sclevine
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This change allows buildpack authors to explicitly remove the restriction that buildpacks must specify at least one stack in `buildpack.toml`. When buildpacks specify a wildcard stack value, the lifecycle will assume that the buildpack is valid on all stacks.

# Motivation
[motivation]: #motivation

Some buildpacks are simple and/or don't tightly depend on underlying stack functionality. These buildpacks may not need to specify that they work on many different Linux distros.

# What it is
[what-it-is]: #what-it-is

The `buildpack.toml` file currently requires a `[[stacks]]` object list at the top-level. When this object list contains an entry with `id = "*"`, this proposal requires that platforms and lifecycles allow the buildpack to be:
1. Runnable on any stack, regardless of stack ID or mixins.
2. Includable in any buildpackage, and reference-able in any meta-buildpack's `buildpack.toml` file.

For any stack entry with `id = "*"`, the value of `mixins` must be empty or not set.


# Drawbacks
[drawbacks]: #drawbacks

Buildpack authors many decide to declare compatibility with any stack without careful consideration. If they have stack-specific logic in their buildpacks (e.g., the buildpack is a Ruby script), they would fail at build-time. If this happens to many buildpacks, end-users would suffer more failed buildpack builds.

# Alternatives
[alternatives]: #alternatives

- We could leave `stacks` empty to specify any-stack compatibility, so that buildpack authors don't need to explicitly opt-in to the new behavior. This may result in buildpack authors inadvertently declaring any-stack compatibility without adequate testing.
- The recent merged RFC to make stack IDs more general (e.g., `io.buildpacks.stacks.bionic` vs `com.example.mycompany.stack`) already improves the situation.


# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should we introduce a different parameter to buildpack.toml to differentiate Linux stacks from Windows stacks? If we don't do that, then simple any-stack Linux buildpacks might be usable on Windows. Given that Linux buildpacks are packaged differently from Windows buildpacks, I suggest we introduce this parameter in a separate RFC if needed.

# Spec. Changes
[spec-changes]: #spec-changes

The spec would be updated to define the special value of `id` for `stacks` in `buildpack.toml`.
