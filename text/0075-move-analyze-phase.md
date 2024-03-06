# Meta
[meta]: #meta
- Name: Move analyze phase
- Start Date: 2021-01-13
- Author(s): [@jkutner](github.com/jkutner/) [@jabrown85](github.com/jabrown85)
- Status: Implemented
- RFC Pull Request: [rfcs#135](https://github.com/buildpacks/rfcs/pull/135)
- CNB Pull Request: [buildpacks/spec#172](https://github.com/buildpacks/spec/pull/172)
- CNB Issue: [buildpacks/spec#194](https://github.com/buildpacks/spec/issues/194), [buildpacks/lifecycle#530](https://github.com/buildpacks/lifecycle/issues/530), [buildpacks/pack#1078](https://github.com/buildpacks/pack/issues/1078), [buildpacks/docs#302](https://github.com/buildpacks/docs/issues/302)
- Supersedes: N/A

# Summary
[summary]: #summary

This is a proposal to re-order and adjust Lifecycle phases. Specifically, moving "analyze" before "detect".

# Motivation
[motivation]: #motivation

Doing this would support the following features and capabilities:
* [Stack buildpacks](https://github.com/buildpacks/rfcs/pull/111), which require a phase to read run-image mixins validation prior to detection
* Validating registry access for all images that are used can happen prior to `detector` or `builder` phases, providing faster failures for end users.

# What it is
[what-it-is]: #what-it-is

The analyze phase will now run before the detect phase. The analyze phase will have access to secrets and credentials used to access registries and other services, as it does today. Analyze will no longer require a [`group.toml`](https://github.com/buildpacks/spec/blob/main/platform.md#grouptoml-toml). It will do this by splitting off some of the responsibilites into the restore phase.

## New Responsibilities in analzyer

* Stack validation, to ensure that a new run-image is compatible with the previous app image
* Retrieve identifier (imageID or digest), stack ID, and mixins, which will be used by subsequent phases
* Validation of registry credentials, to avoid a long build that fails during export phase

## Inputs

* Log level
* Run-image
* Stack ID
* [stack.toml](https://github.com/buildpacks/spec/blob/main/platform.md#stacktoml-toml)
* Previous Image
* Cache Image
* Destination tag(s)
* Cache Dir
* gid
* uid
* Path to output analyzed.toml
* Layers Directory
* Daemon

## Output

* Exit status
* Info-level logs to `stdout`
* Error-level logs to `stderr`
* Analysis metadata [`analyzed.toml`](https://github.com/buildpacks/spec/blob/main/platform.md#analyzedtoml-toml), including run-image information.

# How it Works
[how-it-works]: #how-it-works

A platform MUST execute the analyze phase either by invoking the `/cnb/lifecycle/analyzer` binary or by executing `/cnb/lifecycle/creator`.

The `analyzer` binary will have access to the [`Keychain`](https://github.com/buildpacks/lifecycle/blob/main/auth/env_keychain.go), and MUST NOT execute arbitrary code provided by either the buildpack user or buildpack author.

The [logic in the `analyzer` phase that reads image metadata and outputs an `analyzed.toml`](https://github.com/buildpacks/lifecycle/blob/main/analyzer.go#L34-L40) would be remain.

The [logic in the `analyzer` phase that analyzes layers](hhttps://github.com/buildpacks/lifecycle/blob/main/analyzer.go#L54-L116) would be moved to the `restorer`. `restorer` already takes in `group.toml` as a flag.

# Drawbacks
[drawbacks]: #drawbacks

* Platform maintainers will need to update the order of their container execution and also update flags for `analyzer`, `detector`, and `restorer`.

# Alternatives
[alternatives]: #alternatives

- [Introduce Prepare Phase](https://github.com/buildpacks/rfcs/blob/4547fe1ce602877db24f09e5b08bc9713c979be0/text/0000-prepare-phase.md) (this same rfc, previous version)

# Prior Art
[prior-art]: #prior-art

- [Tekton prepare step](https://github.com/tektoncd/catalog/blob/11a17cfe87779099b0b61be3f1e496dfa79646b3/task/buildpacks-phases/0.1/buildpacks-phases.yaml#L61-L78)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- How should `analyzed.toml` be changed to include run-image information (mixins)

# Spec. Changes
[spec-changes]: #spec-changes

See [buildpacks/spec PR #172](https://github.com/buildpacks/spec/pull/172)
