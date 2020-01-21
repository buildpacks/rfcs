# Meta
[meta]: #meta
- Name: Lifecycle All Binary
- Start Date: 2020-01-21
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

### `/cnb/lifecycle/all`
A new lifecycle binary shall be found at the path `/cnb/lifecycle/all` within a lifecycle archive or builder image. When invoked will run the following phases sequentially:

* detector
* analyzer
* restorer
* builder
* exporter

### `/cnb/lifecycle/*` are still available
Each of these phases will continue to be available individually as provided by the current lifecycle.
`launcher` will remain a separate binary

### Platform API 0.3
The existance of `all` will constitute a non-breaking but substantive change to the Platform API bring the subsequent lifecycle release to Platform API 0.3. Given that we do not have a mechanism for indicating breaking and nonbreaking platform API change pre 1.0, 

# Motivation
[motivation]: #motivation

This new binary supports two main goals.

### Goal 1: faster `pack`
By creating a single container and invoking `/cnb/lifecycle/all` instead of creating a container per lifecycle phase, pack can shave approximate `6s` from the execution time of `pack build`.

`pack` may not always want to do this (see https://github.com/buildpacks/rfcs/pull/43 for an explanation of why this is not always ideal). However, it could be very beneficial to users that are wiling to trust their builder images.

### Goal 2: Easier integration of the lifecycle into other platforms and CI tools
As members of the community experiment with incorporating CNBs into other platform and CI tools, the difficulty of invoking each lifecycle phase correctly and sequentially draws many to the easier solution of using `pack` to orchestrate the lifecycle. While `pack` can provide a simple way for these developers to implement these integrations, there may be performance drawbacks when compared with using the lifecycle directly. `/cnb/lifecycle/all` will provide an easier interface, lowering the barrier to using the lifecycle without pack, thus enabling platform developers choose between `pack` and `lifecycle` based solely upon the needs of their integration.

# What it is
[what-it-is]: #what-it-is

### Usage
USAGE:

`/cnb/lifecycle/all <image-name>`

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
| `-stack`        | optional | `CNB_STACK_PATH`       | -                         | path to stack.toml |
| `-launch-cache` | optional | `CNB_LAUNCH_CACHE_DIR` | -                         | path to launch cache directory |
| `-launcher`     | optional | `CNB_LAUNCHER_PATH`    | `/cnb/lifecycle/launcher` | path to launcher binary |
| `-buildpacks`   | optional | `CNB_BUILDPACKS_DIR`   | `/cnb/buildpacks`         | path to buildpacks directory |
| `-daemon`       | optional | `CNB_USE_DAEMON`       | false                     | export to docker daemon |
| `-uid`          | optional | `CNB_USER_ID`          | -                         | UID of user in the stack's build and run images |
| `-gid`          | optional | `CNB_GROUP_ID`         | -                         | GID of user's group in the stack's build and run images |
| `-version`      | optional | -                      | false                     | show version |
| `-skip-restore` | optional | -                      | false                     | do not restore metadata from previous image or data from cache

Most of the these flags are existing lifecycle phase flags. `-skip-restore` is a a new addition that modifies the behavior of `analyzer` similarly to the existing `-skip-layers` flag, and skips the `restorer` phase all together.


Some existing lifecycle flags (e.g. `-group` on the `detector` `builder` and `exporter` phases) can are not necessary. They refer to files that were previously used to pass information between lifecycle phase processes. When the phases run in the same process, those values can be passed in memory.

 ### Credential Management

// TODO

# Drawbacks
[drawbacks]: #drawbacks

// TODO

# Alternatives
[alternatives]: #alternatives

// TODO

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?
- What parts of the design do you expect to be resolved through implementation of the feature?
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?
