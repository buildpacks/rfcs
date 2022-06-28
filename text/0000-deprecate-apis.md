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

Today, the CNB project defines XXX buildpack APIs and XXX platform APIs. The CNB lifecycle, for backwards compatibility
and in order to enable buildpacks and platforms to upgrade their respective APIs independently, currently supports all
XXX APIs and all XXX combinations of buildpack and platform APIs. This is a maintenance burden.

Additionally, as we've talked about adding new features to the project, it has become difficult to determine how these
additions might be compatible with older APIs. This has slowed down progress within the project.

This RFC proposes:

* Marking as deprecated the following APIs:
    * buildpack APIs XXX and older
    * platform APIs XXX and older
* A general policy of:
    * Removing support for deprecated APIs 6 months after those APIs are marked as deprecated

# Definitions

[definitions]: #definitions

Buildpack API: XXX

Platform API: XXX

lifecycle: XXX

# Motivation

[motivation]: #motivation

- Why should we do this? Lower maintenance burden, enable faster development of new APIs.
- What use cases does it support? As a lifecycle maintainer, I only want to support the latest buildpack and platform
  APIs. As a CNB contributor, when thinking about new features, I want a smaller set of supported APIs to care about.
- What is the expected outcome? Hopefully, not too much inconvenience for buildpack authors and platform operators,
  because:
    - Hopefully they are already on newer versions of the APIs, but if not...
    - We will have socialized this change appropriately (e.g., in Slack, through the mailing list, GitHub, etc.)
    - The `CNB_DEPRECATION_MODE` setting will have alerted them that upgrading is necessary
    - We will have published migration guides to help them upgrade
    - 6 months is a reasonable amount of time to complete this process

# What it is

[what-it-is]: #what-it-is

APIs will be marked as deprecated here:

```
XXX
```

As described in XXX:

* If `CNB_DEPRECATION_MODE` is set, XXX.
* If `CNB_DEPRECATION_MODE` is unset, XXX.

After 6 months, the values will be:

```
XXX
```

* If a buildpack tries to use an unsupported API, the lifecycle will fail with the following message: XXX.
* If a platform tries to use an unsupported API, the lifecycle will fail with the following message: XXX.

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

End-users will need to update their usage of the newer images if they were formerly using a platform API < 0.XXX (see
XXX).

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

golang support schedule: XXX

RFC that was put "on pause" due to difficulties managing API complexities: XXX

# Spec. Changes (OPTIONAL)

[spec-changes]: #spec-changes
Does this RFC entail any proposed changes to the core specifications or extensions? If so, please document changes here.

We should clearly mark the deprecated specs as deprecated on their respective branches. 
