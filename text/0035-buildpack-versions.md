# Meta
[meta]: #meta
- **Name:** Semantic Version Formats for Buildpack Versions
- **Start Date:** 2020-03-11
- **Supersedes:** N/A

# Summary
[summary]: #summary

The Buildpacks team wants to enforce format requirements for buildpack versions but will not require version semantics. This RFC explains that buildpack authors are expected to use [semantic version](https://semver.org/) format without enforcing any semantic versioning rules.

# Motivation
[motivation]: #motivation

There aren't specific guidelines in the buildpack documentation or spec for buildpack authors that explain how versioning works for buildpacks. It should be explicitly stated that the API expects a semantic version format and that authors are not required to follow semantic version semantics.

Additionally, there are benefits of having a defined format because tools, such as `pack`, will be able to sort and filter buildpacks as needed. For example, with an expected semantic version format, a `latest` version is defined.

# What it is
[what-it-is]: #what-it-is

Buildpack authors are required to use the semantic versioning format, such as `0.10.4`. Currently, the Buildpack API already works with any version format. This requires no additional code to the current code bases, but instead clarification around what the Buildpacks projects expect.

# How it Works
[how-it-works]: #how-it-works

The Buildpacks team is making a commitment to the future of the project that buildpack developers will have the freedom to use any rules for versioning while using the semantic version format, and this decisions will not break the Buildpack API.

### Tasks to complete:
- explicitly state that semantic version format is expected in the buildpack spec, as well as the docs
- change any current messaging (ie. variable names or code comments) that states otherwise

# Drawbacks
[drawbacks]: #drawbacks

- This decision may lead to inconsistency across buildpacks for developers that are using buildpacks or multiple buildpacks.
- Buildpack authors may request more guidance on buildpack versioning.

# Alternatives
[alternatives]: #alternatives

- Do nothing/Don't explicitly specify expected version format.
  - Ideally, we don't want to make future versions of buildpacks incompatible with what the Buildpacks team expects the future Buildpack API to look like, such as expecting a semantic version format for sorting.
- Enforce semantic versioning rules for buildpack versions.
  - There isn't an immediate benefit to this since versioning can tie into a development process and workflow (and should not be dictated by the tool).

# Prior Art
[prior-art]: #prior-art

- Semantic Versioning docs: https://semver.org/
- Issue opened to specify version requirements in the spec: https://github.com/buildpacks/spec/issues/72
- Code comment that makes it seem sem-ver is expected: https://github.com/buildpacks/libbuildpack/blob/b2e4a9ef07aff26c430dfac2fbc928ee4164af35/buildpack/info.go#L27

# Spec. Changes
[spec-changes]: #spec-changes

The RFC proposes a breaking change to the spec because it will enforce a buildpack version format that is not specified. It will need to be defined here: https://github.com/buildpacks/spec/blob/master/buildpack.md#buildpacktoml-toml

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- N/A
