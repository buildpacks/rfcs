# Meta
[meta]: #meta
- Name: Application Mixins
- Start Date: 2020-06-22
- Author(s): [Joe Kutner](https://github.com/jkutner/)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This is a proposal for allowing application developers (buildpack users) to specify mixins that will be dynamically included with their build and run images.

# Motivation
[motivation]: #motivation

Mixins already allow buildpack authors to create buildpacks that depend on an extended set of OS packages without affecting build time, but it's common for application code to depend on OS packages too. But allowing buildpacks to arbitrarily install OS packages during build would drastically increase build time, especially when CNB tooling is used to build or rebase many apps with similar package requirements. For that reason, this proposal defines a mechanism to implement mixin support for application developers without significant impact on build performance.

# What it is
[what-it-is]: #what-it-is

- *application developer* - a person who is using buildpacks to transform their application code into an OCI image
- *stackpack* - a new type of buildpack that runs against the stack image(s) instead of an app

A application developer may specify a list of mixins in their application's `project.toml` file like this:

```toml
[build]
mixins = [ "<mixin name>" ]
```

When a command like `pack build` is run, the list of mixins will be processed before buildpacks are run. For each mixin name, the following will happen:

* If the mixin name is prefixed with `build:` (as per [RFC-0006](https://github.com/buildpacks/rfcs/blob/main/text/0006-stage-specific-mixins.md)) the mixin will be dynamically added to the build image.
* If the mixin name is prefixed with `run:` (as per [RFC-0006](https://github.com/buildpacks/rfcs/blob/main/text/0006-stage-specific-mixins.md)) the mixin will be dynamically added to the run image.
* If the mixin name does not have a prefix it will be dynamically added to both the build and run stack images.

# How it Works
[how-it-works]: #how-it-works

When a list of mixins are defined in a `project.toml` and `pack build` is run against that project, the following will happen:

1. The lifecycle will compare the list of mixins to those provided by the stack. If all mixin names are provided by the stack, no further action is required.
1. In any requested mixin is not provided by the stack, the lifecycle will run the detect phase for all stackpacks defined in the builder.
1. The lifecycle will compare the mixins added to the build plan to see if they match they required mixins.
1. If at least one stackpack passes detect and provides the required mixin(s), the lifecycle will execute the stackpack build phase for passing stackpack(s). If no stackpacks pass detect, or no stackpacks provide the required mixin, the build will fail with a message that describes the mixins that could not be provided.
1. During the lifecycle's build phase, the stackpacks that passed detection will run against the build and run images accordingly (see details below). All stackpacks will be run before the user's buildpacks.

## Stackpacks

 A stackpacks is a special case of buildpack that has the following properties:

* Is run as the `root` user
* Configured with `privileged = true` in the `buildpack.toml`
* Can only create one layer
* Does not have access to the application source code
* Is run before all regular buildpacks
* Is run against both the build and run images
* Is distributed with the builder image
* May not write to the `/layers` directory

The stackpack interface is identical to the buildpack interface (i.e. the same `bin/detect` and `bin/build` scripts are required). However, some of the context it is run in is different from regular buildpacks.

For each stackpack, the lifecycle will use [snapshotting](https://github.com/GoogleContainerTools/kaniko/blob/master/docs/designdoc.md#snapshotting-snapshotting) to capture changes made during the stackpack's build phase (excluding `/tmp`, `/cnb`, and `/layers`). Alternatively, a platform may store a new stack image to cache the changes. All of the captured changes will be included in a single layer produced as output from the stackpack. The `/layers` dir MAY NOT be used to create arbitrary layers.

A stackpack is included in a builder by defining it in the `builder.toml` in the `[[stack.buildpacks]]` array of tables:

```
[[stack.buildpacks]]
id = "<stackpack id>"
uri = "<uri to stackpack>"
```

Each stackpack included in the builder will execute until all of a project's mixins have been provided.

The stackpack's snapshot layer may be modified by writing a `launch.toml` file. The `[[processes]]` and `[[slices]]` tables may be used as normal, and a new `[[excludes]]` table will be introduced with the following schema:

```
[[excludes]]
paths = ["<sub-path glob>"]
cache = false
```

Where:

* `paths` = a list of paths to exclude from the layer
* `cache` = if true, the paths will be excluded from the launch image layer, but will be included in the cache layer.

## Rebasing an App

App that uses stackpacks can be rebased as normal. Stackpacks are expected to retain ABI compatibility.

## Example: Apt Buildpack

 A buildpack that can install an arbitrary list of mixins would have a `buildpack.toml` like this:

 ```toml
[buildpack]
id = "example/apt"
privileged = true

[[stacks]]
id = "io.buildpacks.stacks.bionic"
```

Its `bin/detect` would have the following contents:

 ```bash
#!/usr/bin/env bash

cat <<TOML >"$2"
[[mixins]]
name = "[^=]+"
TOML
```

Its `bin/build` would have the following contents:

 ```bash
#!/usr/bin/env bash

apt update -y

for package in $(cat $3 | yj -t | jq -r ".entries | .[] | .name"); do
  apt install $package
done

cat << EOF > launch.toml
[[excludes]]
paths = [ "/var/cache" ]
cache = true
EOF
```

# Drawbacks
[drawbacks]: #drawbacks

- Mixins are less flexible that a generic [root buildpack](https://github.com/buildpacks/rfcs/blob/app-image-ext-buildpacks/text/0000-app-image-extensions.md).

# Alternatives
[alternatives]: #alternatives

- [Add root buildpack as interface for app image extension RFC](https://github.com/buildpacks/rfcs/pull/77)
- [App Image Extensions (OS packages)](https://github.com/buildpacks/rfcs/pull/23)

# Prior Art
[prior-art]: #prior-art

- [RFC-0006: Stage specific mixins](https://github.com/buildpacks/rfcs/blob/main/text/0006-stage-specific-mixins.md)
- The term "non-idempotent" is used in section 9.1.2 of [Hypertext Transfer Protocol -- HTTP/1.1 (RFC 2616)](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- How should a buildpack be identified as a stackpack?
    - Not everyone likes `privileged`
    - a special `key` in the `buildpack.toml`?
    - a `stackpack.toml`?
- Should the stackpack's detect have read-only access to the app?
    - In this proposal it does, and in the future a more generic "root buildpack" construct would need it too.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes


## Stackpacks

Stackpacks are identical to other buildpacks, with the following exceptions:

1. The `<layers>` directory is NOT writable
1. The working directory WILL NOT contain application source code.
1. All changes made to the filesystem (with the exception of `/tmp`) during the execution of the stackpack's `bin/build` will be snaphotted and stored as a single layer.
1. A `launch.toml` WILL NOT be honored.

## launch.toml (TOML)

```
[[excludes]]
paths = ["<sub-path glob>"]
cache = false
```

Where:

* `paths` = a list of paths to exclude from the layer
* `cache` = if true, the paths will be excluded from the launch image layer, but will be included in the cache layer.

## Build Plan (TOML)

```
[[mixins]]
name = "<mixin name pattern>"
type = "<provides | requires (default=provides)>"
```

Where:

* `type` - (default=`provides`) whether or not the mixin will be provided or required.
* `name` - a pattern used to match mixin names. adheres to [re2 syntax](https://github.com/google/re2/wiki/Syntax).

## buildpack.toml  (TOML)

 This proposal adds a new key to the `[buildpack]` table in `buildpack.toml`:

 ```
 [buildpack]
 privileged = <boolean (default=false)>
 non-idempotent = <boolean (default=false)>
 ```

* `privileged` - when set to `true`, the lifecycle will run this buildpack as the `root` user.
* `non-idempotent` - when set to `true`, indicates that the buildpack is not idempotent. The lifecycle will provide a clean filesystem from the stack image(s) before each run (i.e. no cache).