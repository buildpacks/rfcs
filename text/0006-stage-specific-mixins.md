# Meta
[meta]: #meta
- Name: Stage-specific Mixins
- Start Date: 2019-06-13
- CNB Pull Requests: [rfcs#13](https://github.com/buildpacks/rfcs/pull/13), [spec#54](https://github.com/buildpacks/spec/pull/54)
- CNB Issues: (lifecycle issues to follow)


# Motivation
[motivation]: #motivation

This proposal makes it easier to extend stack images with mixins.

# What it is
[what-it-is]: #what-it-is

This RFC proposes a method for annotating mixins that are necessary during build or launch but not for both stages.

# How it Works
[how-it-works]: #how-it-works

## Overview of Changes

- Run and build images with the same stack ID can be used together, even if they specify different mixin sets.
- Buildpacks, buildpackages, and builders may specify that only the run half or build half of a mixin is necessary by prepending `run:` or `build:` to its name.
- A buildpack requesting `build:git` only requires the `git` mixin by applied to the build image.
- A mixin continues to be separate, idempotent changes to the run and/or build images.
- Mixin names cannot otherwise contain the `:` character.

## User Interface

### Buildpack Developer

Stack section of `buildpack.toml`, `package.toml`:

```toml
[[stacks]]
id = "io.buildpacks.stacks.bionic"
mixins = ["build:git"]
```

Stack section of `builder.toml`:

```toml
[stack]
id = "io.buildpacks.stacks.bionic"
mixins = ["build:git"]
build-image = "registry.example.com/build"
run-image = "registry.example.com/run"
run-image-mirrors = ["registry2.example.com/run"]
```

Note: mixins in `buildpack.toml` or `package.toml` are a minimum required set.
Mixins in `builder.toml` must match the specified images.

# Unanswered Questions
[questions]: #questions

TDB

# Drawbacks
[drawbacks]: #drawbacks

TDB

# Alternatives
[alternatives]: #alternatives

Keep current mixin mechanism.
