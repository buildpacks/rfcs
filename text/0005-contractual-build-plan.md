# Meta 
[meta]: #meta
- Name: Contractual Build Plan
- Start Date: 2019-04-12
- CNB Pull Requests: [rfcs#12](https://github.com/buildpack/rfcs/pull/12), [spec#52](https://github.com/buildpack/spec/pull/52), [lifecycle#149](https://github.com/buildpack/lifecycle/pull/149)
- CNB Issues: (lifecycle issues to follow)

# Motivation
[motivation]: #motivation

This proposal suggests a new contract for generating the build plan and bill-of-materials that is easier to understand and more straightforward compared to the current method.
In addition, it fixes a critical design flaw in the current build plan mechanism: two buildpacks that require the same dependency at different stages (build vs. launch) will often result in unclear build failures due to the second request overriding the first request.

## Drawbacks of the current model

While the current build plan contract is superficially simple, buildpacks currently use it in ways that are occasionally difficult to understand or explain.
For example, some buildpacks "push" dependencies they plan to provide into the build plan, while other buildpacks "pull" dependencies they need from other buildpacks by placing them in the build plan.

Additionally, reading an incremental build plan during the detection phase is not necessary to accomplish the current use cases for the build plan.

## Benefits of the proposed model

- Accounts for all current use cases while applying a tighter, "pull-only" contract
- Speeds up detection
- Simplifies writing modular buildpacks
- Easier to understand

# What it is
[what-it-is]: #what-it-is

This RFC proposes a breaking change to the build plan contract.
Changes would consist of modifications to the buildpack specification and lifecycle.

It affects buildpack developers who implement modular, interdependent buildpacks.

# How it Works
[how-it-works]: #how-it-works

## Overview of Changes

- `/bin/detect` no longer receives a build plan on stdin.
- In `/bin/detect`, buildpacks contribute two sections to the build plan: `requires` and `provides`
- Every required dependency must be provided by the current buildpack or a previous buildpack one or more times for detection to pass.
- Every provided dependency must be required one or more times for detection to pass.
- If an optional buildpack provides a dependency that is not required, it is excluded from consideration.
- If an optional buildpack requires a dependency that is not provided, it is excluded from consideration.
- Multiple buildpacks may require or provide the same dependency.
- `/bin/build` no longer receives a build plan on stdin.
- `/bin/build`'s build plan argument contains required dependencies that it provides.
- `/bin/build` may refine its build plan to contain additional dependency metadata. 
- `/bin/build` may remove all entries for a dependency in its build plan to allow a subsequent buildpack to provide that dependency.

## Examples

### Build Plan Contributions during Detection

Node Engine Buildpack:
```toml
[[provides]]
name = "nodejs"
```

NPM Buildpack:
```toml
[[requires]]
name = "nodejs"
version = "1.x"
[requires.metadata]
something = "12"

[[requires]]
name =  "node_modules"

[[provides]]
name = "node_modules"
```

### Build Plan Input during Build

Node Engine Buildpack:
```toml
[[nodejs]]
version = "1.x"
[nodejs.metadata]
something = "12"
```

NPM Buildpack:
```toml
[[node_modules]]
```

## Bill-of-Materials

When combined:
```toml
[[nodejs]]
version = "1.2.3"
[nodejs.metadata]
something = "12"
arch = "x86_64"

[[node_modules]]
packages = ["..."]
```

# Questions
[questions]: #questions

1. Should we provide an alternative version of `[[require]]` that also provides? Alternatively, should `[[require]]` have a `provide = true` option?

2. How can a buildpack require either of two different dependencies, but not both?

   With the [distribution spec](https://github.com/buildpack/rfcs/blob/dist-spec/0000-spec-distribution.md), complex logic can be expressed by multiple buildpacks that live in the same repository. These buildpacks may have the same source.

# Unanswered Questions
[unanswered-questions]: #unanswered-questions

N/A

# Drawbacks
[drawbacks]: #drawbacks

1. It's no longer possible to push structured data to subsequent buildpacks during detection.

2. Breaking change for all current buildpacks that use the build plan.

# Alternatives
[alternatives]: #alternatives

Keeping the current build plan mechanism.
