# Meta
[meta]: #meta
- Name: App Image Extensions
- Start Date: 2019-08-09
- Author(s): [Stephen Levine](https://github.com/sclevine), [Joe Kutner](https://github.com/jkutner/)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This RFC proposes:
1. An interface between a set of stack images and a platform in order to extend the images
2. A UX for the pack CLI for extending builders with OS packages
3. A type of buildpack that runs as the root user

# Motivation
[motivation]: #motivation

Allowing buildpacks to install OS packages dynamically during build would drastically increase build time, especially when CNB tooling is used to build or rebase many apps with similar package requirements.

Mixins already allow buildpack authors to create buildpacks that depend on an extended set of OS packages without affecting build time.
However, it is not uncommon for application code to depend on OS packages.

Given that app authors and platform maintainers experience increased build time directly, extending the stack at the app author's or platform maintainer's request may add flexibility without sacrificing performance. At the same time, we want the CNB interface to be highly orthogonal, which is why we've strived to "make everything a buildpack". Allowing some buildpacks to run with privileges would give users the flexibility they expect based on their experience with other tools like `Dockerfile`.

The advantages of using a buildpack for privileged operations are the same as for unprivileged operations: they are composable, fast (caching), modular, reuseable, and safe.

As an example, consider the use case of Acme.com. They have three teams that want to contibute privileged layers to every image built at the company. Each of these teams wants to manage their own artifacts and the mechanisms for installing them, but none of these teams are in control of the base image. The teams have special logic for when their layers should be added to an image; in some cases it's the precense of a Node.js app, and in others it's the use of Tomcat, etc. In the past, these teams were trying to contribute their layers by selectively adding them to every `Dockerfile` for every base image in the company, but this doesn't scale well. With Root Buildpacks, each team can manage their own artifacts, release cadence, and add logic to `bin/detect` to ensure the layers are added when needed.

# What it is
[what-it-is]: #what-it-is

Stack image creators and buildpack users can use buildpacks to extend their build and/or run images.

## Specification

Introduce a boolean `privileged` key in the `[buildpack]` table of `buildpack.toml`, which is defined as follows:

```
[buildpack]
privileged = <boolean (default=false)>
```

When `privileged` is set to `true`, the lifecycle will run this buildpack as the `root` user.

For each Root Buildpack, the lifecycle will mount an overlay filesystem before the buildpack's build phase executes (excluding `/tmp`, `/cnb`, and `/layers`). The buildpack can then create layers normally by writing to the `<layers>/` directory the same way an unprivileged buildpack would. However, a new `paths` key would be added to the `<layers>/<layer>.toml` schema:

```
paths = ["<path glob>"]
launch = <boolean>
build = <boolean>
cache = <boolean>
```

The `paths` array defines the directories and files from the overlay filesystem that should be included in the layer. If an unprivileged buildpack uses the `paths` key, it will be ignored.

The `launch` and `build` keys can be used as normal, but how they are interpreted will differ based on where they are run (i.e. a launch-only layer will be discarded when the buildpack is run on a build-image, and a build-only layer will be discarded when the buildpack is run on a run-image).

If a Root Buildpack (i.e. a buildpack with `privileged = true`) is included in a `[[build.buildpacks]]` list in an app's `buildpack.toml`, the build will fail.

## UX

### Creating an Extended Builder

`pack create-builder sclevine/builder --config builder.toml --run-image sclevine/run --run-image-mirror scl.sh/run`

builder.toml:
```toml
[stack]
id = "io.buildpacks.stacks.bionic"
build-image = "example.com/build"
run-image = "example.com/run"
run-image-mirrors = ["example.org/run"]

[[stack.build.buildpacks]]
id = "example/git"
version = "1.0"

[[stack.run.buildpacks]]
id = "example/git"
version = "1.0"
```

Behavior: creates a new builder with layers applied from the `example/git` buildpack as well as a new run image (`sclevine/run`) with layers applied from the `example/git` buildpack.

**Note:** If `--run-image` is not specified, the builder metadata could be used to dynamically extend the run image on `pack build`. This would make every initial `pack build` slower, so I consider this optimization out-of-scope for this RFC.

### Extended an Existing Builder

`pack extend-builder sclevine/builder --extension-config extend.toml --run-image sclevine/run --run-image-mirror scl.sh/run`

extend.toml:
```toml
[[stack.build.buildpacks]]
id = "example/git"
version = "1.0"

[[stack.run.buildpacks]]
id = "example/git"
version = "1.0"
```

Behavior: creates a new version of an existing builder with layers applied from the `example/git` buildpack as well as a new run image (`sclevine/run`)  with layers applied from the `example/git` buildpack.

**Note:** If `--run-image` is not specified, the builder metadata could be used to dynamically extend the run image on `pack build`. This would make every initial `pack build` slower, so I consider this optimization out-of-scope for this RFC.

### Building an App with Additional Packages

`pack build sclevine/myapp`

project.toml:
```toml
[[stack.build.buildpacks]]
id = "example/git"
version = "1.0"

[[stack.run.buildpacks]]
id = "example/git"
version = "1.0"
```

Behavior: creates a version of the current builder with additional layers and an ephemeral run image with additional layers, then does a normal `pack build`. The run image is persistented as part of the app image, and can be reused on subsequent builds.

Questions:
- should we store the new builder image to make rebuild faster? If so, where? Should we generate a tag for it? Can we use the buildpack cache for this?
- should the buildpack have access to the app source code?

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

Platforms may extend app images using the above interface by running the root buildpacks and creating an image from the result. This should happen prior to the normal CNB build or rebase process.

## UX

`pack upgrade` (on base image)
1. See if new base image available, if so pull the new base image(s)
1. Run the extension buildpack(s) against each base image.

If running `pack upgrade` on a builder, perform operation against both builder and run images and publish both.
If running `pack upgrade` on an app, perform operation against run image (with ephemeral output into app repo), then `pack rebase`.

## Example: Imagemagick Buildpack

For a buildpack that installs the Imagemagick package, the `buildpack.toml` would look like:

```toml
[buildpack]
id = "example/imagemagick"
privileged = true
```

The `bin/build` would look like:

```bash
#!/usr/bin/env bash

apt update
apt install imagemagick

cat << EOF > ${1}/usr.toml
paths = [ "/usr" ]
launch = true
build = true
cache = true
EOF

cat << EOF > ${1}/var.toml
paths = [ "/var" ]
launch = false
build = false
cache = true
EOF
```

# Alternatives

- Instead of adding `paths` to the `<layer>.toml`, the lifecycle could save the entire overlay as a layer. This mimics the behavior of the `RUN` directive of `Dockerfile`.
- Make the overlay filesystem optional by adding a boolean `overlay` key in the `[buildpack]` table in `buildpack.toml`. When disabled, the Root Buildpack would still have root access, but it's changes to the filesystem would be discarded.

# Drawbacks
[drawbacks]: #drawbacks

- Requires kaniko (or a similar tool) when a docker daemon is unavailable
- Fully rebasing apps with package dependencies becomes many orders of magnitude slower, due to upgrade needs
- Reliability of rebasing apps with package dependencies degrades and network and other external factors may break the process.
- Some buildpack users will not want to give root access to any-and-all buildpacks. Instead they may want to selectively whitelist certain root buildpacks.
- The overlayfs could get messy
   - is it portable (windows?)
   - will there be unexpected edge cases?
   - requires privileges?
   - works for docker...


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

# References

Encorporated suggested UX tweaks from Javier Romero's doc: https://hackmd.io/zuzsIAh5QGKcQt_EZAcXaw?view

# Spec. Changes
[spec-changes]: #spec-changes

The following spec changes will be made as a result of accepting this proposal.

## `buildpack.toml`

This proposal adds a new key to the `[buildpack]` table in `buildpack.toml`:

```
[buildpack]
privileged = <boolean (default=false)>
```

* `privileged` - when set to `true`, the lifecycle will run this buildpack as the `root` user

## Layer Content Metadata (TOML)

This proposal adds a new key to the Layer Content Metadata schema:

```toml
launch = false
build = false
cache = false
paths = [ "<path glob>" ]

[metadata]
# buildpack-specific data
```
