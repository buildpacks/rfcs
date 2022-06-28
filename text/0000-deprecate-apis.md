# Meta

[meta]: #meta

- Name: Deprecate old buildpack and platform APIs
- Start Date: 2022-06-28
- Author(s): natalieparellano
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary

[summary]: #summary

Today, the CNB project defines 7 buildpack APIs and 7 platform APIs. The CNB lifecycle, for backwards compatibility and
in order to enable buildpacks and platforms to upgrade their respective APIs independently, currently supports all 14
APIs and all 49 combinations of buildpack and platform APIs. This is a maintenance burden.

Additionally, as we've talked about adding new features to the project, it has become difficult to determine how these
additions might be compatible with older APIs. This has slowed down progress within the project.

As we progress toward 1.0, it seems prudent to start deprecating APIs from which we have made breaking changes.

This RFC proposes:

* Marking as deprecated the following APIs:
    * buildpack APIs 0.6 and older
    * platform APIs 0.6 and older
* A general policy of:
    * Removing support for deprecated APIs 6 months after those APIs are marked as deprecated

# Definitions

[definitions]: #definitions

**lifecycle**: software that orchestrates a CNB build; it executes in a series of phases that each have a distinct
responsibility

The CNB project distributes the lifecycle in two ways:

* As a **lifecycle image**: a minimal [image](https://hub.docker.com/r/buildpacksio/lifecycle) containing the lifecycle
  binaries
* As a **lifecycle tarball**: a [`.tgz` file](https://github.com/buildpacks/lifecycle/releases) containing the lifecycle
  binaries

The [**lifecycle
descriptor**](https://github.com/buildpacks/rfcs/blob/main/text/0049-multi-api-lifecycle-descriptor.md#lifecycle-descriptor)
is data describing the lifecycle and the APIs that it supports. It is contained in the `io.buildpacks.lifecycle.apis`
and `io.buildpacks.lifecycle.version` labels on lifecycle images, and the `lifecycle.toml` file in lifecycle tarballs.

**platform**: system or software that orchestrates the lifecycle by invoking each lifecycle phase in order

**Buildpack API**: specifies the interface between a lifecycle program and one or more buildpacks

**Platform API**: specifies the interface between a lifecycle program and a platform

# Motivation

[motivation]: #motivation

- Why should we do this? Lower maintenance burden, enable faster development of new APIs.
    - We should draw the boundary at the 0.6 APIs because:
        - They are both over a year old (March 2021)
        - For buildpacks, the 0.6 API is the last API with unstandardized SBOMs.
        - For platforms, the 0.6 API is the last API where `detect` happens before `analyze`.

- What use cases does it support? As a lifecycle maintainer, I only want to support the latest buildpack and platform
  APIs. As a CNB contributor, when thinking about new features, I want a smaller set of supported APIs to care about.

- What is the expected outcome? Hopefully, not too much inconvenience for buildpack authors and platform operators,
  because:
    - Hopefully they are already on newer versions of the APIs (
      our [user survey](https://docs.google.com/presentation/d/10CBBld2VV0iCfrYPMbFI4--kh9UZ9mJVXhE1p1Cjqls/edit#slide=id.p)
      supports this), but if not...
    - We will have socialized this change appropriately (e.g., in Slack, through the mailing list, GitHub, etc.)
    - The `CNB_DEPRECATION_MODE` setting will have alerted them that upgrading is necessary
    - We will have published migration guides to help them upgrade
    - 6 months is a reasonable amount of time to complete this process

# What it is

[what-it-is]: #what-it-is

`io.buildpacks.lifecycle.apis` would contain the following:

```
{
  "buildpack": {
    "deprecated": [ "0.2", "0.3", "0.4", "0.5", "0.6" ],
    "supported": [ "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8" ]
  },
  "platform": {
    "deprecated": [ "0.3", "0.4", "0.5", "0.6" ],
    "supported": [ "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9" ]
  }
}
```

As described
in [RFC 0049](https://github.com/buildpacks/rfcs/blob/main/text/0049-multi-api-lifecycle-descriptor.md#lifecycle-descriptor)
, if a buildpack or platform tries to use a deprecated API:

* If `CNB_DEPRECATION_MODE` is unset, the lifecycle will print a warning and continue
* If `CNB_DEPRECATION_MODE`=`warn`, the lifecycle will print a warning and continue
* If `CNB_DEPRECATION_MODE`=`error`, the lifecycle will fail
* If `CNB_DEPRECATION_MODE`=`silent`, the lifecycle will continue w/o warning

After 6 months, the deprecated APIs would become unsupported and `io.buildpacks.lifecycle.apis` would contain the
following:

```
{
  "buildpack": {
    "deprecated": [ ],
    "supported": [ "0.7", "0.8", "<could be newer apis here>" ]
  },
  "platform": {
    "deprecated": [ ],
    "supported": [ "0.7", "0.8", "0.9", "<could be newer apis here>" ]
  }
}
```

* If a buildpack tries to use an unsupported API, the lifecycle will fail with a message such
  as: `buildpack API version '0.6' is incompatible with the lifecycle`.
* If a platform tries to use an unsupported API, the lifecycle will fail with a message such
  as: `platform API version '0.6' is incompatible with the lifecycle`.

# Migration

[migration]: #migration

### Buildpack API

Buildpack authors will need to update buildpacks using the old APIs to a newer API. These buildpacks will need to be
re-published and re-discovered.

Platform authors / builder authors will need to re-create builders using the newer buildpacks.

End-users will need to consumer the newer buildpacks and / or builders.

### Platform API

Platform authors will need to update their platform implementations to use the newer platform API. The appropriate value
of `CNB_PLATFORM_API` must be set in the lifecycle's execution environment.

End-users will need to update their usage of the newer images if they were formerly using a platform
API < [0.4](https://github.com/buildpacks/spec/releases/tag/platform%2Fv0.4) (see
[RFC 0045](https://github.com/buildpacks/rfcs/blob/main/text/0045-launcher-arguments.md)).

# Drawbacks

[drawbacks]: #drawbacks

Why should we *not* do this?

* This will inevitably cause extra work for a fraction of buildpacks users.

# Alternatives

[alternatives]: #alternatives

- What other designs have been considered? Doing nothing.
- Why is this proposal the best? If we want to make progress toward a 1.0 version of the spec, we need to start dropping
  older APIs.
- What is the impact of not doing this? Slower progress in the project due to the maintenance burden and difficulty
  conceptualizing compatibility concerns for so many APIs.

# Prior Art

[prior-art]: #prior-art

* [Ubuntu release cycle](https://ubuntu.com/about/release-cycle)
* [Golang release policy](https://go.dev/doc/devel/release#policy)
* [Docker Community Edition release cadence](https://www.serverwatch.com/server-news/docker-18-06-ce-debuts-alongside-new-release-cadence/)
* [Kubernetes support window](https://kubernetes.io/blog/2020/08/31/kubernetes-1-19-feature-one-year-support/)
* CNB RFC that was put "on pause" due to difficulties managing API
  complexities: https://github.com/buildpacks/rfcs/pull/145

# Spec. Changes (OPTIONAL)

[spec-changes]: #spec-changes
Does this RFC entail any proposed changes to the core specifications or extensions? If so, please document changes here.

We should clearly mark the deprecated specs as deprecated on their respective branches. 
