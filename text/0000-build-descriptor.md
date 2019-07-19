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

The target personas for this proposal is buildpack users who need to enrich or configure buildpack execution. We introduce a new file, `build.toml`, with elements that support many different use cases.

## `[build]`

The top-level `[build]` table indicates that the repository containing the `build.toml` can be built with buildpacks. It contains one required key `id`, which defines the name of the image that's output from the build:

```toml
[build]
id = "<build id>"
```

There are also optional keys as follows:

```toml
[build]
name = "<build name>" # Human readable name of the project
version = "<build version>"
```

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

The `.gitignore` pattern is used in both cases. The `exclude` and `include` keys are mutually exclusive. Last one defined wins.

## `[build.publish]`

A boolean that, when set to `false`, will prevent a platform from publishing the image generated from a build to a registry.


## `[[buildpacks]]`

A `build.toml` may also contain an array that defines the buildpacks that will run on the app:

```toml
[[buildpacks]]
id = "<buildpack ID (required)>"
version = "<buildpack version (optional default=latest)>"
optional = "<bool (optional default=false)>"
uri = "<url or path to the buildpack (optional default=urn:buildpack:<id>)"
path = "<path to an inline buildpack (optional)"
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
name = "<image name>"
path = "."
stack = "<buildpack stack>"
```

* `name` (string, optional): by default inherits from `[build.name]`. If set will override the OCI image produced
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

<!--
## `[[patches]]`

The `[[patches]]` array of tables lets you override an inner buildpack dependency with a custom one.

```toml
[[patches]]
id = "<buildpack id>"
version = "<buildpack version>"
uri = "<url or path to the buildpack (optional default=urn:buildpack:<id>)"
path = "<path to an inline buildpack (optional)"
```

The `uri` and `path` are mutually exclusive as with the `[[buildpacks]]` table.
-->

## `[metadata]`

Keys in this table are not validated. It can be used to add platform specific metadata. For example:

```toml
[metadata.heroku]
pipeline = "foobar"
```

# How it Works
[how-it-works]: #how-it-works

Given the elements described above, we seek to satisfy the following use cases:

## Inline buildpacks

When a `build.toml` is found in the root directory of a project, and it contains the following element:

```toml
[[buildpacks]]
path = "./my-cnb"
```

Or to a standalone `buildpack.toml` file:

```toml
[[buildpacks]]
path = "config/buildpack.toml"
```

Then the lifecycle will use the buildpack contained in the directory defined by `path` to build the project.

## Monorepos

The `[[images]]` array of tables allows the buildpack lifecycle to generate more than one image per build. Each table in the array may contain configuration that defines a different image for different parts of the code. For example:

```toml
[[images]]
name = "my-service"
path = "service/"
  [[images.processes]]
  name = "web"
  cmd = "java -jar target/service.jar"

[[images]]
name = "my-gateway"
path = "gateway/"
  # array of processes used to run the image
  [[images.processes]]
  name = "web"
  cmd = "java -jar target/gateway.jar"
```

There is an open question about how we handle different buildpack groups for each image. It's also unclear if we actually run distinct builds, or if the images are derived from a single build.

## Codified Buildpacks

Given an app with a `build.toml`, the lifecycle will read the `build.buildpacks` and construct an ephemeral `buildpack.toml` that overrides the default buildpack groups in the builder image. Only the buildpacks listed in `build.buildpacks` will be run. For example, an app might contain:

```toml
[[buildpacks]]
id = "heroku/java"
version = "1.0"
```

These entries override any defaults in the builder image. If, for example, the app also contains a `Gemfile` and the `heroku/buildpacks` builder image is used, this will override the default buildpack groups, which would normally detect and run the `heroku/ruby` buildpack.

It is also possible to define multiple buildpacks, or create an order of buildpacks that includes an inline buildpack. For example:

```toml
[[buildpacks]]
id = "my-node-buildpack"
name = "My Node Buildpack"
version = "0.9"
[[buildpacks.order]]
group = [
   { id = "io.buildpacks.node", version = "0.0.5" },
   { id = "io.buildpacks.npm", version = "0.0.7" },
]

[[buildpacks]]
id = "my-npm"
name = "My NPM Buildpack"
version = "0.0.7"
path = "./npm-cnb/"

[[buildpacks]]
id = "io.buildpacks.node"
version = "0.0.5"
```

In this case, the inline NPM buildpack is combined with a standard Node engine buildpack to create a custom Node buildpackage.

There is an open question here regarding the order. How does the lifecycle know to use the `"my-node-buildpack"` and not the other buildpacks in the array.

<!--
Similarly, a buildpack within a buildpackage can be patched:

```toml
[[buildpacks]]
id = "io.buildpacks.nodejs"
version = "0.0.9"

[[patches]]
id = "io.buildpacks.npm"
uri = "https://example.com/npm.tgz"
```

This would override the `io.buildpacks.npm` included in the `io.buildpacks.nodejs` buildpackage.
-->

# Drawbacks
[drawbacks]: #drawbacks

- This proposal introduces yet another `.toml` file
- The `build.toml` in this proposal is not generic enough to be used for *any* project. It specifically defines the information need to run buildpacks on a project.
- The `build.toml` has significant overlap with `buildpack.toml`, which may be problematic if the schema of the `[[buildpacks]]` array table differs in the future.

# Alternatives
[alternatives]: #alternatives

- Name the file `project.toml` and the change the `[build]` table to `[project]`, but keep the schema described herein.
- Name the file `package.toml` and the change the `[build]` table to `[package]`,but keep the schema described herein.
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

There are some questions related to inline buildpacks:

- Is `path` overriding `uri` and other elements confusing?
- How does a `build.toml` containing `[[buildpacks]]` interplay with a `buildpack.toml` in the path of the inline buildpack?

With regard to monorepos:

- How does this handle monorepos that want to be built in more than one way (ex. a repo that contains a Node app and a Ruby app that are distinct codebases)?
- Do multiple `[[images]]`  result in multiple builds, or are the images derived from a single build?

Regarding codified buildpacks:

- If the codified buildpacks define a buildpackage, how does the lifecycle know to interpret it this way? Using the first buildpack in the list doesn't work like with `buildpack.toml`
