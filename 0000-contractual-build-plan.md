# Meta 
[meta]: #meta
- Name: Contractual Build Plan
- Start Date: 2019-04-12
- CNB Pull Requests: (spec PR to follow)
- CNB Issues: (lifecycle issues to follow)

# Motivation
[motivation]: #motivation

This proposal suggests a new contract for generating the build plan and bill-of-materials that is easy to understand and more straightforward.

While the current build plan contract is superficially simple, buildpacks use currently use it in ways that are occasionally difficult to understand or explain.

For example, some buildpacks "push" dependencies they plan to provide into the build plan, while other buildpacks "pull" dependencies they need from other buildpacks by placing them in the build plan.

Additionally, reading an incremental build plan during the detection phase isn't necessary to accomplish the current use cases for the build plan.

# What it is
[what-it-is]: #what-it-is

This RFC proposes a breaking change to the build plan contract.
Changes would consist of modifications to the buildpack specification and to the lifecycle detector.

It affects buildpack developers who implement modular, interdependent buildpacks.

# How it Works
[how-it-works]: #how-it-works

## Overview of Changes

- `/bin/detect` no longer receives a build plan on stdin.
- In `/bin/detect`, buildpacks contribute two sections to the build plan: `requires` and `provides`
- Every required dependency must be provided for detection to pass.
- Every provided dependency must be required for detection to pass.
- If an optional buildpack provides a dependency that is not required, it is excluded from consideration.
- If an optional buildpack requires a dependency that is not provided, it is excluded from consideration.
- Multiple buildpacks may require or provide the same dependency.

## Build Plan Contributions during Detection

Example: 
```
[[requires]]
name = "nodejs"
version = "1.x"
[[requires.metadata]]
something = "12"

[[provides]]
name = "nodejs"
```

## Build Plan Output during Build

Example:
```
[[nodejs]]
name = "nodejs"
version = "1.x"
[[nodejs.metadata]]
something = "12"
```

## User Interface

### Buildpack Developer

# Unanswered Questions
[questions]: #questions


# Drawbacks
[drawbacks]: #drawbacks


# Alternatives
[alternatives]: #alternatives

Keeping the current build plan mechanism.
