# Meta
[meta]: #meta
- Name: Prepare Phase
- Start Date: 2021-01-13
- Author(s): [@jkutner](github.com/jkutner/)
- RFC Pull Request: (leave blank)
- CNB Pull Request: [buildpacks/spec#176](https://github.com/buildpacks/spec/pull/176)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This is a proposal for a new Lifecycle phase, called "prepare", that would run before all other phases.

# Definitions
[definitions]: #definitions

* __stack descriptor__ - an enhanced version of the [`stack.toml`](https://github.com/buildpacks/spec/blob/main/platform.md#stacktoml-toml)
* __project descriptor__ - the [`project.toml`](https://github.com/buildpacks/spec/blob/main/extensions/project-descriptor.md) extension specification

# Motivation
[motivation]: #motivation

The prepare phase would support the following features and capabilities:
* [Stack buildpacks](https://github.com/buildpacks/rfcs/pull/111), which require a phase to read run-image mixins validation prior to detection
* [Inline buildpacks](https://github.com/buildpacks/rfcs/blob/main/text/0048-inline-buildpack.md), which require parsing of the `project.toml` in the lifecycle
* [Lifecycle configuration](https://github.com/buildpacks/rfcs/pull/128)

# What it is
[what-it-is]: #what-it-is

The prepare phase will run before all other phases, and prepare the execution environment for a buildpack build. This phase will have access to secrets and credentials used to access registries and other services.

## Responsibilities

* Stack validation, to ensure that a new run-image is campatible with the previous app image
* Retrive run-image mixins, which will be use dby subsequent phases
* Validation of registry credentials, to avoid a long build that fails during export phase
* Parsing the project descriptor and performance various operations based on its contents, include:
    - downloading buildpacks
    - creating ephemeral buildpacks
    - applying include and exclude rules
    - modifying environment variables

## Inputs

* Log level
* Run-image
* Stack ID
* Project descriptor (optional)
* App source code

## Output

* Exit status
* Info-level logs to `stdout`
* Error-level logs to `stderr`
* Stack descriptor
* Analysis metadata
* Buildpacks (derived from inline buildpacks in project descriptor, or buildpacks in project descriptor that are not present in the builder)
* Order definition (derived from buildpacks configuration in project descriptor)
* Lifecycle configuration (derived from configuration in project descriptor)
* Mutated app source code (applying include and exclude rules in project descriptor)

# How it Works
[how-it-works]: #how-it-works

The prepare phase would be implemented as the `/cnb/lifecycle/preparer` binary. A platform MUST execute this phases either by invoking the `/cnb/lifecycle/preparer` binary or by executing `/cnb/lifecycle/creator`.

The `preparer` binary will have access to the [`Keychain`](https://github.com/buildpacks/lifecycle/blob/main/auth/env_keychain.go), and MUST NOT execute arbitrary code provided by either the buildpack user or buildpack author.

The [logic in the `analyzer` phase that reads image metadata and outputs an `analyzed.toml`](https://github.com/buildpacks/lifecycle/blob/main/analyzer.go#L34-L40) would be moved into the `preparer`.

The [logic in `pack` that parses a `project.toml`](https://github.com/buildpacks/pack/blob/main/project/project.go) would be copied or moved into the `preparer`.

The app source code (which may be provided to the prepare either as a directory, volume, or tarball) would be mutated (either by copying it to a new location, or making changes directory against it). The `preparer` may delete files to apply the include and exclude rules from `project.toml`.

# Drawbacks
[drawbacks]: #drawbacks

* Yet another lifecycle phase

# Alternatives
[alternatives]: #alternatives

- [Reverse the order of analyze and detect phases](https://github.com/buildpacks/spec/pull/172)
- Split analyze into two parts (one to write `analyzed.toml` and one to analyze layers). The first (`analyzed.toml`) would be moved before the detect phase, and the second part (analyzing layers) would be merged into the restore phase.

# Prior Art
[prior-art]: #prior-art

- [Tekton prepare step](https://github.com/tektoncd/catalog/blob/11a17cfe87779099b0b61be3f1e496dfa79646b3/task/buildpacks-phases/0.1/buildpacks-phases.yaml#L61-L78)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Do we still need `analyzer`, or can the remaining parts of analyze phase be rolled into restore phase?
- Does `pack` still need to parse `project.toml`, or is there value in reading it early on (before lifecycle runs)?
- Should we create a shared library for `project.toml` parsing?

# Spec. Changes
[spec-changes]: #spec-changes

See [buildpacks/spec PR #176](https://github.com/buildpacks/spec/pull/176)
