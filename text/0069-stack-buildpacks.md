# Meta
[meta]: #meta
- Name: Stack Buildpacks
- Start Date: 2020-08-27
- Author(s): [@jkutner](@jkutner)
- Status: Superseded
- RFC Pull Request: [rfcs#111](https://github.com/buildpacks/rfcs/pull/111)
- CNB Pull Request: (leave blank)
- CNB Issue: [buildpacks/spec#177](https://github.com/buildpacks/spec/issues/177), [buildpacks/spec#178](https://github.com/buildpacks/spec/issues/178), [buildpacks/spec#170](https://github.com/buildpacks/spec/issues/170), [buildpacks/lifecycle#501](https://github.com/buildpacks/lifecycle/issues/501), [buildpacks/pack#1021](https://github.com/buildpacks/pack/issues/1021)
- Supersedes: N/A

# Summary
[summary]: #summary

This is a proposal for a new type of buildpack that runs against a stack in order to extend it in ways that are only possible by running privileged commands.

# Motivation
[motivation]: #motivation

Normally, buildpacks do not run as root. This is an intentional design decision that ensures operations like `rebase` will work on day-2.

However, many applications and buildpacks require modifications to the stack they run on, such as adding system packages or custom certificates. For this reason, we need a mechanism that stack authors, buildpack authors, and buildpack users can leverage to extend their stacks.

# What it is
[what-it-is]: #what-it-is

- *stack buildpack* - (a.k.a. stackpack) a type of buildpack that runs with root privileges against the stack image(s) instead of an app. Stack buildpacks must not make changes to the build and run images that either violate stack [compatibility guarantees](https://github.com/buildpacks/spec/blob/main/platform.md#compatibility-guarantees) or violate the contract defined by that stack's author.
- *application buildpack* - the traditional definition of a buildpack (i.e. does not run as root, and runs against an app)
- *app image* - the final image produced by a buildpack build. It consists of a run-image combined with layers created by buildpacks.
- *extend phase* - a new buildpack phase in which a stack buildpack may create a layer for the app image.

A new type of buildpack, called a stack buildpack, may run against a stack (both build and run images) in order to extend it in ways that are only possible by running privileged commands. Unlike application buildpacks, stack buildpack can modify any path (with exceptions) on the filesystem. Application buildpacks can only create/modify disjoint layers (either by adding a dir to `<layers>` or modifying an app slice), which makes possible features like individual layer reuse that is independent of ordering.

A stackpack may also define a list of mixins that it can provide to the stack, or indicate that it can provide _any_ mixin. In this way, a stack that is missing a mixin required by a buildpack may have that mixin provided by a stack buildpack.

A stack provider may choose to include stack buildpacks with the stack they distribute. If a stack includes a `/cnb/stack/order.toml` file and associated stackpacks, then the following will occur:

* Before any lifecycle phases:
    1. The platform may compare the list of mixins that are statically required by all buildpacks (in the `stacks` sections of their `buildpack.toml` files) with the static list of mixins provided by the stack images and the stack buildpacks (in the `stacks` sections of their `buildpack.toml` files), and fail the build if the required mixins cannot be provided.

* During the detect phase:
    1. The lifecycle will compare the list of required mixins to the list of mixins provided by stack and stack buildpacks in accordance with [stage-specific mixin rules](https://github.com/buildpacks/rfcs/pull/109). If any mixins are still not provided, the build will fail. To accomplish this, the list of run-time and build-time mixins that are already present in the run image and build image must be provided to the detector.
    1. The lifecycle will merge and run the detect phase for all stackpacks defined in the `/cnb/stack/order.toml` and for all application buildpacks defined in `/cnb/order.toml`.

* During the build phase (potentially in parallel to extend phase):
    1. The lifecycle will execute the stack buildpack build phase with root privileges for all passing stackpack(s).
    1. The lifecycle will drop privilidges and continue the build phase as normal (running application buildpacks).

* During the extend phase (potentially in parallel to build phase):
    1. During the extend phase, stack buildpacks that passed detection will run against the run image accordingly (see details below).

# How it Works
[how-it-works]: #how-it-works

 A stack buildpack is a special case of buildpack that has the following properties:

* Is run as the `root` user
* Configured with `privileged = true` in the `buildpack.toml`
* Can only create one layer that is exported in the app image
* May include, in the created layer, modifications to any part of the filesystem, excluding `<app>`, `<layers>`, `<platform>`, and `<cnb>` directories as well as other directories [listed below](#spec-changes-optional).
* Must not access the application source code during the `build` phase
* Must run before all application buildpacks if it passes detection
* Must run against both the build and run images if it passes detection for that stack type
* Must be distributed with the stack build image, and may be distributed with the stack run image
* May not create layers using the `<layers>` directory

The stackpack interface is similar to the buildpack interface:
* The same `bin/detect` and `bin/build` scripts are required
* The positional arguments for `bin/detect` and `bin/build` are the same as with application buildpacks
* The environment variables and inputs for `bin/detect` and `bin/build` are the same as with application buildpacks (though the values may be different)
* The working directory is `/` instead of the app source directory
* The stackpacks will run in the existing build phase as well as a new extend phase. The _extend_ phase will be responsible for running stack buildpacks on the run-image, and creating layers that will be applied to the app image.

For each stackpack, the lifecycle will use [snapshotting](https://github.com/GoogleContainerTools/kaniko/blob/master/docs/designdoc.md#snapshotting-snapshotting) to capture changes made during the stackpack's build or extend phases excluding a few specific directories and files.

All of the captured changes in the extend phase will be included in a single layer produced as output from the stackpack, which will be mounted into the `/run-layers` directory of the export container. Any changes performed by the stack buildpack to the build image will persist through execution of application buildpacks, but not exported as a layer.

The `<layers>` dir MAY NOT be used to create arbitrary layers.

A stack can provide stackpacks by including them in the `/cnb/stack/buildpacks` directory, and providing an `/cnb/stack/order.toml` (following the [`order.toml` schema](https://github.com/buildpacks/spec/blob/main/platform.md#ordertoml-toml)) to define their order of execution. The order can be overridden in the `builder.toml` with the following configuration:

```
[[stack.order]]
  [[stack.order.group]]
    id = "<stackpack id>"
```

A stackpack will only execute if it passes detection. When the stackpack is executed, its detect and build scripts use the same parameters as the application buildpacks.

The stackpack's snapshot layer may be enriched by writing a `stack-layer.toml` file. The `stack-layer.toml` may define globs of files to be _excluded_ from the image. Any excluded path may also be marked as _cached_, so that the excluded files are recovered before the build or extend phase. The term _excluded_ is defined as:

* *Excluded during build phase*: Files at matching paths are removed from the filesystem before application buildpack execution. If cached, on subsequent build operations, the excluded files will be restored to the build-image filesystem before stackpack execution.
* *Excluded during extend phase*: A given path is excluded from the snapshot layer (and thus from the final image). If cached, on subsequent build or rebase operations, the excluded files will be restored to the run-image filesystem before stackpack execution.

For example, a stack buildpack may choose to exclude `/var/cache` from the final app image, but may want to mark it as _cached_ to have it restored before the extend phase.

## Mixins

### Providing Mixins

A stack buildpack MAY define a set of mixins it provides statically in the `buildpack.toml` with the following schema:

```
[[stacks]]
id = "<stack id or *>"

[stacks.provides]
mixins = [ "<mixin name or *>" ]
```

### Requiring Mixins

A stack buildpack MAY NOT require any entries in the build plan (neither mixins nor non-mixins). This ensures that we do not need to re-run the detect phase.

An application buildpack MAY require mixins in the build plan

```
[[requires]]
mixin = "<mixin name>"
```

An application buildpack MAY NOT provide mixins in the build plan.

### Resolving Mixins

After the detect phase, the lifecycle will merge the list of provided mixins from the following sources:
* Build stack image mixin list
* Run stack image mixin list
* `buildpack.toml` of any stack buildpacks

If any required mixins from the Build Plan (any `[[requires]]` tables with `mixins`) are not provided, then the build will fail. Otherwise the build will continue.

If a stack buildpack provides a mixin that is not required, the stack buildpack MAY pass detection. For each phase, if a stackpack:
* provides mixins, and at least one of those mixins are required; it MAY pass
* provides mixins, and none of those mixins are required; it MUST be skipped
* provides mixins, and none of those mixins are required, but it also provides another dependency (non-mixin), which is required; it MAY pass following the normal build plan rules
* does not provide mixins; it MAY pass

If a mixin is required for a [single stage only](https://github.com/buildpacks/rfcs/pull/109) with the `build:` or `run:` prefix, a stack buildpack may declare that it provides it for both stages without failing detection. However, it will not be included in the Buildpack Build Plan during the stage where it is not required.

During the detect phase, the lifecycle will create a build plan containing only the entries required during that stage (build or run) without the [stage-specifier prefix](https://github.com/buildpacks/rfcs/pull/109).
* If a mixin is required for "run" stage only, it will not appear in the buildpack plan entries during build
* If a mixin is required for "build" stage only, it will not appear in the buildpack plan entries during extend

The entries of the buildpack plan during the build and extend phases will have a new `mixin` key. For example:

```
[[entries]]
mixin = "libpq"
```

A stack buildpack that needs to install mixins must select them from the build plan.

### Example: Any Mixin Buildpack

As an example of these resolution rules, consider an Apt stackpack that provides any (`*`) mixin. During the detect phase, the stackpack will pass in the following cases:
* a mixin is required by a buildpack
* a mixin is [required by an app](https://github.com/buildpacks/rfcs/pull/112)

The example stackpack will be skipped after detection in the following cases:
* no mixins are required by any component of the build
* a mixin is required by a buildpack, but the stack already provides that mixin
* a mixin is required by an app, but the stack already provides that mixin

### Example: PostgreSQL Certs

As another example of these resolution rules, consider a stackpack that provides the `libpq` mixin and a build plan dependency called `db-cert`. During the detect phase, the stackpack will pass in the following cases:
* a Ruby app requires the `libpq` mixin and the `db-cert`
* a Java app requires only the `db-cert`
* a Python app requires the `db-cert` and the stack already provides the `libpq` mixin

The example stackpack will be skipped after detection in the following cases:
* an app requires the `libpq` mixin but not the `db-cert`
* an app requires neither the `libpq` mixin nor the `db-cert`

### Example: Chrome and Chromedriver

As another example of these resolution rules, consider a stackpack that provides the `google-chrome-stable` mixin and a build plan dependency called `chromedriver`. During the detect phase, the stackpack will pass detection in the following cases:
* an app requires the `google-chrome-stable` mixin and the `chromedriver`
* an app requires only the `chromedriver`
* an app requires the `chromedriver` and the stack already provides the `google-chrome-stable` mixin

The example stackpack will be skipped after detection in the following cases:
* an app requires the `google-chrome-stable` mixin but not the `chromedriver`
* an app requires neither the `google-chrome-stable` mixin nor the `chromedriver`

During the build phase the example stackpack will be given a [buildpack plan](https://github.com/buildpacks/spec/blob/main/buildpack.md#buildpack-plan-toml) containing the entries it must provide. For example, if both dependencies are required it will receive:

```toml
[[entries]]
mixin = "google-chrome-stable"

[[entries]]
name = "chromedriver"
```

If only the `chromedriver` is required, or the `google-chrome-stable` is already provided by the stack, the build phase would receive:

```toml
[[entries]]
name = "chromedriver"
```

If the stack does not already provide `google-chrome-stable`, the stackpack may install it anyways, even if the app didn't require it. This prevents the case where an app may not work at runtime if that app requires only the `chromedriver` and the `google-chrome-stable` is not provided by the stack.

## Caching and Restoring

During the export phase, the lifecycle will store any excluded cached stackpack layers created during the build or extend phase in the cache.

During the restore phase of the next build, the lifecycle will download the excluded cached stackpack layers with the cache and store them as tarballs in the `<layers>` directory and the `<run-layers>` directory (i.e. they will not be extracted). The `restorer` cannot extract these layers because it will not run with root privileges. In addition, the `restorer` may run in a different container than the build, which means changes made to the base image are not guaranteed to carry forward. The `builder` will run with root privileges and untar these layers and cache, but will drop privileges after executing stackpacks and before running application buildpacks. The `extender` will also run with root privileges and untar the cache.

During the build phase, after ALL stackpacks have run but before the application buildpacks have run, the lifecycle will forcefully delete everything in `[[excludes]]` (which implies that it does not need to do this for extend phase).

## Rebasing an App

Before an app image is rebased, the platform must re-run any stackpacks that were used to build the app image, against the new run-image. It will determine which stackpacks to run using a provided [`stack-group.toml`](https://github.com/buildpacks/spec/blob/main/platform.md#grouptoml-toml). The Buildpack Plan will be stored in a LABEL of the app image, which will be serialized back to a `plan.toml` during rebase. To each stackpack, it will pass the buildpack plan derived from the provided [`plan.toml`](https://github.com/buildpacks/spec/blob/main/platform.md#plantoml-toml).

The image containing the stack buildpacks and the lifecycle binary must be provided to the rebaser operation as an argument. A platform may choose to provide the same stack buildpacks and lifecycle binary used during the build that create the app image being rebased, or it may provide updated versions (which may increase the risk of something failing in the rebase process).

A platform may choose to store the stack buildpacks and extender binary in any of the following images:
* A companion image of the app image
* A builder image that is available when rebasing
* The app image itself (store the stack buildpacks and builder binary alongside the application itself)

Then, the rebase operation can be performed as normal, while including the stackpack layers as part of the stack. This will be made possible by including the stackpack in the run-image, but because the stackpack detect phase is not run, the operation does not need access to the application source.

## Stack Platform Directory

The `detect` and `build` phases will be provided with a stack-specific platform directory, instead of the application platform directory. In this way, the lifecycle can ensure that no environment variables or other platform-specific extensions are coming from other buildpacks or other sources that may impact the stackpacks ability to successful rebase in the future.

The new stack-specific platform directory will require new options for the lifecycle detect and build interfaces, but the stackpacks `detect` and `build` executables will retain the same interface (i.e. they simply get a different platform dir than other buildpacks).

## Example: Apt Buildpack

(**note**: this is only an example. A real Apt Buildpack would probably be more robust).

A buildpack that can install an arbitrary list of mixins would have a `buildpack.toml` like this:

 ```toml
[buildpack]
id = "example/apt"
privileged = true

[[stacks]]
id = "io.buildpacks.stacks.bionic"

[stacks.provides]
mixins = [ "*" ]
```

Its `bin/detect` would have the following contents:

 ```bash
#!/usr/bin/env bash

exit 0
```

Its `bin/build` would have the following contents:

 ```bash
#!/usr/bin/env bash

apt update -y

for package in $(cat $3 | yj -t | jq -r ".entries | .[] | .mixin"); do
  apt install $package
done

cat << EOF > $1/stack-layer.toml
[[excludes]]
paths = [ "/var/cache" ]
cache = true
EOF
```

Based on the proposal in [App Mixins](https://github.com/buildpacks/rfcs/pull/112), the user's `project.toml` might include:

```toml
[build]
mixins = [ "libpq" ]
```

This would instruct the Apt Buildpack to install the libpq package.

## Example: CA Certificate Buildpack

Support for custom CA Certificates can be accomplished with two buildpacks: a stackpack that can install the cert, and an application buildpack that can provide a cert in the build plan.

### CA Cert Installer Stackpack

A buildpack that installs custom CA Certificates would have a `buildpack.toml` that looks like this:

```toml
[buildpack]
id = "example/cacerts"
privileged = true

[[stacks]]
id = "io.buildpacks.stacks.bionic"
```

Its `bin/detect` would have the following contents:

 ```bash
#!/usr/bin/env bash

cat << EOF > $2
[[provides]]
name = "cacert"
EOF

exit 0
```

Its `bin/build` would would install each `cacert` in the build plan. It would have the following contents:

 ```bash
#!/usr/bin/env bash

# filter to the cert
for file in $(cat $3 | yj -t | jq -r ".entries | .[] | select(.name==\"cacert\") | .metadata | .file"); do
  cert="$(cat $3 | yj -t | jq -r ".entries | .[] | select(.name==\"cacert\") | .metadata | select(.file==\"$file\") | .content")"
  echo $cert > /usr/share/ca-certificates/$file
  chmod 644 /usr/share/ca-certificates/$file
done

update-ca-certificates
```

### CA Cert Injector Buildpack

The stackpack must be used with a buildpack that requires a certificate(s) for it to install. That buildpack would have the following `buildpack.toml`:

```toml
[buildpack]
id = "my/db-cert"

[[stacks]]
id = "io.buildpacks.stacks.bionic"
```

Its `bin/detect` would require a certificate with the following contents:

 ```bash
#!/usr/bin/env bash

cat << EOF > $2
[[requires]]
name = "cacert"

[requires.metadata]
file = "database.crt"
content = """
$(cat $CNB_BUILDPACK_DIR/database.crt)
"""

[[requires]]
name = "cacert"

[requires.metadata]
file = "server.crt"
content = """
$(cat $CNB_BUILDPACK_DIR/server.crt)
"""
EOF

exit 0
```

Its `bin/build` would do nothing, and `have the following contents:

 ```bash
#!/usr/bin/env bash

exit 0
```

## Example: jq mixin

A buildpack may that requires the `jq` package may have it provided by either a stack, stack buildpack, or application buildpack.

```toml
[[or.requires]]
mixin = "jq"

[[or.requires]]
name = "jq"
```

## Future work

In the future, we plan to enhance the stack buildpack interface with the following:

* Tentatively, add a `CNB_STACK_TYPE` env var that a stack buildpack can use to behave differently on each part of the stack
* Support for `creator`. Because of the new extend phase, it is not possible to easily run the entire buildpack process with a single binary.
* Snapshot caching during the build and extend phase, which would allow stackpack authors cache all changes to the filesystem.

# Drawbacks
[drawbacks]: #drawbacks

- Stack buildpacks cannot be provided by the end user (the app developer), they can only by provided by stack creators

# Alternatives
[alternatives]: #alternatives

- [Add root buildpack as interface for app image extension RFC](https://github.com/buildpacks/rfcs/pull/77)
- [App Image Extensions (OS packages)](https://github.com/buildpacks/rfcs/pull/23)
- [Root Buildpacks](https://github.com/buildpacks/rfcs/blob/root-buildpacks/text/0000-root-buildpacks.md): Allow application developers to use root buildpacks in `project.toml`. This would have significant performance implications, and creates a "foot gun" in which end users could build images they are not able to maintain. For this reason, we are holding off on a generic root buildpack feature.

# Prior Art
[prior-art]: #prior-art

* [Heroku Apt Buildpack](https://github.com/heroku/heroku-buildpack-apt)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- what about the bill of materials?
    - extend phase artifacts go in the BOM
    - build phase go in report.toml
- how do we prevent problems on rebase if the mixins provided by the stack change?
- how does detect know the run-image mixins?
- If a mixin is required for build, but is not needed for extend, does the stackpack execute in both phases (and visa versa)?
- How is the buildpack plan provided to a stack buildpack during the extend phase of a rebase operation?
- Will `io.buildpacks.stack.mixins` on the app image be updated to include stack buildpack-provided mixins?
- During a rebase, if the new run image statically includes a mixin that was previously provided by a stack buildpack, should the providing stack buildpack rerun?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

A number of changes to the Platform Specification will be required to execute Stack Buildpacks. Those changes will be defined in a separate RFC.

## Stack buildpacks

Stack buildpacks are identical to other buildpacks, with the following exceptions:

1. The `<layers>` directory WILL NOT be used to create arbitrary layers.
1. The working directory WILL NOT contain application source code during the build phase.
1. The stack buildpack's `bin/build` will execute on the run-image during the extend phase.
1. All changes made to the filesystem during the execution of the stack buildpack's `bin/build` in the extend phase will be snapshotted and stored as a single layer, with the exception of the following directories:

* `/tmp`
* `/cnb`
* `/layers`
* `/workspace`
* `/dev`
* `/sys`
* `/proc`
* `/var/run/secrets`
* `/etc/hostname`, `/etc/hosts`, `/etc/mtab`, `/etc/resolv.conf`
* `/.dockerenv`

## stack-layer.toml (TOML)

```
[[excludes]]
paths = ["<sub-path glob>"]
cache = false
```

Where:

* `paths` = a list of paths to exclude from the app image layer in the extend phase. During the build phase, these paths will be removed from the filesystem before executing any application buildpacks.
* `cache` = if true, the paths will be cached even if they are removed from the filesystem.

1. Paths not referenced by an `[[excludes]]` entry will be included in the app-image layer (default).
1. Any paths with an `[[excludes]]` entry and `cache = true` will be included in the cache image, but not the app image.
1. Any paths with an `[[excludes]]` entry and `cache = false` will not be included in the cache image or the app image.

## buildpack.toml  (TOML)

This proposal adds new keys to the `[buildpack]` table in `buildpack.toml`, and a new `mixins` array:

 ```
[buildpack]
privileged = <boolean (default=false)>

[[stacks]]
id = "<stack id or *>"

[stacks.requires]
mixins = [ "<mixin name>" ]

[stacks.provides]
mixins = [ "<mixin name or *>" ]
 ```

* `privileged` - when set to `true`, the lifecycle will run this buildpack as the `root` user.

Under the `[stacks.provides]` table:

* `mixins` - a list of names that match mixins provided by this buildpack, or the `*` representing all mixins.

## Build Plan (TOML)

```
[[provides]]
name = "<dependency name>"

[[requires]]
name = "<dependency name>"
mixin = "<mixin name>"

[requires.metadata]
# buildpack-specific data; not allowed for mixins

[[or]]

[[or.provides]]
name = "<dependency name>"

[[or.requires]]
name = "<dependency name>"
mixin = "<mixin name>"

[or.requires.metadata]
# buildpack-specific data; not allowed for mixins
```

### Buildpack Plan (TOML)

```
[[entries]]
name = "<dependency name>"
mixin = "<mixin name>"

[entries.metadata]
# buildpack-specific data
```

## Lifecycle Interface

### Usage

#### `detector`
The platform MUST execute `detector` in the **build environment**

Usage:
```
/cnb/lifecycle/detector \
  ...
  [-stack-buildpacks <stack-buildpacks>] \
  [-stack-group <group>] \
  [-stack-order <order>] \
  [-stack-platform <stack-platform>]
```

##### Inputs
| Input                 | Environment Variable        | Default Value           | Description
|-----------------------|-----------------------------|-------------------------|----------------------
| ...                   |                             |                         |
| `<stack-buildpacks>`  | `CNB_STACK_BUILDPACKS_DIR`  | `/cnb/stack/buildpacks` | Path to stack buildpacks directory (see [Buildpacks Directory Layout]
| `<stack-group>`       | `CNB_STACK_GROUP_PATH`      | `./stack-group.toml`    | Path to output group definition(#buildpacks-directory-layout))
| `<stack-order>`.      | `CNB_STACK_ORDER_PATH`.     | `/cnb/stack/order.toml`| Path to order definition (see order.toml)
| `<stack-platform>`   | `CNB_STACK_PLATFORM_DIR`    | `/stack-platform`       | Path to stack-specific platform directory

##### Outputs
| Output             | Description
|--------------------|----------------------------------------------
| `<stack-group>`    | Detected stack buildpack group  (see [`group.toml`](#grouptoml-toml))

#### `builder`
The platform MUST execute `builder` in the **build environment**

If the `<stack-group>` IS provided, the `builder` MUST be run with root privileges. If the the `<stack-group>` IS NOT provided, the `builder` MUST NOT be run with root privileges.

Usage:
```
/cnb/lifecycle/builder \
  ...
  [-stack-buildpacks <stack-buildpacks>] \
  [-stack-group <stack-group>] \
  [-stack-platform <stack-platform>]
```

##### Inputs
| Input                 | Environment Variable        | Default Value           | Description
|-----------------------|-----------------------------|-------------------------|----------------------
| ...                   |                             |                         |
| `<stack-buildpacks>`  | `CNB_STACK_BUILDPACKS_DIR`  | `/cnb/stack/buildpacks` | Path to stack buildpacks directory (see [Buildpacks Directory Layout]
| `<stack-group>`       | `CNB_STACK_GROUP_PATH`      | `./stack-group.toml`    | Path to output group definition(#buildpacks-directory-layout))
| `<stack-platform>`   | `CNB_STACK_PLATFORM_DIR`    | `/stack-platform`       | Path to stack-specific platform directory

##### Outputs
| Output                                     | Description
|--------------------------------------------|----------------------------------------------
| ...                                        |
| `<layers>/<buildpack ID>/stack-cache.tgz`  | Cache snaphot for each stack buildpack
| `<layers>/<buildpack ID>/stack-layer.toml` | Layer snaphot metadata for each stack buildpack

#### `exporter`
Usage:
```
/cnb/lifecycle/exporter \
  [-stack-group <stack-group>] \
  [-stack-layers <stack-layers>] \
  ...
```

##### Inputs
| Input               | Environment Variable        | Default Value             | Description
|---------------------|-----------------------------|---------------------------|---------------------------------------
| ...                 |                             |                           |
| `<stack-group>`     | `CNB_STACK_GROUP_PATH`      | `./stack-group.toml`      | Path to stack-group file (see [`group.toml`](#grouptoml-toml))
| `<stack-layers>`    | `CNB_STACK_LAYERS_DIR`      | `/stack-layers`           | Path to stack layers directory from extend phase



#### `rebaser`
Usage:
```
/cnb/lifecycle/rebaser \
  [-cache-image <cache-image>] \
  [-plan <plan>] \
  ...
```

##### Inputs
| Input               | Environment Variable  | Default Value          | Description
|---------------------|-----------------------|------------------------|---------------------------------------
| ...                 |                       |                        |
| `<cache-image>`     | `CNB_CACHE_IMAGE`     |                        | Reference to a cache image in an OCI image registry
| `<plan>`       | `CNB_PLAN_PATH`       | `./plan.toml`     | Path to resolved build plan (see [`plan.toml`](#plantoml-toml))
| `<stack-platform>`   | `CNB_STACK_PLATFORM_DIR`    | `/stack-platform`       | Path to stack-specific platform directory
| `<stack-group>`     | `CNB_STACK_GROUP_PATH` | `./stack-group.toml`    | Path to group definition(#buildpacks-directory-layout)) of buildpacks that run during the extend phase that created the image being rebased.

#### `extender`
Usage:
```
/cnb/lifecycle/extender \
  [-stack-buildpacks <stack-buildpacks>] \
  [-stack-group <stack-group>] \
  [-layers <layers>] \
  [-log-level <log-level>] \
  [-plan <plan>] \
  [-stack-platform <stack-platform>]
```

##### Inputs
| Input          | Env                   | Default Value     | Description
|----------------|-----------------------|-------------------|----------------------
| `<layers>`     | `CNB_LAYERS_DIR`      | `/layers`         | Path to layers directory
| `<log-level>`  | `CNB_LOG_LEVEL`       | `info`            | Log Level
| `<plan>`       | `CNB_PLAN_PATH`       | `./plan.toml`     | Path to resolved build plan (see [`plan.toml`](#plantoml-toml))
| `<stack-platform>`   | `CNB_STACK_PLATFORM_DIR`    | `/stack-platform`       | Path to stack-specific platform directory
| `<stack-buildpacks>`  | `CNB_STACK_BUILDPACKS_DIR`  | `/cnb/stack/buildpacks` | Path to stack buildpacks directory (see [Buildpacks Directory Layout]
| `<stack-group>`       | `CNB_STACK_GROUP_PATH`      | `./stack-group.toml`    | Path to output group definition(#buildpacks-directory-layout))

##### Outputs
| Output                                     | Description
|--------------------------------------------|----------------------------------------------
| [exit status]                              | (see Exit Code table below for values)
| `/dev/stdout`                              | Logs (info)
| `/dev/stderr`                              | Logs (warnings, errors)
| `<layers>/<buildpack ID>/stack-cache.tgz`  | Cache snaphot for each stack buildpack
| `<layers>/<buildpack ID>/stack-layer.tgz`  | Layer snapshot (see [Buildpack Interface Specfication](buildpack.md)
| `<layers>/<buildpack ID>/stack-layer.toml` | Layer snaphot metadata for each stack buildpack
| `<layers>/config/metadata.toml`            | Build metadata (see [`metadata.toml`](#metadatatoml-toml))

| Exit Code | Result|
|-----------|-------|
| `0`       | Success
| `11`      | Platform API incompatibility error
| `12`      | Buildpack API incompatibility error
| `1-10`, `13-99` | Generic lifecycle errors
| `801`     | Buildpack build error
| `800`, `802-899`|  Build-specific lifecycle errors

- The lifecycle SHALL execute all stack buildpacks in the order defined in `<stack-group>` according to the process outlined in the [Buildpack Interface Specification](buildpack.md).
- The lifecycle SHALL add all invoked stack buildpacks to`<layers>/config/metadata.toml`.
- The lifecycle SHALL aggregate all BOM entries returned by buildpacks in `<layers>/config/metadata.toml`.
