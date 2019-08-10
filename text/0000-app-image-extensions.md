# Meta
[meta]: #meta
- Name: App Image Extensions
- Start Date: 2019-08-09
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This RFC proposes an interface between a set of stack images and an app or platform in order to extend the images with app-specific packages.

# Motivation
[motivation]: #motivation

Allowing buildpacks to install OS packages dynamically during build would drastically increase CNB execution time, especially when CNB is used to build or rebase many apps with similar package requirements.

Mixins allow buildpack authors to create buildpacks that depend on an extended set of OS packages.

However, it is not uncommon for application code to depend on OS packages.
Given that app authors and platform maintainers experience increased CNB execution time directly, extending the stack at the app author's or platform maintainer's request may add flexibility without sacrificing performance.

# What it is
[what-it-is]: #what-it-is

Stack image creators may add the following executables to their run and/or build images:

```
/cnb/image/build/extend (pkg-cache-dir) | cwd: (app)
/cnb/image/run/extend (pkg-cache-dir) | cwd: (app)
```
* executes on base run or build images
* both base image and extended image digests stored in app image metadata
* on subsequent builds:
  * if the chosen run/build base image digest is different than the one in app image metadata, the chosen digest is extended
  * if the chosen run/build base image digest is the same, proceed to status

```
/cnb/image/build/status (pkg-cache-dir) | cwd: (app-dir)
/cnb/image/run/status (pkg-cache-dir) | cwd: (app-dir)
```
* executes on last-built extended run or build image (determined from last-built app image labels)
* exit status 100 = needs extension
* exit status 0 = does not need extension
* exit status other = unknown

The status executable must be invoked occasionally to poll for updates.

# How it Works
[how-it-works]: #how-it-works

Platforms may extend app images using the above interface by running the `extend` executable as root in a new container and creating an image from the result.
Extending an image should generate a single layer.
This should happen prior to the normal CNB build or rebase process.
The `app` directory is used to determine what packages to install.
The `pkg-cache` directory is used to cache package databases (e.g. to speed up `apt-get update`).

# Drawbacks
[drawbacks]: #drawbacks

- Requires kaniko (or a similar tool) when a docker daemon is unavailable
- Rebasing apps with package dependencies becomes many orders of magnitude slower
