# Meta
[meta]: #meta
- Name: Lifecycle Descriptor
- Start Date: 08/05/2019
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

The CNB specification defines platform/lifecycle  and lifecycle/buildpack contracts. When we inevitable introduce a breaking change to either contract, we will need a way to indicate to tools like `pack` which version of each contract a given lifecycle implements. I propose adding a `lifecycle.toml` file to all lifecycles specifying these api versions. Eventually this file could also be used to provide additional metadata or indicate the availability of non-breaking additive features.

# Motivation
[motivation]: #motivation

We should do this so `pack` and other platforms can gracefully handle breaking changes in the platform/lifecycle and lifecycle/buildpack APIs. This file also provides a natural extension point for a lifecycle to provide useful metadata to users/platforms or advertise non-breaking features.

`pack` currently uses the lifecycle version to make inferences about the platform/lifecycle and lifecycle/buildpack API versions. However, this has drawbacks. We want `pack` to work with newer lifecycles when there are no breaking changes. By explicitly noting breaking changes in the lifecycle/platform contract we can make `pack` helpfully fail when it encounters an `api` version it isn't familiar with, but continue to work successfully w/ new lifecycles that don't introduce breaking changes.

# What it is
[what-it-is]: #what-it-is

Lifecycle can include a `lifecycle.toml` at it's root. Initially, the only supported fields will be the `api.platform`, `api.buildpack` and `lifecycle.version`.

```toml
[api]
 platform = "<major>.<minor>"
 buildpack = "<major>.<minor>"

[lifecycle]
  version = "<major>.<minor>.<patch>"
```

The format of a api version would be <major>.<minor> or <major> (with a minor of 0 implied). A change to the major version of an API would indicate a non-backwards-compatible change, while a change to the minor version would indicate availability of one or more opt-in features.

When `lifeycle.toml` exists but either of the `api.x` fields is omitted, `pack` will be assume that the lifecycle implements the latest API known to that version of `pack`. When `lifecycle.toml` is omitted, `pack` will initially warn users and assume the lifecycle implements the oldest known api version, for backwards compatibility. Eventually `pack` may require the presence of `lifecycle.toml`.

# How it Works
[how-it-works]: #how-it-works

When `pack create-builder` creates a builder. The lifecycle API versions will be added to the `io.buildpacks.builder.metadata` label.

Example:
```json
{
...
"lifecycle": {"version":  "0.4.0", "api": {"platform":  "1.0", "buildpack":  "1.1"}}
}
```

`pack` would ensure that the `api.buildpack` version matches the `api` version provided by all of the buildpacks that are added to the given builder.

When `pack build` executes, it will check `api.platform` and it will either execute the correct commands for the given platform API, or fail if the platform API version is not supported. For example, if in the future we combine restorer/analyzer and cacher/exporter, then the platform API version of the next lifecycle release would be incremented. This will allow `pack` to know which binaries to execute with which flags.

When `pack build` is run with the `--buildpack` flag, `pack` may use the buildpack api version from the builder metadata to determine whether the buildpack supplied with the `--buildpack` flag is compatible with the builder's lifecycle.

If `lifecycle.toml` specifies a lifecycle version and `builder.toml` also provides a lifecycle version, `pack` will ensure the versions match. If `builder.toml` does not specify a lifecycle version but `lifecycle.toml` does, the version from `lifecycle.toml` will be used.

# Drawbacks
[drawbacks]: #drawbacks

The concept of API version is a new number that could possibly confuse users. It doesn't map cleanly to an existing concept like spec version. We could document `api` version in the spec to mitigate this concern, but it still has the potential to introduce confusion by increasing the number of versions in the ecosystem.

# Alternatives
[alternatives]: #alternatives

- We can continue to use lifecycle version as a standin for lifecycle/platform and lifecycle/buildpack API versions (we can encode `pack` with knowledge of the behavior of specific lifecycle versions). However this will not allow us to decide whether it is safe to run specific commands or execute specific buildpacks when a lifecycle is newer than a given `pack` version.
- Instead of introducing new version numbers we can use spec versions to represent the same concepts
