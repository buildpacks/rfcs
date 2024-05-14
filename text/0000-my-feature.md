# Meta
[meta]: #meta
- Name: Implementing pack detect command
- Start Date: 2024-02-15
- Author(s): @rashadism
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

The `pack detect` command is introduced to the Cloud Native Buildpacks ecosystem, providing a way to run only the detect phase of the buildpack lifecycle. This feature enhances the developer experience by allowing them to quickly determine which buildpacks are relevant for their application without progressing through the entire build process. This was partially discussed in [issue #681](https://github.com/buildpacks/pack/issues/681) but the issue was about implementing a `dry-run` flag. With further discussion with @jjbustamante, decided to go forward with this as a new pack pack command rather than a flag.

# Definitions
[definitions]: #definitions

Make a list of the definitions that may be useful for those reviewing. Include phrases and words that buildpack authors or other interested parties may not be familiar with.

# Motivation
[motivation]: #motivation

- Simplify and streamline the build process by providing a targeted command for buildpack detection.
- Reduce build times by skipping unnecessary phases of the buildpack lifecycle.
- Enable developers to quickly identify which buildpacks are applicable to their application without waiting for the entire build process to complete, or having to `Ctrl+C` midway through.
- Lighter-weight integration testing of the build plan.

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

Ideally, the user should run something like `pack detect --path ./path/to/project --builder builder:name` and it should run the analyze binary, followed by the detect binary in the lifecycle and output the logs / output of it. Preferrably, can also output the `group.toml` to a directory specified with `--detect-output-dir`. The reason to run the analyze binary is to get information about the run image that may impact the outcome of detect via CNB_TARGET_* environment variables.

The following flags should be supported and they will work more or less like `pack build`.

|Short|Long|type|
|----|-------------|----|
|-B |--builder|string|
|-b |--buildpack|strings|
|-r |--buildpack-registry|string|
||--detect-output-dir|string|
|-d|--descriptor|string|
||--docker-host|string|
|-e|--env|stringArray|
||--env-file|stringArray|
||--extension|strings|
||--gid|int|
|-h|--help|
||--lifecycle-image|string|
||--network|string|
|-p|--path|string|
||--post-buildpack|stringArray|
||--pre-buildpack|stringArray|
||--pull-policy|string|
||--run-image|string|
||--uid|int|
||--workspace|string|


# Migration
[migration]: #migration

This feature does not introduce any breaks to public APIs or compatibility. It provides additional functionality within the existing Cloud Native Buildpacks CLI tooling, enhancing the developer experience without requiring changes to existing workflows or configurations.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

# Alternatives
[alternatives]: #alternatives

Initially thought of implementing this through something like `pack build --detect`. But after further discussion with @jjbustamante and for the following reasons, decided to do this functionality to a new command.
- The main use case of `pack build` is to create OCI images, and detect is just a binary in the lifecycle, so it doesn't make much sense to include it in there.
- To avoid making the mostly used `pack build` command overly complicated.

Also, instead of `pack detect`, something like `pack execute --phase detect` can also be done, where the user can select exclusively what phase they need to run. Can start by implementing just the `detect` phase.

# Prior Art
[prior-art]: #prior-art

This has been discussed in Issue #681 before, and looked like it was a long awaited feature and currently a few workarounds are being used to get this functionality.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

Fill after initial discussion

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
Since this is a new command, the functionality of this command will have to be amended to the spec / docs.

# History
[history]: #history

<!--
## Amended
### Meta
[meta-1]: #meta-1
- Name: (fill in the amendment name: Variable Rename)
- Start Date: (fill in today's date: YYYY-MM-DD)
- Author(s): (Github usernames)
- Amendment Pull Request: (leave blank)

### Summary

A brief description of the changes.

### Motivation

Why was this amendment necessary?
--->