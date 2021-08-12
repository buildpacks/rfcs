# Meta
[meta]: #meta
- Name: Project TOML Converter
- Start Date: 10 Aug 2021
- Author(s): haliliceylan
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

The idea is to ship a binary with the lifecycle that would be responsible for translating project.toml from the schema defined in the project descriptor extension spec into something that the lifecycle knows the platform can understand i.e., a schema defined in the platform spec.

# Definitions
[definitions]: #definitions

* __project descriptor__ - the [`project.toml`](https://github.com/buildpacks/spec/blob/main/extensions/project-descriptor.md) extension specification

# Motivation
[motivation]: #motivation

- Actually this feature, sounds like part of prepare-phase. But this is so simple and we can build fast.
- Sometimes Operators has some issues with different project.toml files. As you know system operator can not easily upgrade their system packages, pack and buildpacks. So with this feature we are giving to developers able to use always latest version of project.toml. In same time we are giving to operators able to stable update scheduling.

- What is the expected outcome?

# What it is
[what-it-is]: #what-it-is

The Project TOML Converter is a CLI tool. seperated from pack and buildpack. It has only one responsibility, maintain project descriptor versions. support conversion between versions.

# How it Works
[how-it-works]: #how-it-works

This is the technical portion of the RFC, where you explain the design in sufficient detail.

The section should return to the examples given in the previous section, and explain more fully how the detailed proposal makes those examples work.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?
- Why is this proposal the best?
- What is the impact of not doing this?

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?
- What parts of the design do you expect to be resolved through implementation of the feature?
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
Does this RFC entail any proposed changes to the core specifications or extensions? If so, please document changes here.
Examples of a spec. change might be new lifecycle flags, new `buildpack.toml` fields, new fields in the buildpackage label, etc.
This section is not intended to be binding, but as discussion of an RFC unfolds, if spec changes are necessary, they should be documented here.
