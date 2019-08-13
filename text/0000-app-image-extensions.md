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
/cnb/image/build/extend (pkg-cache-dir) (build-metadata-toml-file) | cwd: /
/cnb/image/run/extend (pkg-cache-dir) (run-metadata-toml-file) | cwd: /
```
* executes on base run or build images
* writes metadata to `/cnb/image/build/metadata.toml` or `/cnb/image/run/metadata.toml`
* on subsequent builds, lookup latest upstream base image digest:
  * if the digest is different than extended image's base, the new upstream digest is extended
  * if the digest is the same, proceed to status

```
/cnb/image/build/status (pkg-cache-dir) (build-metadata-toml-file) | cwd: /
/cnb/image/run/status (pkg-cache-dir) (run-metadata-toml-file) | cwd: /
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
[extend.run]
packages = ["git"] # run-metadata-toml-file (stored on run image metadata)
[extend.build]
packages = ["git"] # build-metadata-toml-file (stored on builder image metadata)
```

Behavior: creates builder extended with packages as well as `sclevine/run` extended with packages.

### Upgrade an Extended Builder

Both build and run images: `pack upgrade sclevine/builder`

Run images (including mirrors): `pack upgrade sclevine/run`

### Upgrade an App

`pack upgrade sclevine/myapp`

This will run `pack upgrade sclevine/run`, generate an ephemeral image, and then run `pack rebase sclevine/run`.

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
