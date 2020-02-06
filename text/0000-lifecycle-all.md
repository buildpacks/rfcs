# Meta
[meta]: #meta
- Name: Lifecycle All Binary
- Start Date: 2020-01-21
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

### `/cnb/lifecycle/creator`
A new lifecycle binary with the name `lifecycle/creator` will be included in each released lifecycle archive. Within a builder image, it will be found at the path `/cnb/lifecycle/creator`. When invoked, it will run the following phases sequentially:

* detector
* analyzer
* restorer
* builder
* exporter

Each of these phases will continue to be available individually as provided by the current lifecycle.

### Platform API 0.3
The existence of `creator` will constitute a non-breaking but substantive change to the Platform API, bringing us to Platform API 0.3 . Although platform will interpret this as a breaking change, we do not have a mechanism for indicating non-breaking platform API change pre 1.0. Bumping the platform API number is necessary so that platforms like `pack` know whether or no they can use this feature.

# Motivation
[motivation]: #motivation

This new binary supports two main goals.

### Goal 1: faster `pack` builds
By creating a single container and invoking `/cnb/lifecycle/creator` instead of creating a container per lifecycle phase, pack can shave approximate `6s` from the execution time of `pack build`.

`pack` may not always want to do this (see https://github.com/buildpacks/rfcs/pull/43 for an explanation of why this is not always ideal). However, it could be very beneficial to users that are wiling to trust their builder images.

### Goal 2: Easier integration of the lifecycle into other platforms and CI tools
As members of the community experiment with incorporating CNBs into other platform and CI tools, the difficulty of invoking each lifecycle phase correctly and sequentially draws many to the easier solution of using `pack` to orchestrate the lifecycle. While `pack` can provide a simple way for these developers to implement these integrations, there may be performance drawbacks when compared with using the lifecycle directly. `/cnb/lifecycle/creator` will provide an easier interface, lowering the barrier to using the lifecycle without pack, thus enabling platform developers choose between `pack` and `lifecycle` based solely upon the needs of their integration.

# What it is
[what-it-is]: #what-it-is

### Usage

`/cnb/lifecycle/creator <image-name>`

The following flags optional flags can customize behavior:

| Flag            | Required | Env var                | Default                   | Description |
| --------------- | -------- | ---------------------- | ------------------------- | ------------|
| `-layers`       | optional | `CNB_LAYERS_DIR`       | `/layers`                 | path to layers |
| `-platform`     | optional | `CNB_PLATFORM_DIR`     | `/platform`               | path to platform directory |
| `-run-image`    | optional | `CNB_RUN_IMAGE`        | -                         | reference to run image |
| `-app`          | optional | `CNB_APP_DIR`          | `/workspace`              | path to app directory |
| `-cache-dir`    | optional | `CNB_CACHE_DIR`        | -                         | path to cache directory |
| `-cache-image`  | optional | `CNB_CACHE_IMAGE`      | -                         | cache image tag reference |
| `-order`        | optional | `CNB_ORDER_PATH`       | `/cnb/order.toml`         | path to order.toml |
| `-stack`        | optional | `CNB_STACK_PATH`       | `/cnb/stack.toml`         | path to stack.toml |
| `-launch-cache` | optional | `CNB_LAUNCH_CACHE_DIR` | -                         | path to launch cache directory |
| `-launcher`     | optional | `CNB_LAUNCHER_PATH`    | `/cnb/lifecycle/launcher` | path to launcher binary |
| `-buildpacks`   | optional | `CNB_BUILDPACKS_DIR`   | `/cnb/buildpacks`         | path to buildpacks directory |
| `-daemon`       | optional | `CNB_USE_DAEMON`       | false                     | export to docker daemon |
| `-uid`          | required | `CNB_USER_ID`          | -                         | UID of user in the stack's build and run images |
| `-gid`          | required | `CNB_GROUP_ID`         | -                         | GID of user's group in the stack's build and run images |
| `-version`      | optional | -                      | false                     | show version |
| `-skip-restore` | optional | -                      | false                     | do not restore metadata from previous image or data from cache
| `-tag` (multiples allowed) | optional | -           |                           | additional tags to apply to exported image
| `-previous-image`| optional | -                     | `<image-name>`              | image to analyze and reuse layers from

Most of the these flags are existing lifecycle phase flags. `-skip-restore` is a a new addition that modifies the behavior of `analyzer` similarly to the existing `-skip-layers` flag, and, in addition, skips the `restorer` phase all together.

This RFC proposes a `-tag` flag as the interface to provide additional tags, rather than multiple positional arguments (as is currently accepted by `exporter` ) for clarity and it's similarity to `docker build`.

Some existing lifecycle flags (e.g. `-group` on the `detector` `builder` and `exporter` phases) are not necessary. They refer to files that were previously used to pass information between lifecycle phase processes. When the phases run in the same process, those values can be passed in memory.


### User

Right now, when `pack` runs w/o the `--publish` flag `analyzer` and `exporter` are run as root. This is required so that these phases can connect to the mounted docker daemon socket. Historically the `builder` and `detector` binaries are never run as root.

In the daemon case pack will run `creator` as `root` but the buildpacks' `/bin/detect` and `/bin/builder` scripts will be invoked as the provided user. This will require a change to build and detect implementations.

### Credential Management

Right now, when `pack` runs w/ the `--publish` flag `analyzer` and `exporter` are provided with registry credentials via the `CNB_REGISTRY_AUTH` environment variable.

In the registry case pack will set `CNB_REGISTRY_AUTH` when invoking `creator`. To prevents buildpacks from having read access to those credentials the build and detect implementations will ensure this variable is not present in the environment of the `/bin/detect` and `/bin/build` processes.

# Drawbacks
[drawbacks]: #drawbacks

Making it easy to run all of the lifecycle in a single container will encourage folks to do so. However, this requires consumers to be more thoughtful about security and credential isolation. We will need to harden `builder` and `detector` implementation to ensure buildpacks are not given root access or registry credentials.

If we choose to implement [rfcs#43](https://github.com/buildpacks/rfcs/pull/43) `pack` will only accrue performance improvements from this change when a builder is explicitly trusted. In the untrusted case pack must continue executing each phase in a separate container.

# Alternatives
[alternatives]: #alternatives

Require platforms/integrations to invoke all lifecycle phases in order in all situations, even when running in a single container.

# Prior Art
[prior-art]: #prior-art

Most in container build tools do not spin up multiple containers.

Regarding the introduction of the `-tag` flag, `docker build -t` is prior art.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions
