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

This change removes the restriction that buildpacks must specify at least one stack in `buildpack.toml`. When buildpacks specify no stacks, the lifecycle will assume that the buildpack is valid on all stacks.

# Motivation
[motivation]: #motivation

Some buildpacks are simple and/or don't tightly depend on underlying stack functionality. These buildpacks may not need to specify that they work on many different Linux distros.

# What it is
[what-it-is]: #what-it-is

The `buildpack.toml` file currently requires a `[[stacks]]` object list at the top-level. When this object list is empty or not present, this proposal requires that platforms and lifecycles allow the buildpack to be:
1. Runnable on any stack, regardless of stack ID or mixins.
2. Includable in any buildpackage, and reference-able in any meta-buildpack's `buildpack.toml` file.


# Drawbacks
[drawbacks]: #drawbacks

Buildpack authors many inadvertently leave `[[stacks]]` out (by mistake, or due to lack of knowledge of stacks). If they have stack-specific logic in their buildpacks (e.g., the buildpack is a Ruby script), it would fail at build-time. If this happens to many buildpacks, end-users would suffer more failed buildpacks. More generally, the `[[stacks]]` array may turn into something that's only used to specify mixins in practice.

# Alternatives
[alternatives]: #alternatives

- We could add a special field that indicates any-stack compatibility, so that buildpack authors need to explicitly opt-in to the new behavior. This would prevent buildpack authors who don't know about stacks from inadvertently declaring any-stack compatibility without adequate testing.
- The recent merged RFC to make stack IDs more general (e.g., `io.buildpacks.stacks.bionic` vs `com.example.mycompany.stack`) already improves the situation.


# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should we introduce a different parameter to buildpack.toml to differentiate Linux stacks from Windows stacks? If we don't do that, then simple any-stack Linux buildpacks might be usable on Windows. (This may not matter if Linux buildpacks are packaged differently from Windows buildpacks.)

# Spec. Changes
[spec-changes]: #spec-changes

The spec would be updated to remove the restriction that stacks are required in `buildpack.toml`.
