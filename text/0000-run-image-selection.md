# Meta
[meta]: #meta
- Name: Dynamic Runtime Base Image Selection
- Start Date: 2021-06-30
- Author(s): sclevine
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: [RFC0069](https://github.com/buildpacks/rfcs/blob/main/text/0069-stack-buildpacks.md), [RFC#167](https://github.com/buildpacks/rfcs/pull/167), many others
- Depends on: [RFC#172](https://github.com/buildpacks/rfcs/pull/172)

# Summary
[summary]: #summary

*NOTE: This proposal is part of a larger initiative to reduce complexity originally outlined in https://github.com/buildpacks/rfcs/pull/167*

This RFC introduces functionality for dynamically selecting runtime  base images, as a partial alternative to stackpacks (along with [RFC#173](https://github.com/buildpacks/rfcs/pull/173)).

# Motivation
[motivation]: #motivation

- Buildpacks on the same builder may have different OS package requirements.
- OS package requirements may vary based on the type of application.

# What it is
[what-it-is]: #what-it-is

This RFC proposes that we allow buildpacks to select a minimal runtime base image during detection.

# How it Works
[how-it-works]: #how-it-works

Builders may specify an ordered list of runtime base images, where each entry may contain a list of runtime base image mirrors.

Buildpacks may specify a list of package names (as [PURL URLs](https://github.com/package-url/purl-spec) without versions or qualifiers) in a `packages` table in the build plan during detection.

The first runtime base image that contains all required packages is selected. When mirrors are present, the runtime base image mirror matching the app image is always used, including for package queries.

# Drawbacks
[drawbacks]: #drawbacks

- Involves breaking changes.
- Buildpacks cannot install OS packages directly, only select runtime base images.

# Alternatives
[alternatives]: #alternatives

- Stackpacks
- Only allow app developers to install OS packages (using Dockerfiles via [RFC#172](https://github.com/buildpacks/rfcs/pull/172))

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should packages be determined during the detect or build phase? Opinion: detect phase, so that a runtime base image's app-specified Dockerfiles may by applied in parallel to the buildpack build process.

