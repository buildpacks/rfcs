# Meta
[meta]: #meta
- Name: Execution Environments
- Start Date: 2023-01-11
- Author(s): @hone
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

Add support for different execution environments for buildpacks, with testing as the first use case.

# Definitions
[definitions]: #definitions

- Execution Environment - The target environment the OCI image is expected to be run in, i.e. production, test, development.

# Motivation
[motivation]: #motivation

The main way Buildpacks are being used is building production images, but this is only one piece of the software development process. Without a solid buildpack test environment story, users will be required alternatives for building their environment. A testing environment, while different, shares many of the same broad strokes ultimately producing an execution environment. This is something Buildpacks are well suited to solve.

# What it is
[what-it-is]: #what-it-is

## Test Environments

One of the goals in this design is to minimize the changes needed. The Buildpack lifecycle is already well suited to produce environments:

```
App Source -> OCI Image (Production Environment) -> Execute (Launch Process)
```

To create a test environment, it can follow the same flow:

```
App Source -> OCI Image (Test Environment) -> Execute (Test Process)
```

### Division of Responsibility
With the test OCI Image, a platform can execute the tests in the pipeline as they see fit. This means a bulk of the responsibilities are platform concerns:

- Set which environment to build for
- Decide which buildpacks to execute
- How to execute the tests
- What is the test result format like [TAP](https://en.wikipedia.org/wiki/Test_Anything_Protocol)?
- How to process the test results
- What to do with the results

This narrows the scope of the Buildpack responsibilities to what it's already good at:

- Produce Test Environment
- How to launch the process
  - launch.toml with test process marked as default (recommendation)

## Setting the Execution Enviroment for Build + Buildpack
A platform will set the `CNB_EXEC_ENV` env var to the execution environment desired. Buildpacks can than read this env var to branch or switch on logic needed based on the execution environment.

In addition, Builder Authors, Buildpack Authors, and App Developers will be able to specify various options to a specific execution enviroment using the `exec-env` key.

## Development Environments
The specifics of creating development enviroments are out of scope of this RFC, but it's not hard to extrapolate how these kind of changes can assist in creating Buildpacks for development environments.

# How it Works
[how-it-works]: #how-it-works

## `exec-env` key in TOML

In order to support additional execution environments an `exec-env` key will be added to various TOML tables in the project. The value can be any string with `all` having special meaning. `all` will apply to all execution environments and will be the default if not specified. This should make it backwards compatible and optional. When `exec-env` is not set to `all`, the table settings will only be applied to that execution environment.

### Project Descriptor - `project.toml` (App Developers)

This file be extended by adding `exec-env` to the following tables:

`[[io.buildpacks.group]]`
`[[io.buildpacks.pre.group]]`
`[[io.buildpacks.post.group.env]]`
`[[io.buildpacks.build.env]]`

An example would look like this:

```TOML
[_]
schema-version = "0.3"

[[io.buildpacks.group]]
id = "buildpacks/ruby"
version = "latest"

[[io.buildpacks.group]]
id = "buildpacks/metrics-agent"
version = "latest"
exec-env = "production"

[[io.buildpacks.group]]
id = "buildpacks/headless-chrome"
version = "latest"
exec-env = "test"

[[io.buildpacks.post.group]]
id = "buildpacks/procfile"
version = "latest"

[[io.buildpacks.build.env]]
name = "RAILS_ENV"
value = "production"
exec-env = "production"

[[io.buildpacks.build.env]]
name = "RAILS_ENV"
value = "test"
exec-env = "test"

[[io.buildpacks.build.env]]
name = "PARALLEL_WORKERS"
value = "4"
exec-env = "test"
```

### `builder.toml` (Builder Authors)

The only table that `exec-env` will be added to is `[[order.group.env]]`.

### `buildpack.toml` (Buildpack Authors)

The only table that `exec-env` will be added to is `[[buildpack.order.group]]`. This only is applicable for composite buildpacks.

## `CNB_EXEC_ENV` Environment Variable

This env var will reserve the following values:

* production
* test
* development

### Buildpack API

A buildpack author will be able to determine the execution environment their buildpack is expected to build for by reading the `CNB_EXEC_ENV` environment variable. If this value is not set, a Buildpack Author can assume it's set to `production`.

### Platform API

It will be up to the platform to set the environment variable `CNB_EXEC_ENV`. If this value is set, `lifecycle` MUST NOT override this value. If the value is not set, `lifecycle` will set it to `production`.

# Migration
[migration]: #migration

In order to allow the Buildpack API and Platform API to be updated independently, both APIs will have a fallback to the `production` value. For `1.0`, it would be nice to drop this behavior and assume it will always be set.

This also touches Project Descriptor, but since the platform controls the Platform API and the Project Descriptor Extension API it shouldn't cause any issues.

# Drawbacks
[drawbacks]: #drawbacks

While the design tries to stay simple, it still adds new additions to the spec.

* env var to Buildpack API
* env var to Platform API
* field to Project Descriptor, `builder.toml`, and `buildpack.toml`.

# Alternatives
[alternatives]: #alternatives

## Separate Execution Environment Project Descriptor files

When using `Dockerfile`, it's common to create a separate one for other execution environments like `Dockerfile.test`. This makes the file clean and easy to read, but comes at the cost of duplicating setup/code.

With Project Descriptor, this would remove the need for the `exec-env` key at the cost of replicating buildpack groups. It does bring a big benefit by easily unlocking the `builder` key in Project Descriptor to be specific to an execution environment. This would apply to any fields (not tables) that exist at the `[io.buildpacks]` level like `include`/`exclude`. There are some other options if this is desired, where a new table could be created for hoisting fields into that would allow us to add the `exec-env` field.

# Prior Art
[prior-art]: #prior-art

## [Heroku Testpack API](https://devcenter.heroku.com/articles/testpack-api)

As part of the classic buildpack design, Heroku extended the API to include support for tests. It added a `bin/test-compile` phase, which is like the normal `bin/compile` phase but specific for setting things up for test. `bin/test` was called for executing tests. This design let a buildpack have a specific codepath for tests and also do intelligent logic for executing tests based on the source code. For example [in Ruby](https://github.com/heroku/heroku-buildpack-ruby/blob/main/bin/support/ruby_test#L62-L76), the buildpack author can run `bin/rspec` if it detects `rspec`, `bin/rails test` when using rails, or default to `rake test`.

There were some flaws in this design. Though it's clean to separate production and test code paths, they end up sharing a lot of code. Many of the bash based Heroku buildpacks would just [call `bin/compile`](https://github.com/heroku/heroku-buildpack-nodejs/blob/main/bin/test-compile#L24) with different parameters/env vars.

## [GOOGLE_DEVMODE](https://cloud.google.com/docs/buildpacks/service-specific-configs#google_devmode)

These are specific to the Google Cloud Buildpacks for setting a development code path to work with skaffold.

## [Develop API](https://github.com/buildpacks/spec/pull/71)

The original Cloud Native Buildpacks spec included a Develop API, but it was never implemented.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- "env" is overloaded as a word since we also use it for environment variables. Is there a better word here?
- Should there be builders that are specific to an execution environment? What about `include` or `exclude`?
- Should the execution environments be an enum or flexible as a string?
  - enums will help encourage standardization across buildpacks and platforms.
  - strings can help account for use cases we haven't thought of yet.
- Should buildpacks be allowed specify allowlist execution environments?
- What changes are needed in the buildpack registry?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

See ["How it Works"](#how-it-works).

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
