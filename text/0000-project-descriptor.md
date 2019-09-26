# Meta
[meta]: #meta
- Name: Project Descriptor
- Start Date: 2019-06-11
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: https://github.com/buildpack/rfcs/pull/16

# Summary
[summary]: #summary

This is a proposal for a new file, `project.toml`, containing configuration for apps, services, functions, and buildpacks.

# Motivation
[motivation]: #motivation

This proposal is meant to address all of the following issues:

* Build metadata (i.e. information about the code being built)
* [Monorepos](https://github.com/buildpack/spec/issues/39)
* [Application descriptor](https://github.com/buildpack/spec/issues/44)
* [Ignoring files](https://github.com/buildpack/pack/issues/210)
* Multiple images (i.e. one build, multiple images as output)
* Custom launch configuration
* Codified buildpacks

# What it is
[what-it-is]: #what-it-is

Terminology:

* **project**: a repository containing source code for an app, service, function, buildpack or a monorepo containing any combination of those.
* **image**: the output of a running a buildpack(s) against a project

The target personas for this proposal is buildpack users who need to enrich or configure buildpack execution. The elements in  `project.toml` support many different use cases including three top level tables:

- `[project]`: (optional) defines configuration for a project
- `[[images]]`: (optional) defines configuration for an image
- `[metadata]`: (optional) metadata about the repository

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
publish = "<boolean>"

[[images]]
id = "<string>"
path = "."
stack = "<string>"

  [[images.launch.env]]
  name = "<string>"

  [[images.build.env]]
  name = "<string>"

  [[images.processes]]
  name = "<string>"
  cmd = "<string>"

  [[images.buildpacks]]
  id = "<string>"
  version = "<string>"
  optional = "<boolean>" # is this necessary?
  uri = "<url or path>"
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
authors = ["<string>"]
documentation = "<url>"
license = "<string>"
source = "<url>"
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

## `[project.publish]`

A boolean that, when set to `false`, will prevent a platform from publishing the image generated from a build to a registry.

## `[[images]]`

Defines properties of the image(s) that are output from a build.

```toml
[[images]]
id = "<image name>"
path = "."
stack = "<buildpack stack>"
```

* `id` (string, optional): by default inherits from `[project.name]`. If set will override the OCI image produced
* `path` (string, optional): by default uses the directory where this file lives
* `stack` = (string, optional): stack to build against

## `[image.launch.env]` and `[image.build.env]`

Used to set environment variables at launch time, for example:

```toml
[[images.launch.env]]
name = "JAVA_OPTS"
value = "-Xmx4g"
```

Or set environment variables at build time:

```toml
[[images.build.env]]
name = "JAVA_OPTS"
value = "-Xmx1g"
```

## `[[images.processes]]`

Defines the default processes used to run an image.

```toml
[[images.processes]]
name = "<process name>"
cmd = "..."
```

This should mirror what is supported in `launch.toml`, which means that if `args` are added to support scratch images, they should be added here too.

## `[[images.buildpacks]]`

The images table may also contain an array of buildpacks. The schema for this table is:

```toml
[[images.buildpacks]]
id = "<buildpack ID (required)>"
version = "<buildpack version (optional default=latest)>"
optional = "<bool (optional default=false)>"
uri = "<url or path to the buildpack (optional default=urn:buildpack:<id>)"
```

This allows for each image to be built from a different group of buildpacks. There is an open question about how to simplify this interface if the buildpacks are the same for a number of a different `[[images]]`.

## `[metadata]`

Keys in this table are not validated. It can be used to add platform specific metadata. For example:

```toml
[metadata.heroku]
pipeline = "foobar"
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

## Example: Monorepos

The `[[images]]` array of tables allows the buildpack lifecycle to generate more than one image per build. Each table in the array may contain configuration that defines a different image for different parts of the code. For example:

```toml
[project]
id = "io.buildpacks.monorepo-app"
version = "0.1"

[[images]]
id = "my-service"
path = "service/"
  [[images.processes]]
  name = "web"
  cmd = "java -jar target/service.jar"

[[images]]
id = "my-gateway"
path = "gateway/"
  # array of processes used to run the image
  [[images.processes]]
  name = "web"
  cmd = "java -jar target/gateway.jar"
```

There is an open question about how if actually run distinct builds, or if the images are derived from a single build.

## Example: Codified Buildpacks

Given an app with a `project.toml`, the lifecycle will read the `images.buildpacks` and generate an ephemeral buildpack group in the lifecycle. Only the buildpacks listed in `images.buildpacks` will be run (no other groups will be run). For example, an app might contain:

```toml
[[images]]
  [[images.buildpacks]]
  id = "io.buildpacks/java"
  version = "1.0"

  [[images.buildpacks]]
  id = "io.buildpacks/nodejs"
  version = "1.0"
```

These entries override any defaults in the builder image. If, for example, the project code contains a `Gemfile` and the `heroku/buildpacks` builder image is used, this will override the default buildpack groups, which would normally detect and run the `heroku/ruby` buildpack.

# Drawbacks
[drawbacks]: #drawbacks

- This proposal merges to previously distinct concepts: projects/apps and buildpacks. However, by both concepts have many similar attributes and combining them enables the use of buildpacks to build buildpacks.
- The use of the filename `project.toml` does not strongly indicate that it can be used with buildpacks

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

- Do multiple `[[images]]`  result in multiple builds, or are the images derived from a single build?
- How do we prevent users from needing to copy/paste `[[images.buildpacks]]` over and over in the same file?
    - could we add an additional top-level table that defines buildpack groups, which can be referenced in images?
    - could we add an additional top-level table that defines default buildpack groups if not defined in `[[images]]`?
