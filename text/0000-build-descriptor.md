# Meta
[meta]: #meta
- Name: Project Build Descriptor
- Start Date: 2019-06-11
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: https://github.com/buildpack/rfcs/pull/3

# Summary
[summary]: #summary

This is a proposal a `build.toml` file that may exist in the root directory of an app or project to be built using Cloud Native Buildpacks. A `build.toml` may contain metadata and other information about the project. It can also contain elements that support monorepos, inline buildpacks, ignored files, and codified buildpack groups (i.e. a fixed list of buildpacks that must be run against the repo).

# Motivation
[motivation]: #motivation

This proposal is meant to address all of the following issues:

* [Monorepos](https://github.com/buildpack/spec/issues/39)
* [Application descriptor](https://github.com/buildpack/spec/issues/44)
* Inline buildpacks
* [Ignoring files](https://github.com/buildpack/pack/issues/210)

# What it is
[what-it-is]: #what-it-is

The target personas for this proposal is buildpack users who need to enrich or configure buildpack execution. We introduce a new file, `build.toml`, with elements that support many different use cases.

## `build`

The top-level `[build]` element would indicate that the repository containing the `build.toml` can be built with buildpacks.

## `build.root`

The top level `build` element may contain a `root` element:

```toml
[build]
root = "<directory name>" # must be a relative path and a subdir. no `..`
```

This would change the directory the lifecycle runs against.

## `build.buildpacks`

A `build.toml` may also contain a buildpack group that defines the buildpacks that will run on the app OR when the repo is used as a buildpack:

```toml
[[build.buildpacks]]
id = "<buildpack ID (required)>"
version = "<buildpack version (optional default=latest)>"
optional = "<bool (optional default=false)>"
uri = "<url or path to the buildpack (optional default=urn:buildpack:<id>)"
path = "<path to an inline buildpack (optional)"
```

* `id` (string, required): the ID ([as defined in the spec](https://github.com/buildpack/spec/blob/master/buildpack.md#buildpacktoml-toml) of another buildpack
* `version` (string, optional, default=`latest`): the version ([as defined in the spec](https://github.com/buildpack/spec/blob/master/buildpack.md#buildpacktoml-toml) of the dependent buildpack. The default is to use the latest available version of the buildpack (resolution of this value may be platform-dependent).
* `optional` (bool, optional, default=`false`): Defines whether this buildpack will be optional in `order.toml`.
* `uri` (string, optional, default=`urn:buildpack:<id>`): The exact location of the dependent buildpack. If not specified the platform will resolve the `urn:buildpack:<id>` (making the resolution platform dependent).
* `path` (string, optional): The exact location in the repo of an inline buildpack. Overrides `uri`

## `build.env`

The `build.env` element may contain a list of key value pairs:

```toml
[build.env]
KEY = "<value>"
```

The key-value pairs will be set as environment variables during buildpack execution on this repo.

## `build.ignore`

A list of files to exclude from the build:

```toml
[build.ignore]
files = [
    "spec/"
]
```

# How it Works
[how-it-works]: #how-it-works

Given the elements described above, we seek to satisfy the following use cases:

## Inline buildpacks

When a `build.toml` is found in the root directory of an app, and it contains the following element:

```toml
[[build.buildpacks]]
path = "./my-cnb"
```

Then the lifecycle will use the buildpack contained in the directory defined by `path` to build the app.

## Monorepos

When a `build.toml` is found in an app directory, the lifecycle will check for the following element:

```toml
[build]
root = "<directory name>" # must be a relative path and a subdir. no `..`
```

If `build.root` is set, the lifecycle will execute against this directory instead of the directory that contains the `build.toml`. All other configuration in the `build.toml` will still be honored, and a `build.toml` in the new `root` will be ignored (we may want to reconsider that however).

## Codified Buildpacks

Given an app with a `build.toml`, the lifecycle will read the `build.buildpacks` and construct an ephemeral `buildpack.toml` that overrides the default buildpack groups in the builder image. Only the buildpacks listed in `build.buildpacks` will be run. For example, an app might contain:

```toml
[[build.buildpacks]]
id = "heroku/java"
```

If the app also contains a `Gemfile` and the `heroku/buildpacks` builder image is used, this will override the default buildpack groups, which would detect and run the `heroku/ruby` buildpack by default.

# Drawbacks
[drawbacks]: #drawbacks

- A `build.toml` suggests that this file is only useful during build, and may prohibit us (ergonomically speaking) from using it to define launch configuration.

# Alternatives
[alternatives]: #alternatives

- Name the file `project.toml` but keep the schema described herein.
- Overload `buildpack.toml` as described in [PR #2](https://github.com/buildpack/rfcs/pull/3)

# Prior Art
[prior-art]: #prior-art

- [`manifest.json`](https://docs.cloudfoundry.org/devguide/deploy-apps/manifest.html)
- [`app.json`](https://devcenter.heroku.com/articles/app-json-schema)
- [`.buildpacks`](https://github.com/heroku/heroku-buildpack-multi)
- [heroku-buildpack-inline](https://github.com/kr/heroku-buildpack-inline)
- [heroku-buildpack-multi-procfile](https://github.com/heroku/heroku-buildpack-multi-procfile)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

There are specific aspects of the [Application descriptor](https://github.com/buildpack/spec/issues/44) issue that are not covered by this proposal, including:

- Overriding launch commands (i.e. process types) in `app.toml`
- Overriding launch configuration (such as environment variables)

There are also some questions related to inline buildpacks:

- Is `path` overriding `uri` and other elements confusing?
- How does a `build.toml` containing `[buildpacks]` interplay with a `buildpack.toml` in the path of the inline buildpack?

With regard to monorepos:

- How does this happen monorepos that want to be built in more than one way (ex. a repo that contains a Node app and a Ruby app)?
