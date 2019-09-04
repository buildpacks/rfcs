# Meta
[meta]: #meta
- Name: Project Descriptor
- Start Date: 2019-06-11
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: https://github.com/buildpack/rfcs/pull/3

# Summary
[summary]: #summary

This is a proposal to add new tables and keys to `buildpack.toml` that allow it to contain configuration for apps, services, functions, and buildpacks.

**NOTE:** One of the proposed alternatives uses the filename `project.toml` with the same schema described in this RFC.

# Motivation
[motivation]: #motivation

This proposal is meant to address all of the following issues:

* Build metadata (i.e. information about the code being built)
* [Monorepos](https://github.com/buildpack/spec/issues/39)
* [Application descriptor](https://github.com/buildpack/spec/issues/44)
* Inline buildpacks
* [Ignoring files](https://github.com/buildpack/pack/issues/210)
* Multiple images (i.e. one build, multiple images as output)
* Custom launch configuration
* Codified buildpacks

# What it is
[what-it-is]: #what-it-is

Terminology:

* **project**: a repository containing source code for an app, service, function, buildpack or a monorepo containing any combination of those.
* **image**: the output of a running a buildpack(s) against a project
* **inline buildpack**: a buildpack that is part of a project's source code

The target personas for this proposal is buildpack users who need to enrich or configure buildpack execution. The new elements in  `buildpack.toml` support many different use cases including two new top level tables:

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

  [[project.buildpacks]]
  id = "<string>" # may reference [buildpack.id] in this file
  version = "<string>"
  optional = "<boolean>" # question: is there actually a use case for this?
  uri = "<url or path>"

[buildpack] # used for inline buildpack
# matches buildpack.toml

[[order]] # used for inline buildpack
# matches buildpack.toml

[[stacks]] # allowed, but ignored for inline buildpack
# matches buildpack.toml

[[images]]
id = "<string>"
path = "."
stack = "<string>"

  [images.launch.env]
  key1 = "<string>"
  key2 = "<string>"

  [images.build.env]
  key1 = "<string>"
  key2 = "<string>"

  [[images.processes]]
  name = "<string>"
  cmd = "<string>"

  [[images.buildpacks]]
  id = "<string>"
  version = "<string>"
  optional = "<boolean>"
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

## `[[project.buildpacks]]`

The `[[project.buildpacks]]` array defines the buildpacks that will run against the app:

```toml
[[project.buildpacks]]
id = "<buildpack ID (required)>"
version = "<buildpack version (optional default=latest)>"
optional = "<bool (optional default=false)>"
uri = "<url or path to the buildpack (optional default=urn:buildpack:<id>)"
```

* `id` (string, required): the ID ([as defined in the spec](https://github.com/buildpack/spec/blob/master/buildpack.md#buildpacktoml-toml) of another buildpack
* `version` (string, optional, default=`latest`): the version ([as defined in the spec](https://github.com/buildpack/spec/blob/master/buildpack.md#buildpacktoml-toml) of the dependent buildpack. The default is to use the latest available version of the buildpack (resolution of this value may be platform-dependent).
* `optional` (bool, optional, default=`false`): Defines whether this buildpack will be optional in `order.toml`.
* `uri` (string, optional, default=`urn:buildpack:<id>`): The exact location of the buildpack. If not specified the platform will resolve the `urn:buildpack:<id>` (making the resolution platform dependent).
* `path` (string, optional): The exact location in the repo of an inline buildpack. Overrides `uri`

The `uri` and `path` keys are mutually exclusive. These keys can be used to override buildpacks on the existing builder image (and in the future the registry).

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

Used to set environment variables at launch time

```toml
[images.launch.env]
key1 = "value"
key2 = "value"
```

Or set environment variables at build time:

```toml
[images.build.env]
key1 = "value"
key2 = "value"
```

## `[[images.processes]]`

Defines the default processes used to run an image.

```toml
[[images.processes]]
name = "<process name>"
cmd = "..."
```

This should mirror what is supported in `launch.toml`, which means that if `args` are add to support scratch images, they should be added here too.

## `[[images.buildpacks]]`

The images table may also contain an array of buildpacks. The schema for this table is the same as `[[project.buildpacks]]`:

```toml
[[images.buildpacks]]
id = "<buildpack ID (required)>"
version = "<buildpack version (optional default=latest)>"
optional = "<bool (optional default=false)>"
uri = "<url or path to the buildpack (optional default=urn:buildpack:<id>)"
path = "<path to an inline buildpack (optional)"
```

The array of buildpacks defined here will override the array in `[[project.buildpacks]]`, which allows for each image to be built from a different group of buildpacks.

## `[metadata]`

Keys in this table are not validated. It can be used to add platform specific metadata. For example:

```toml
[metadata.heroku]
pipeline = "foobar"
```

# How it Works
[how-it-works]: #how-it-works

Given the elements described above, we seek to satisfy the following use cases:

## Example: Basic buildpack

This is a complete `buildpack.toml` for a simple buildpack:

```toml
[buildpack]
id = "io.buildpacks.node"
version = "0.1"

[[stacks]]
id = "io.buildpacks.stacks.bionic"
```

No other configuration is required. Alternatively, the `[project]` table could be used, but the `buildpack` would be required to define buildpack specific elements. For example:

```toml
[project]
id = "io.buildpacks.node"
version = "0.1"

[[stacks]]
id = "io.buildpacks.stacks.bionic"

[[order]]
group = [
  { id = "io.buildpacks.node-engine", version = "0.1" },
  { id = "io.buildpacks.npm", version = "0.1" }
]
```

This defines a valid buildpack.

## Example: Basic app

This is a complete `buildpack.toml` for a simple app:

```toml
[project]
id = "io.buildpacks.my-app"
version = "0.1"
```

No other configuration is required.

## Example: Inline buildpacks

When a `buildpack.toml` is found in the root directory of a project, and it contains the following elements:

```toml
[buildpack]
id = "io.buildpacks.inline"
version = "0.0.1"
```

Then this buildpack can be referenced in the `[[project.buildpacks]]` array. The schema for the `[buildpack]` table remains the same, and all capabilities available to a normal buildpack (dependencies, order, stacks, etc) are available to an inline buildpack. A complete `buildpack.toml` might look like this:

```toml
[project]
id = "io.buildpacks.my-app"
version = "0.1"

[[project.buildpacks]]
id = "io.buildpacks.inline"
version = "0.0.1"

[buildpack]
id = "io.buildpacks.inline"
version = "0.0.1"
```

The `stack` key is optional for inline buildpacks, since they're meant to be used against the stack the project is using.

There is an open question as to whether or not we should simplify the above example so that `[[project.buildpacks]]` can have a pointer to the buildpack defined in `[buildpack]` instead of repeating the `id` and `version`.

If the repository describe here were packaged with a command like `pack create-package`, then the `id` and `version` in the `[buildpack]` table would override the values defined in the `[project]`. Thus, a buildpackage with id `io.buildpacks.inline` would always be created.

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

Given an app with a `buildpack.toml`, the lifecycle will read the `project.buildpacks` and generate an ephemeral buildpack group in the lifecycle. Only the buildpacks listed in `project.buildpacks` will be run (no other groups will be run). For example, an app might contain:

```toml
[[project.buildpacks]]
id = "heroku/java"
version = "1.0"
```

These entries override any defaults in the builder image. If, for example, the project code contains a `Gemfile` and the `heroku/buildpacks` builder image is used, this will override the default buildpack groups, which would normally detect and run the `heroku/ruby` buildpack.

It is also possible to define multiple buildpacks, or create an order of buildpacks that includes an inline buildpack. For example:

```toml
[[project.buildpacks]]
id = "my-node-buildpack"
version = "0.9"

[[buildpack]]
id = "my-node-buildpack"
name = "My Node Buildpack"
version = "0.9"
[[order]]
group = [
   { id = "io.buildpacks.node", version = "0.0.5" },
   { id = "io.buildpacks.npm", version = "0.0.7" },
]
```

In this case, the inline NPM buildpack is combined with a Node engine buildpack to create a custom Node buildpack.

# Drawbacks
[drawbacks]: #drawbacks

- This proposal merges to previously distinct concepts: projects/apps and buildpacks. However, by both concepts have many similar attributes and combining them enables the use of buildpacks to build buildpacks.
- The use of a `buildpack.toml` to define an app may not be intuitive to a buildpack author who has already used it on a buildpack.

# Alternatives
[alternatives]: #alternatives

- Name the file `project.toml` and keep the schema described herein.
- Name the file `package.toml` and keep the schema described herein.
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

- Do multiple `[[images]]`  result in multiple builds, or are the images derived from a single build?
- Is only one of `[project]`, `[[images]]`, or `[buildpack]` required?
- Should `[[project.buildpacks]]` support a key that allows it to point to the `[buildpack]` table?
