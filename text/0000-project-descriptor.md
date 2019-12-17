# Meta
[meta]: #meta
- Name: Minimal Project Descriptor
- Start Date: 2019-06-11
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: https://github.com/buildpack/rfcs/pull/25

# Summary
[summary]: #summary

This is a proposal for a new file, `project.toml`, containing configuration for apps, services, functions, and buildpacks.

# Motivation
[motivation]: #motivation

This proposal is meant to address all of the following issues:

* Build metadata (i.e. information about the code being built)
* [Ignoring files](https://github.com/buildpack/pack/issues/210)

It also provides a foundation for solving the problems defined in the [Application descriptor issue](https://github.com/buildpack/spec/issues/44).

# What it is
[what-it-is]: #what-it-is

Terminology:

* **project**: a repository containing source code for an app, service, function, buildpack or a monorepo containing any combination of those.
* **image**: the output of a running a buildpack(s) against a project

The target personas for this proposal is buildpack users who need to enrich or configure buildpack execution. The elements in  `project.toml` support many different use cases including these top level tables:

- `[project]`: (optional) defines configuration for a project
- `[metadata]`: (optional) metadata about the repository

Here is an overview of the complete schema:

```toml
[project]
id = "<string>" # machine readble
name = "<string>" # human readable
version = "<string>"
authors = ["<string>"]
documentation-url = "<url>"
source-url = "<url>"

[[project.licenses]]
type = "<string>"
uri = "<uri>"

[build]
include = ["<string>"]
exclude = ["<string>"]

[[build.buildpacks]]
id = "<string>"
version = "<string>"
uri = "<string>"

[[build.env]]
name = "<string>"
value = "<string>"

[metadata]
# additional arbitrary keys allowed
```

The following sections describe each part of the schema in detail.

## `[project]`

The top-level `[project]` table may contain configuration about the repository, including `id` and `version`, but also metadata about how it is authored, documented, and version controlled.

The `project.id`

```toml
[project]
id = "<string>"
name = "<string>"
version = "<string>"
```

* `id` - the machine readable identifier of the project (ex. "com.example.myservice")
* `name` - the human readable name of the project (ex. "My Example Service")
* `version` - and arbitrary string representing the version of the project

## `[project.licenses]`

* `type` - This uses the [SPDX 2.1 license expression](https://spdx.org/spdx-specification-21-web-version). This matches the identifier and must be included in the [SPDX Lincenes List](https://spdx.org/licenses/). As of this writing, it's on version 3.7.
* `uri` - If this project is using a nonstandard license, then this key may be specified in lieu of `type` to point to the license.

## `[build.include]` and `[build.exclude]`

A list of files to include in the build (while excluding everything else):

```toml
[build]
include = [
    "cmd/",
    "go.mod",
    "go.sum",
    "*.go"
]
```

A list of files to exclude from the build (while including everything else)

```toml
[build]
exclude = [
    "spec/"
]
```

The `.gitignore` pattern is used in both cases. The `exclude` and `include` keys are mutually exclusive, and if both are present the Lifecycle will error out. These lists apply to both buildpacks built with `pack create-package` and apps built with `pack build`.

Any files that are excluded (either via `include` or `exclude`) will be excluded before the build (i.e. not only exluded from the final image).

If both `exclude` and `include` are defined, the build process will error out.

## `[[build.buildpacks]]`

The build table may contain an array of buildpacks. The schema for this table is:

```toml
[[build.buildpacks]]
id = "<buildpack ID (optional)>"
version = "<buildpack version (optional default=latest)>"
uri = "<url or path to the buildpack (optional default=urn:buildpack:<id>)"
```

This defines the buildpacks that a platform should use on the repo.

Either an `id` or a `uri` are required, but not both. If `uri` is provided, `version` is not allowed.

## `[[build.env]]`

Used to set environment variables at build time, for example:

```toml
[[build.env]]
name = "JAVA_OPTS"
value = "-Xmx1g"
```

## `[metadata]`

This table includes a some defined keys, but additional keys are not validated. It can be used to add platform specific metadata. For example:

```toml
[metadata.heroku]
pipeline = "foobar"
```

# How it Works
[how-it-works]: #how-it-works

The `project.toml` contents will be read by the platform and/or the lifecycle. The launch image will contain labels for the data in all fields except `include` and `exclude`.

## Example: Basic app

This is a complete `project.toml` for a simple app:

```toml
[project]
id = "io.buildpacks.my-app"
version = "0.1"
```

No other configuration is required.

## Example: Codified Buildpacks

Given an app with a `project.toml`, the lifecycle will read the `build.buildpacks` and generate an ephemeral buildpack group in the lifecycle. Only the buildpacks listed in `build.buildpacks` will be run (no other groups will be run). For example, an app might contain:

```toml
[[build.buildpacks]]
id = "io.buildpacks/java"
version = "1.0"

[[build.buildpacks]]
id = "io.buildpacks/nodejs"
version = "1.0"
```

These entries override any defaults in the builder image. If, for example, the project code contains a `Gemfile` and the `heroku/buildpacks` builder image is used, this will override the default buildpack groups, which would normally detect and run the `heroku/ruby` buildpack.

This is similar to running `pack build --buildpack io.buildpacks/java,io.buildpacks/nodejs`.

# Drawbacks
[drawbacks]: #drawbacks

- The use of the filename `project.toml` does not strongly indicate that it can be used with buildpacks
- Conflicts with `Project.toml` from Julia

# Alternatives
[alternatives]: #alternatives

- Name the file `package.toml` and keep the schema described herein.
- Overload `buildpack.toml` as described in [PR #2](https://github.com/buildpack/rfcs/pull/3)

# Prior Art
[prior-art]: #prior-art

- [`manifest.json`](https://docs.cloudfoundry.org/devguide/deploy-apps/manifest.html)
- [`app.json`](https://devcenter.heroku.com/articles/app-json-schema)
- [`.buildpacks`](https://github.com/heroku/heroku-buildpack-multi)
- [heroku-buildpack-multi-procfile](https://github.com/heroku/heroku-buildpack-multi-procfile)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- How do we support `[[images]]` in the future?
