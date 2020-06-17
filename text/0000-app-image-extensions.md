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
1. A UX for the pack CLI for extending builders with OS packages
1. A type of buildpack that runs as the root user

# Motivation
[motivation]: #motivation

Allowing buildpacks to install OS packages dynamically during build would drastically increase build time, especially when CNB tooling is used to build or rebase many apps with similar package requirements.

Mixins already allow buildpack authors to create buildpacks that depend on an extended set of OS packages without affecting build time.
However, it is not uncommon for application code to depend on OS packages.

Given that app authors and platform maintainers experience increased build time directly, extending the stack at the app author's request may add flexibility without sacrificing performance. At the same time, we want the CNB interface to be highly orthogonal, which is why we've strived to "make everything a buildpack". Allowing some buildpacks to run with privileges would give users the flexibility they expect based on their experience with other tools like `Dockerfile`.

The advantages of using a buildpack for privileged operations are the same as for unprivileged operations: they are composable, fast (caching), modular, reusable, and safe.

As an example, consider the use case of Acme.com. They have three teams that want to contibute privileged layers to every image built at the company. Each of these teams wants to manage their own artifacts and the mechanisms for installing them, but none of these teams are in control of the base image. The teams have special logic for when their layers should be added to an image; in some cases it's the precense of a Node.js app, and in others it's the use of Tomcat, etc. In the past, these teams were trying to contribute their layers by selectively adding them to every `Dockerfile` for every base image in the company, but this doesn't scale well. With Root Buildpacks, each team can manage their own artifacts, release cadence, and add logic to `bin/detect` to ensure the layers are added when needed.

# What it is
[what-it-is]: #what-it-is

- *root buildpack* - a special case of buildpack that is run with privileges

Application developers can use root buildpacks to extend their build and/or run images.

We introduce a boolean `privileged` key in the `[buildpack]` table of `buildpack.toml`, which is defined as follows:

```
[buildpack]
privileged = <boolean (default=false)>
```

When `privileged` is set to `true`, the lifecycle will run this buildpack as the `root` user.

For each root buildpack, the lifecycle will use [snapshotting](https://github.com/GoogleContainerTools/kaniko/blob/master/docs/designdoc.md#snapshotting-snapshotting) to capture changes made during the buildpack's build phase (excluding `/tmp`, `/cnb`, and `/layers`). Alternatively to snapshotting, a platform may store a new stack iamge to cache the changes. All of the captured changes will be included in a single layer produced as output from the buildpack. The `/layers` dir MAY NOT be used to create arbitrary layers.

The buildpack can then exclude directories from the layer by writing to the `launch.toml` using a new `[[excludes]]` table, for example:

```toml
[[excludes]]
paths = [ "/var" ]
cache = true
```

* `paths` - a list of path globs to exclude from the run image
* `cache` - if set to `true`, the paths will be stored in the cache

The `[process]` and `[[slices]]` tables can be used as normal.

The following constraint(s) will be enforced:
* If a user attempts to create a buildpackage including both root buildpacks and non-root buildpacks, the process will fail.

# How it Works
[how-it-works]: #how-it-works

## Building an App with Additional Packages

Given a root buildpack with ID `example/git`, the following configuration can be used with a Golang app:

`project.toml`:
```toml
[[build.buildpacks]]
id = "example/git"
version = "1.0"

[[build.buildpacks]]
id = "example/golang"
version = "1.0"
```

When the following command is run, the app source code will be loaded into the image for access by the root buildpack.

`pack build sclevine/myapp`

All root buildpacks will be sliced out of the list of buildpacks, and run before non-root buildpacks. This creates a version of the current builder with additional layers and an ephemeral run image with additional layers, then does a normal build phase without running the root buildpacks.

After the build phase, *a new extend phase* will run the root buildpacks against the run-image to create an ephemeral base image that will be used by the export phase instead of the configured run-image.

* The run image layers are persistented as part of the app image, and can be reused on subsequent builds.
* The build image layers will be persisted as part of the cache, and can be reused on subsequent builds.
* Any paths that are excluded using `launch.toml` and set to be cached will be stored in the cache, and can be reused on subsequent builds.

## Upgrade an App

`pack upgrade sclevine/myapp`

This will run `pack upgrade sclevine/run`, generate an ephemeral image, and then do the equivalent of `pack rebase sclevine/myapp`.

Attempting to rebase an app directly after it's been upgraded is not permitted and will fail, because the current base is now ephemeral. In effect, we are saying that the use of root buildpacks breaks rebase.

When the base image has not changed
1. If the buildpacks are configure as idempotent (the default) load the previous layers onto the base images.
1. Run the buildpacks, creating an ephemeral image.
1. Rebase the app on to the new ephemeral image.

When there is an update to either the build or run base images
1. Pull the new base image(s)
1. Run the root buildpacks against the new image(s) without loading previous layers, and create an ephemeral image.
1. Rebase the app on to the new ephemeral image.

## Example: Apt Buildpack

A buildpack that reads an `apt.toml` file to install an arbitrary list of packages would have a `buildpack.toml` like this:

```toml
[buildpack]
id = "example/apt"
privileged = true
```

An end-user's `apt.toml` might look like this:

```toml
[build]
packages = [
  "libpq-dev"
]

[run]
packages = [
  "libpq",
  "ffmpeg"
]
```

The `bin/build` would look like:

```bash
#!/usr/bin/env bash

apt update

for package in $(cat apt.toml | yj -t | jq -r ".$CNB_STACK_TYPE.packages | .[]"); do
    apt install $package
done

cat << EOF > launch.toml
[[excludes]]
paths = [ "/var" ]
cache = true
EOF
```

# Alternatives

* https://github.com/buildpacks/rfcs/pull/23

# Drawbacks
[drawbacks]: #drawbacks

- Requires kaniko (or a similar tool) for snapshotting
- Fully rebasing apps with package dependencies becomes many orders of magnitude slower, due to upgrade needs
- Reliability of rebasing apps with package dependencies degrades and network and other external factors may break the process.
- Some buildpack users will not want to give root access to arbitrary buildpacks. Instead they may want to selectively whitelist certain root buildpacks.

# Questions
[questions]: #questions

* Should we allow non-root buildpacks to run in combination with root buildpacks?
* How do the packages installed by a root buildpack related (or not related) to mixins
    * That is, can you use a root buildpack to install a package that satisfies the requirements of a buildpacks' required mixins?

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
? = <boolean (default=false)>
```

* `privileged` - when set to `true`, the lifecycle will run this buildpack as the `root` user
* `?` - when set to `true`, indicates that the buildpack is not idempotent. The lifecycle will provide a clean filesystem from the base image before each run (i.e. no cache). Non-idempotent buildpacks cannot be combined.

## `launch.toml`

This proposal adds a new top level table in `launch.toml`:

```
[excludes]
paths = [ "<path glob>" ]
cache = <boolean (default=false)>
```

Path globs MUST:

* Follow the pattern syntax defined in the Go standard library.
* Match zero or more files or directories.
* Be absolute

Path globs are not restricted to the app dir as with [slices](https://github.com/buildpacks/spec/blob/master/buildpack.md#launchtoml-toml).

## `project.toml`

```
[[stack.build.buildpacks]]
id = "<buildpack ID (optional)>"
version = "<buildpack version (optional default=latest)>"
uri = "<url or path to the buildpack (optional default=urn:buildpack:<id>)"

[[stack.run.buildpacks]]
id = "<buildpack ID (optional)>"
version = "<buildpack version (optional default=latest)>"
uri = "<url or path to the buildpack (optional default=urn:buildpack:<id>)"
```

### `[[stack.build.buildpacks]]`

This table MAY include a list of root buildpacks to execute against the builder image.

### `[[stack.run.buildpacks]]`

This table MAY include a list of root buildpacks to execute against the run image.

## Environment

## Provided by the Lifecycle

| Env Variable      | Description         | Detect | Build | Launch
|-------------------|---------------------|--------|-------|--------
| `CNB_STACK_TYPE`  | 'build' or 'run'    | [x]    | [x]   |
