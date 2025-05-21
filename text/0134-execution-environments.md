# Meta
[meta]: #meta
- Name: Execution Environments
- Start Date: 2023-01-11
- Author(s): @hone
- Status: Approved
- RFC Pull Request: [rfcs#274](https://github.com/buildpacks/rfcs/pull/274)
- CNB Pull Request: (leave blank)
- CNB Issue: [rfcs#327](https://github.com/buildpacks/rfcs/issues/327)
- Supersedes: N/A

# Summary
[summary]: #summary

Add buildpack support for multiple execution environments, with better support for testing as the first use case.

# Definitions
[definitions]: #definitions

- Execution Environment - The target environment the OCI image is expected to be executed in, i.e. production, test, development.

# Motivation
[motivation]: #motivation

Buildpacks are mainly being used to build images for production environments, but this is only one piece of the software development process. Without test environment support for buildpacks, users currently have to implement alternatives for testing their source code. Buildpacks are well positioned to help bridge that gap, as building production and test environments often share many of the same broad strokes.

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
A platform will set the `CNB_EXEC_ENV` env var to the desired execution environment. Buildpacks can then read this env var to branch or switch on logic needed for the execution environment.

In addition, Builder Authors, Buildpack Authors, and App Developers will be able to configure various options for specific execution environments using the `exec-env` key.

## Development Environments
The specifics of creating development environments are out of scope of this RFC, but it's not hard to extrapolate how the proposed changes can assist in creating Buildpacks for development environments.

# How it Works
[how-it-works]: #how-it-works

## `exec-env` key in TOML

In order to support additional execution environments, an optional `exec-env` key will be added to various TOML tables in the project. This will be an array that takes string values. An individual element can be any string with `*` having special meaning. Similar to the ["any stack RFC"](https://github.com/buildpacks/rfcs/blob/main/text/0056-any-stack-buildpacks.md), `*` will apply to all execution environments. `["*"]` will be the default if not specified. This should make the key backwards compatible. When `exec-env` is not empty and does not include `*`, the table settings will only be applied to the specified execution environments.

### Project Descriptor - `project.toml` (App Developers)

An app developer may have execution environment specific configuration, like only using a metrics agent in production, or a headless user agent in test. In order to facilitate these needs, the project descriptor will be extended by adding `exec-env` to the following tables:

* `[[io.buildpacks.group]]`
* `[[io.buildpacks.pre.group]]`
* `[[io.buildpacks.post.group.env]]`
* `[[io.buildpacks.build.env]]`

An example would look like this:

```TOML
[_]
schema-version = "0.3"

[[io.buildpacks.group]]
id = "buildpacks/ruby"
version = "latest"

[[io.buildpacks.group]]
id = "buildpacks/nodejs"
version = "latest"
exec-env = ["production", "test"]

[[io.buildpacks.group]]
id = "buildpacks/metrics-agent"
version = "latest"
exec-env = ["production"]

[[io.buildpacks.group]]
id = "buildpacks/headless-chrome"
version = "latest"
exec-env = ["test"]

[[io.buildpacks.post.group]]
id = "buildpacks/procfile"
version = "latest"

[[io.buildpacks.build.env]]
name = "RAILS_ENV"
value = "production"
exec-env = ["production"]

[[io.buildpacks.build.env]]
name = "RAILS_ENV"
value = "test"
exec-env = ["test"]

[[io.buildpacks.build.env]]
name = "PARALLEL_WORKERS"
value = "4"
exec-env = ["production"]
```

### `builder.toml` (Builder Authors)

The `exec-env` key will be added to the `[[order.group]]` and `[[build.env]]` arrays of tables.

### `buildpack.toml` (Buildpack Authors)

As a piece of metadata, a buildpack should list the execution environments it supports in the `[[buildpack.exec-env]]` array. This can be used by the buildpack registry in the future.

For composite buildpacks, `exec-env` will be added to is `[[buildpack.order.group]]`.

### `launch.toml` (Buildpack Authors)

Not all process types make sense for every execution environment. In order to help hint to the platform the intention how a process should be used, the `exec-env` key will be added to the `[[processes]]` table.

### `metadata.toml` (Platform Operators)

On the platform side, the `exec-env` key will be added to `metadata.toml` in the `[[processes]]` table to mirror `launch.toml`. This will help platforms decide which processes are desired for each execution environment. `lifecycle` will list all processes and will not exclude any based on the execution environment Instead, a platform can use the available information to make a decision.

## `CNB_EXEC_ENV` Environment Variable

This value is a string and must abide by similar rules we use for IDs:

* MUST only contain numbers, letters, and the characters `.`, and `-`.

The spec will reserve the following values to help standardize execution environments:

* production
* test
* development

In addition, the `/` character is reserved in case we need to introduce namespacing in the future.

### Buildpack API

A buildpack author will be able to determine the execution environment their buildpack is expected to build for by reading the `CNB_EXEC_ENV` environment variable. If this value is not set, a Buildpack Author can assume it's set to `production`. This will be provided for both `bin/detect` and `bin/build`.

This would let a buildpack author do different things based on the execution environment. For example, it's common for a production build to exclude test dependencies or files that a test environment would include. For compiled languages, a production build might even remove the source code and just leave the compiled binary with optimizations. In a test environment, a build may include debug symbols, be compiled without optimizations, and leave the source code untouched.

### Platform API

It will be up to the platform to set the environment variable `CNB_EXEC_ENV`. If this value is set, `lifecycle` MUST NOT override this value. If the value is not set, `lifecycle` will set it to `production`.

During the export phase, `lifecycle` will set the `io.buildpacks.exec-env` label with the value from the `CNB_EXEC_ENV` environment variable. This will make it easier for anyone examining the OCI image to determine the execution environment.

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

As part of the classic buildpack design, Heroku extended the API to include support for tests. It added a `bin/test-compile` phase, which is similar to the `bin/compile` phase, but specific for setting things up for test. `bin/test` was called for executing tests. This design lets buildpack authors write codepaths and logic optimized specifically for executing tests based on the source code. For example, [this Ruby buildpack](https://github.com/heroku/heroku-buildpack-ruby/blob/fb393cb46e23ab809e21daeef2a97cbd5f04a370/bin/support/ruby_test#L62-L76) will run `bin/rspec` if it detects `rspec`, `bin/rails test` when using rails, or default to `rake test`.

There were some flaws in this design. Though it's clean to separate production and test code paths, they end up sharing a lot of code. Many of the bash based Heroku buildpacks would just [call `bin/compile`](https://github.com/heroku/heroku-buildpack-nodejs/blob/main/bin/test-compile#L24) with different parameters/env vars.

## [GOOGLE_DEVMODE](https://cloud.google.com/docs/buildpacks/service-specific-configs#google_devmode)

These are specific to the Google Cloud Buildpacks for setting a development code path to work with skaffold.

## [Develop API](https://github.com/buildpacks/spec/pull/71)

The original Cloud Native Buildpacks spec included a Develop API, but it was never implemented.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- "env" is overloaded as a word since we also use it for environment variables. Is there a better word here?
While "env" is overloaded, it matches the intent.
- Should there be builders that are specific to an execution environment? What about `include` or `exclude`?
No reason right now to restrict builders to an execution environment.
- Should the execution environments be an enum or flexible as a string?
  - enums will help encourage standardization across buildpacks and platforms.
  - strings can help account for use cases we haven't thought of yet.
We're going to opt for a string to be flexible.
- Should buildpacks be allowed specify allowlist execution environments?
We're currently optimizing for app developer flexibility to use the buildpacks as they see fit.
- What changes are needed in the buildpack registry?
The buildpack registry will need to expand the index to support the `buildpack.toml`'s `exec-env` field.
- Does `build.env` need to support execution environments in `builder.toml`?
- Should the reserved exec env strings be namespaced?
We're going to reserve the `/` character for namespacing if needed in the future.
- Instead of creating a new label, should we stash it into a JSON label?
The current JSON blobs are exports of lifecycle files, so we're going to create a new one for now.

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
