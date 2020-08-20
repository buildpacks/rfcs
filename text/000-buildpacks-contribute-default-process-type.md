# Meta
[meta]: #meta
- Name: Buildpacks should be able to define the default process type for an app
- Start Date: 8/20/20
- Author(s): natalieparellano
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: n/a

# Summary
[summary]: #summary

Today, if a buildpacks user would like to define a default process type for their app, they need to pass `-process-type` to the exporter. This is cumbersome because a user might not know which process types are available until after the build has completed. Additionally, [this spec PR](https://github.com/buildpacks/spec/pull/137) would force some users who are currently relying on the lifecycle to specify the default process type to pass `-process-type` instead. This RFC proposes that buildpacks should be able to define the default process type for an app, while retaining the ability for a user to specify the default process type.

# Definitions
[definitions]: #definitions

launcher - a [lifecycle binary](https://github.com/buildpacks/spec/blob/main/platform.md#launcher) that is responsible for starting app processes. An app image built with CNBs will have the launcher's path (or a symlink to it) in its [entrypoint](https://github.com/opencontainers/image-spec/blob/master/config.md#properties).

process type - represents one process that can be started by the launcher. A process type has the following properties as described [here](https://github.com/buildpacks/spec/blob/main/buildpack.md#launchtoml-toml): type (string), command (string), arguments (array of string), direct (boolean). Buildpacks declare process types during the `build` phase by writing entries into `<layers>/launch.toml`.

default process type - the process that will be started by the launcher when the app image is run. It can be overriden by overriding the image entrypoint.

# Motivation
[motivation]: #motivation

- Why should we do this?
- What use cases does it support?
- What is the expected outcome?

# What it is
[what-it-is]: #what-it-is

This provides a high level overview of the feature.

- Define any new terminology.
- Define the target persona: buildpack author, buildpack user, platform operator, platform implementor, and/or project contributor.
- Explaining the feature largely in terms of examples.
- If applicable, provide sample error messages, deprecation warnings, or migration guidance.
- If applicable, describe the differences between teaching this to existing users and new users.

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
