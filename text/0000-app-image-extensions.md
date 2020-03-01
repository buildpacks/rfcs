# Meta
[meta]: #meta
- Name: App Image Extensions
- Start Date: 2019-08-09
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This RFC proposes:
1. An interface between a set of stack images and a platform in order to extend the images
2. A UX for the pack CLI for extending builders with OS packages

# Motivation
[motivation]: #motivation

Allowing buildpacks to install OS packages dynamically during build would drastically increase build time, especially when CNB tooling is used to build or rebase many apps with similar package requirements.

Mixins already allow buildpack authors to create buildpacks that depend on an extended set of OS packages without affecting build time.
However, it is not uncommon for application code to depend on OS packages.

Given that app authors and platform maintainers experience increased build time directly, extending the stack at the app author's or platform maintainer's request may add flexibility without sacrificing performance.

# What it is
[what-it-is]: #what-it-is

## Specification

Stack image creators may add the following executables to their run and/or build images:

```
/cnb/image/build/extend (build-metadata-toml-file) (pkg-cache-dir) | cwd: /
/cnb/image/run/extend (run-metadata-toml-file) (pkg-cache-dir) | cwd: /
```
* executes on base run or build images
* writes metadata to `/cnb/image/build/metadata.toml` or `/cnb/image/run/metadata.toml`
* on subsequent builds, lookup latest upstream base image digest:
  * if the digest is different than extended image's base, the new upstream digest is extended
  * if the digest is the same, proceed to status

```
/cnb/image/build/status (build-metadata-toml-file) (pkg-cache-dir) | cwd: /
/cnb/image/run/status (run-metadata-toml-file) (pkg-cache-dir) | cwd: /
```
* executes on run or build base images
* metadata arg is `/cnb/image/build/metadata.toml` or `/cnb/image/run/metadata.toml`
* exit status 100 = existing base image digest is extended 
* exit status 0 = does not need extension
* exit status other = unknown

The status executable may be invoked to determine whether updates are necessary.

## UX

### Creating an Extended Builder

`pack create-builder sclevine/builder -b builder.toml`

builder.toml:
```toml
[stack]
id = "io.buildpacks.stacks.bionic"
build-image = "example.com/build"
run-image = "example.com/run"
run-image-mirrors = ["example.org/run"]

[extend]
run-image = "sclevine/run"
run-image-mirrors = ["scl.sh/run"]
[extend.run] # run-metadata-toml-file (stored on new run image metadata)
packages = ["git"]
[extend.build] # build-metadata-toml-file (stored on builder image metadata)
packages = ["git"]
```

Behavior: creates a new builder with additional packages as well as a new run image (`sclevine/run`) with additional packages.

If `extend.run-image` is not specified, `extend.run` is stored on the builder metadata and used to dynamically extend the run image on `pack build`.

### Extended an Existing Builder

`pack create-builder sclevine/builder -b builder.toml`

builder.toml:
```toml
[builder]
image = "example.com/builder"

[extend]
run-image = "sclevine/run"
run-image-mirrors = ["scl.sh/run"]
[extend.run] # run-metadata-toml-file (stored on new run image metadata)
packages = ["git"]
[extend.build] # build-metadata-toml-file (stored on new builder image metadata)
packages = ["git"]
```

Behavior: creates a new version of an existing builder with additional packages as well as a new run image (`sclevine/run`) with additional packages.

If `extend.run-image` is not specified, `extend.run` is stored on the new builder metadata and used to dynamically extend the run image on `pack build`.

Note that the `[builder]` section is mutually exclusive with `[stack]`.

### Building an App with Additional Packages

`pack build sclevine/myapp`

project.toml:
```toml
...
[run.extend] # run-metadata-toml-file (stored on new run image metadata)
packages = ["git"]
[build.extend] # build-metadata-toml-file (stored on new builder image metadata)
packages = ["git"]
...
```

Behavior: creates a version of the current builder with additional packages and an ephemeral run image with additional packages, then does a normal `pack build`.

Question: should we store the new builder image to make rebuild faster? If so, where? Should we generate a tag for it?

### Upgrade an Extended Builder

Both build and run images: `pack upgrade sclevine/builder`

Run images (including mirrors): `pack upgrade sclevine/run`

### Upgrade an App

`pack upgrade sclevine/myapp`

This will run `pack upgrade sclevine/run`, generate an ephemeral image, and then do the equivalent of `pack rebase sclevine/myapp`.

Attempting to rebase an app directly after it's been upgraded is not permitted and will fail, because the current base is now ephemeral.

# How it Works
[how-it-works]: #how-it-works

## Specification

Platforms may extend app images using the above interface by running the `extend` executable as root in a new container and creating an image from the result.
Extending an image should generate a single layer.
This should happen prior to the normal CNB build or rebase process.
The `*-metadata-toml-file` file is used to determine what packages to install.
The `pkg-cache-dir` directory is used to cache package databases (e.g. to speed up `apt-get update`).

## UX

`pack upgrade` (on base image)
1. See if new base image available, if so proceed to (3). Otherwise, (2).
2. Run status, if updates available, proceed to (3). Otherwise, stop.
3. Run extend and publish new image. Store extension metadata on images. 

If running `pack upgrade` on a builder, perform operation against both builder and run images and publish both.
If running `pack upgrade` on an app, perform operation against run image (with ephemeral output into app repo), then `pack rebase`.  

# Drawbacks
[drawbacks]: #drawbacks

- Requires kaniko (or a similar tool) when a docker daemon is unavailable
- Fully rebasing apps with package dependencies becomes many orders of magnitude slower, due to upgrade needs

# Questions
[questions]: #questions

What happens if you try to extend an extended builder?

Three options:

1. Fail

2. Treat the extended builder as a normal builder, and override the metadata.
   Advantages: Allows controlled, multi-level distribution model for changes. Easy to implement.
   Disadvantages: Requires `pack upgrade`ing multiple levels of builders to fully patch the most extended builder. 

3. Always save the existing metadata and the run image references each time. On `pack upgrade`, replay each extension.
   Advantages: Easy to upgrade builders with confidence.
   Disadvantages: Consumers of extended builders may upgrade them unintentionally (by upgrading their own nested extensions).

My preference is (3), but (1) would be a good place to start.
