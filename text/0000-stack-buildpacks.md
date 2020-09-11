# Meta
[meta]: #meta
- Name: Stack Buildpacks
- Start Date: 2020-08-27
- Author(s): [@jkutner](@jkutner)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This is proposal for a new type of buildpack that runs against a stack in order to extend it in ways that are only possible by running privileged commands.

# Motivation
[motivation]: #motivation

Normally, buildpacks do not run as root. This is an intentional design decision that ensures operations like `rebase` will work on day-2.

However, many applications and buildpacks require modifications to the stack they run on, such as adding system packages or custom certificates. For this reason, we need a mechanism that buildpack authors and buildpack users and leverage to extend their stacks.

# What it is
[what-it-is]: #what-it-is

- *root buildpack* - a new type of buildpack that runs as the root user
- *stack buildpack* - a type of root buildpack that runs against the stack image(s) instead of an app. Stack buildpacks must not make changes to the build and run images that either violate stack [compatibility guarantees](https://github.com/buildpacks/spec/blob/main/platform.md#compatibility-guarantees) or violate the contract defined by that stack's author.
- *userspace buildpack* - the traditional definition of a buildpack (i.e. does not run as root, and runs against an app)

A new type of buildpack, called a Stack buildpack, may run against a stack (both build and run images) in order to extend it in ways that are only possible by running privileged commands. A stackpack may also define a list of mixins that it provides to the stack, or indicate that it will provide _any_ mixin. In this way, a stack that is missing a mixin required by a buildpack may have that mixin provided by a stack buildpack.

A stack provider may choose to include stack buildpacks with the stack they distribute. If a stack includes any stack buildpacks, the following will occur when the build phase starts:

1. If any requested mixin is not provided by the stack, the lifecycle will compare the missing mixins to the static list of mixins provided by stack buildpacks. If any mixins are still not provided, the build will fail.
1. The lifecycle will run the detect phase for all stackpacks defined in the builder.
1. The lifecycle will execute the stack buildpack build phase for all passing stackpack(s). If no stack buildpacks pass detect, the build will continue the build phase as normal (running userspace buildpacks).
1. After, during, or before the lifecycle's build phase, the lifecycle will begin a new phase called _extend_.
1. During the extend phase, stack buildpacks that passed detection will run against the run images accordingly (see details below).


# How it Works
[how-it-works]: #how-it-works

 A stack buildpack (a.k.a. stackpack) is a special case of buildpack that has the following properties:

* Is run as the `root` user
* Configured with `privileged = true` in the `buildpack.toml`
* Can only create one layer
* Does not have access to the application source code
* Is run before all regular buildpacks
* Is run against both the build and run images
* Is distributed with the stack run and/or build image
* May not create layers using the `<layers>` directory

The stackpack interface is identical to the buildpack interface (i.e. the same `bin/detect` and `bin/build` scripts are required). However, some of the context it is run in is different from regular buildpacks.

For each stackpack, the lifecycle will use [snapshotting](https://github.com/GoogleContainerTools/kaniko/blob/master/docs/designdoc.md#snapshotting-snapshotting) to capture changes made during the stackpack's build phase excluding the a few specific directories and files.

Additionally, a platform may store a new stack image to cache the changes. All of the captured changes will be included in a single layer produced as output from the stackpack. The `/layers` dir MAY NOT be used to create arbitrary layers.

A stack can provide stackpacks by including them in the `/cnb/stack/buildpacks` directory. By default, an implicit order will be created for all stackpacks included in a stack. The order can be overridden in the `builder.toml` with the following configuration:

```
[[stack.order]]
  [[stack.order.group]]
    id = "<stackpack id>"
```

A stackpack will only execute if it passes detection. When the stackpack is executed, its detect and build scripts use the same parameters as the regular buildpacks. But the arguments may differ. For example, the first positional argument to the `bin/build` (the `<layers>` directory) MUST NOT be a standard layers directory adhering to the [Buildpacks Build specification](https://github.com/buildpacks/spec/blob/main/buildpack.md#build).

The stackpack's snapshot layer may be modified by writing a `stack.toml` file. The `stack.toml` will define paths that will be restored even when the base image changes (ex. package indicies) and paths that will be excluded from the launch image (ex. `/var/cache`).

## Providing Mixins

A stack buildpack MAY define a set of mixins it provides in either of two ways:

1. Statically in the `buildpack.toml`
1. Dynamically in the Build Plan.

A stack buildpack MAY define a set of stack specific mixins in the `buildpack.toml` with the following schema:

```toml
[[buildpack.provides.stacks]]
id = "<stack id or *>"
any = <boolean (default=false)>
mixins = [ "mixin name" ]
```

Additionally, mixins MAY be dyncamically provided in the build plan:

```
[[provides]]
name = "<mixin name>"
mixin = <boolean (default=false, requires privileged=true in buildpack.toml if true)>
```

A userspace buildpack MAY require mixins in the build plan

```
[[requires]]
name = "<mixin name>"
mixin = <boolean (default=false)>
```

A userspace buildpack MAY NOT provide mixins in the build plan.

## Rebasing an App

Before a launch image is rebased, the platform must re-run the any stackpacks that were used to build the launch image against the new run-image. Then, the rebase operation can be performed as normal, while including the stackpack layers as part of the stack. This will be made possible by including the stackpack in the run-image, but because the stackpack detect phase is not run, the operation does not need access to the application source.

## Example: Apt Buildpack

(**note**: this is only an example. A real Apt Buildpack would probably be more robust).

A buildpack that can install an arbitrary list of mixins would have a `buildpack.toml` like this:

 ```toml
[buildpack]
id = "example/apt"
privileged = true

[buildpack.mixins]
any = true

[[stacks]]
id = "io.buildpacks.stacks.bionic"
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

for package in $(cat $3 | yj -t | jq -r ".entries | .[] | .name"); do
  apt install $package
done

cat << EOF > launch.toml
[[excludes]]
paths = [ "/var/cache" ]
cache = true
EOF
```

## Example: CA Certificate Buildpack

Support for custom CA Certificates can be accomplished with two buildpacks: a stackpack that can install the cert, and a normal buildpack that can provide a cert in the build plan.

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

### CA Cert Provider Buildpack

The stackpack must be used with a buildpack that provides a certificate(s) for it to install. That buildpack would have the following `buildpack.toml`:

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

A buildpack may that requires the `jq` package may have it provided by either a stack, stack buildpack, or userspace buildpack.

```toml
[[or.requires]]
name = "jq"
mixin = true

[[or.requires]]
name = "jq"
```

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

- The term "non-idempotent" is used in section 9.1.2 of [Hypertext Transfer Protocol -- HTTP/1.1 (RFC 2616)](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Do we want (or need) a `CNB_STACK_TYPE` env var so that a stack buildpack can behave differently on each part of the stack?
- Should the stackpack's detect have read-only access to the app?
    - This would likely be driven by a stackpack that does not provide mixins, but instead dynamically contributes to the build plan based on the contents of the app source code. I don't know if we have a use case for this, but I can imaging a buildpack that reads environment variables as input to some function.
- Should stackpacks be able to define per-stack mixins?
    - We could support a top-level `mixins` array, and allow refinements under `[[stacks]] mixins`. If we do this, we need to distinguish between provided and required mixins (at least under `[[stacks]]`).
    - If userspace buildpacks can require mixins from `bin/detect`, the stackpack could use this mechanism to require per-stack mixins.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

A number of changes to the Platform Specification will be required to execute Stack Buildpacks. Those changes will be defined in a separate RFC.

## Stack buildpacks

Stack buildpacks are identical to other buildpacks, with the following exceptions:

1. The `<layers>` directory WILL NOT be used to create layers.
1. The working directory WILL NOT contain application source code during the build phase.
1. All changes made to the filesystem during the execution of the stackpack's `bin/build` will be snapshotted and stored as a single layer, with the exception of the following directories:

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

## launch.toml (TOML)

```
[[excludes]]
paths = ["<sub-path glob>"]
cache = false
```

Where:

* `paths` = a list of paths to exclude from the layer
* `cache` = if true, the paths will be excluded from the launch image layer, but will be included in the cache layer.

## buildpack.toml  (TOML)

 This proposal adds new keys to the `[buildpack]` table in `buildpack.toml`, and a new `[[mixins]]` array of tables:

 ```
[buildpack]
privileged = <boolean (default=false)>
non-idempotent = <boolean (default=false)>

[[buildpack.provides.stacks]]
id = "<stack id>"
any = <boolean (default=false)>
mixins = [ "<mixin name>" ]
 ```

* `privileged` - when set to `true`, the lifecycle will run this buildpack as the `root` user.
* `non-idempotent` - when set to `true`, indicates that the buildpack is not idempotent. The lifecycle will provide a clean filesystem from the stack image(s) before each run (i.e. no cache).

Under the `[buildpack.mixins]` table:

* `any` - a boolean that, when true, indicates that the buildpack can provide all mixins
* `names` - a list of names that match mixins provided by this buildpack

## Build Plan (TOML)

```
[[provides]]
name = "<dependency name>"
mixin = <boolean (default=false)>

[[requires]]
name = "<dependency name>"
mixin = <boolean (default=false)>

[requires.metadata]
# buildpack-specific data

[[or]]

[[or.provides]]
name = "<dependency name>"
mixin = <boolean (default=false)>

[[or.requires]]
name = "<dependency name>"
mixin = <boolean (default=false)>

[or.requires.metadata]
# buildpack-specific data
```
