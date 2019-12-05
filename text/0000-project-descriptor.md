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
* [Application descriptor](https://github.com/buildpack/spec/issues/44)
* [Ignoring files](https://github.com/buildpack/pack/issues/210)

# What it is
[what-it-is]: #what-it-is

Terminology:

* **project**: a repository containing source code for an app, service, function, buildpack or a monorepo containing any combination of those.
* **image**: the output of a running a buildpack(s) against a project

The target personas for this proposal is buildpack users who need to enrich or configure buildpack execution. The elements in  `project.toml` support many different use cases including three top level tables:

- `[project]`: (optional) defines configuration for a project
- `[metadata]`: (optional) metadata about the repository
- `[extensions]`: (optional) extensions to the spec

Here is an overview of the complete schema:

```toml
[project]
id = "<string>"
name = "<string>"
version = "<string>"
authors = ["<string>"]
documentation = "<url>"
license = "<string>"
source = "<url>"
include = ["<string>"]
exclude = ["<string>"]

[metadata]
# additional arbitrary keys allowed

[extensions]
# TBD
```

The following sections describe each part of the schema in detail.

## `[project]`

The top-level `[project]` table may contain configuration about the repository, including `id` and `version`, but also metadata about how it is authored, documented, and version controlled. If any of these values are redefined in `[buildpack]` or `[[images]]` they will override the values in `[project]`.

The `project.id`

```toml
[project]
id = "<string>"
name = "<string>"
version = "<string>"
```

## `[project.include]` and `[project.exclude]`

A list of files to include in the build (while excluding everything else):

```toml
[project]
include = [
    "cmd/",
    "go.mod",
    "go.sum",
    "*.go"
]
```

A list of files to exclude from the build (while including everything else)

```toml
[project]
exclude = [
    "spec/"
]
```

The `.gitignore` pattern is used in both cases. The `exclude` and `include` keys are mutually exclusive, and if both are present the Lifecycle will error out. These lists apply to both buildpacks built with `pack create-package` and apps built with `pack build`.

Any files that are excluded (either via `include` or `exclude`) will be excluded before the build (i.e. not only exluded from the final image).

## `[metadata]`

This table includes a some defined keys, but additional keys are not validated. It can be used to add platform specific metadata. For example:

```toml
[metadata.heroku]
pipeline = "foobar"
```

The defined keys are:

```toml
[metadata]
authors = ["<string>"]
documentation = "<url>"
license = "<string>"
source = "<url>"
```

# How it Works
[how-it-works]: #how-it-works

Given the elements described above, we seek to satisfy the following use cases:

## Example: Basic app

This is a complete `project.toml` for a simple app:

```toml
[project]
id = "io.buildpacks.my-app"
version = "0.1"
```

No other configuration is required.

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