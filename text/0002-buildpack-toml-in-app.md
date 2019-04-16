# Meta
[meta]: #meta
- Name: Everything is a Buildpack
- Start Date: 2019-04-16
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This is a proposal for new elements in `buildpack.toml` and a new acceptable location for the file. There would be two acceptable locations for the `buildpack.toml` file:

* The root directory of a buildpack
* The root directory of an app or project to be built (henceforth an "app")

Thus, an app can be considered a buildpack when necessary. A `buildpack.toml` in the root directory of an app can contain metadata, and other information about the project. It can also contain new elements that support monorepos, inline buildpacks, and codified buildpack groups (i.e. a fixed list of buildpacks that must be run against the repo).

All proposed concepts are backwards compatible with the existing `buildpack.toml` spec.

# Motivation
[motivation]: #motivation

This proposal is meant to address all of the following issues:

* [Monorepos](https://github.com/buildpack/spec/issues/39)
* [Buildpack dependencies](https://github.com/buildpack/spec/issues/30)
* [Application descriptor](https://github.com/buildpack/spec/issues/44)
* Inline buildpacks
* Buildpack groups configuration

# What it is
[what-it-is]: #what-it-is

The target personas for this proposal are buildpack authors and buildpack users who need to enrich or configure buildpack execution. We introduce new elements, and a new acceptable location for the `buildpack.toml` file.

All of the elements described herein can be used with a `buildpack.toml` residing in a buildpack or in an app. They are also all optional.

## New Element: buildpack.root

The existing `buildpack` would now contain an optional `root` element.

```toml
[buildpack]
root = "<directory name>" # the directory where the `bin/` scripts are located
```

This element would define the location of the `bin/{detect|compile}` scripts.

## New Element: project.root

A new top level `project` element would be introduced, which contains `root` and/or `buildpacks`:

```toml
[project]
root = "<directory name>" # must be a relative path and a subdir. no `..`
```

This would change the directory the lifecycle runs against.


## New Element: project.buildpacks

A `buildpack.toml` may also contain a buildpack group that defines the buildpacks that will run on the app OR when the repo is used as a buildpack:

```toml
[[project.buildpacks]]
id = "<buildpack ID (required)>"
version = "<buildpack version (optional default=latest)>"
optional = "<bool (optional default=false)>"
uri = "<url or path to the buildpack (optional default=urn:buildpack:<id>)"
```

* `id` (string, required): the ID ([as defined in the spec](https://github.com/buildpack/spec/blob/master/buildpack.md#buildpacktoml-toml) of another buildpack
* `version` (string, optional, default=`latest`): the version ([as defined in the spec](https://github.com/buildpack/spec/blob/master/buildpack.md#buildpacktoml-toml) of the dependent buildpack. The default is to use the latest available version of the buildpack (resolution of this value may be platform-dependent).
* `optional` (bool, optional, default=`false`): Defines whether this buildpack will be optional in `group.toml`.
* `uri` (string, optional, default=`urn:buildpack:<id>`): The exact location of the dependent buildpack. If not specified the platform will resolve the `urn:buildpack:<id>` (making the resolution platform dependent).

## New Element: project.env

The `project.env` element may contain a list of key value pairs:

```toml
[project.env]
KEY = "<value>"
```

The key-value pairs will be set as environment variables during buildpack execution on this repo.

# How it Works
[how-it-works]: #how-it-works

Given the elements described above, we seek to satisfy the following use cases:

## Inline buildpacks

When a `buildpack.toml` is found in the root directory of an app, and it contains the following element:

```toml
[buildpack]
id = "<buildpack id>"
```

Then the lifecycle will add the app repo (as a buildpack) to the end of every group in the pre-defined buildpack groups.

Optionally, the `buildpack.toml` may include:

```toml
[buildpack]
root = "<directory name>" # the directory where the `bin/` scripts are located
```

The `root` element is necessary to support apps that may contain a buildpack in a subdirectory.

## Monorepos

When a `buildpack.toml` is found in an app directory, the lifecycle will check for the following element:

```toml
[project]
root = "<directory name>" # must be a relative path and a subdir. no `..`
```

If `project.root` is set, the lifecycle will execute against this directory instead of the directory that contains the `buildpack.toml`. All other configuration in the `buildpack.toml` will still be honored, and a `buildpack.toml` in the new `root` will be ignored (we may want to reconsider that however).

## Codified Buildpacks

Given an app with a `buildpack.toml`, the lifecycle will read the `project.buildpacks` and construct an `group.toml` that overrides the default buildpack groups in `order.toml`. Only the buildpacks listed in `project.buildpacks` will be run. For example, an app might contain:

```toml
[[project.buildpacks]]
id = "heroku/java"
```

If the app also contains a `Gemfile` and the `heroku/buildpacks` builder image is used, this will override the default buildpack groups, which would detect and run the `heroku/ruby` buildpack  by default.

## Buildpack Dependencies

Given an buildpack with a `buildpack.toml`, the lifecycle will read the `project.buildpacks` and construct an `group.toml` entry with those buildpacks included with the primary buildpack. The `project.buildpacks` of the dependent buildpacks will also be resolved into the `group.toml`.

This same scheme can be used to self-reference (effectively overriding the default buildpack groups). For example:

```toml
[buildpack]
id = "com.example.this-buildpack"

[[project.buildpacks]]
id = "com.example.jvm-buildpack"

[[project.buildpacks]]
id = "com.example.this-buildpack"

[[project.buildpacks]]
id = "com.example.apm-buildpack"
```

Because we use the same `project.buildpacks` element for both the app and the buildpack, there is an implication that a repo cannot have one set of buildpacks run against it and another run when it is used as a buildpack against another app.

# Drawbacks
[drawbacks]: #drawbacks

- A `buildpack.toml` in an app repo might be confusing. The file would need to be looked at to understand if it is a normal buildpack or something else.
- It will effectively be impossible to use buildpacks to build buildpacks. This is due to the nature of the `project.buildpacks` element, which defines the buildpacks that will run no matter how the `buildpack.toml` is used.
- There is a slight discrepancy between how `project.buildpacks` is used, and how the other elements in `project` are ignored on a buildpack (not an app). When a buildpack is run on an app, the `project.buildpacks` are read and used. But other elements, like `project.env` and `project.root` are ignore. We may want to resolve this either by allowing the other `project` elements to be used, or by introducing a `buildpack.buildpacks` element.

# Alternatives
[alternatives]: #alternatives

N/A

# Prior Art
[prior-art]: #prior-art

- [`manifest.json`](https://docs.cloudfoundry.org/devguide/deploy-apps/manifest.html)
- [`app.json`](https://devcenter.heroku.com/articles/app-json-schema)
- [`.buildpacks`](https://github.com/heroku/heroku-buildpack-multi)
- [heroku-buildpack-inline](https://github.com/kr/heroku-buildpack-inline)
- [heroku-buildpack-multi-procfile](https://github.com/heroku/heroku-buildpack-multi-procfile)

The idea of treating apps as buildpacks stems from how NPM and Maven work. In both cases, the difference between and app and a package/dependency is superficial. They both use the same configuration elements.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

There are specific aspects of the [Application descriptor](https://github.com/buildpack/spec/issues/44) issue that are not covered by this proposal, including:

- Overriding launch commands (i.e. process types) in `app.toml`
