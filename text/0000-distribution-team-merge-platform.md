# Meta
[meta]: #meta
- Name: Merge Distribution Team with Platform Team
- Start Date: 2022-12-01
- Author(s): [@jkutner](https://github.com/jkutner)
- Status: Draft
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: [RFC-0062](https://github.com/buildpacks/rfcs/blob/main/text/0062-distribution-team.md)

# Summary
[summary]: #summary

This is a proposal to consolidate two existing teams, Distribution and Platform, into a single team.

# Definitions
[definitions]: #definitions

* Platform - pack and any other platforms or platform components maintained by the [Platform Team](https://github.com/buildpacks/community/blob/main/TEAMS.md#platform-team)
* Distribution - tools and services that support the distribution, discovery, and integration of buildpacks. Owned by the [Distribution Team](https://github.com/buildpacks/community/blob/main/TEAMS.md#distribution-team)

# Motivation
[motivation]: #motivation

The distribution team only has one maintainer, which is not sustainable and present a redunancy risk. However, the distribution team's workload is fairly small, consisting mostly of security patches and simple releases. At the same time, the Platform team has lost key resources including a maintainer and team lead. The components owned by the Distribution team align well with the Platform team's mission. For these reasons, we aim to consolidate leadership energy by merging these teams.

# What it is
[what-it-is]: #what-it-is

The active maintainers and contributors of the Distribution Team will move into the Platform team with the same role. The components owned by the Distribution Team will henceforth be owned by the Platform Team. A single Team Lead will continue to represent Platform Team.

The Distribution Team will be removed from the CNB [Governance model](https://github.com/buildpacks/community/blob/main/GOVERNANCE.md).

# How it Works
[how-it-works]: #how-it-works

The Platform Team will have the following members:

* Team Lead: Terence Lee
* Maintainers: Terence Lee, Joe Kutner, David Freilich
* Contributors: All active contributors from both existing teams

The Platform Team will own the following components:
* [pack](https://github.com/buildpacks/pack)
* [Tekton Tasks + Pipelines](https://github.com/buildpacks/tekton-integration)
* [CircleCI Pack Orb](https://github.com/buildpacks/pack-orb)
* [Buildpack Registry API](https://github.com/buildpacks/registry-api)
* [Buildpack Registry Index](https://github.com/buildpacks/registry-index)
* [Buildpack Registry Namespace Owners](https://github.com/buildpacks/registry-namespaces)
* [Github Actions](https://github.com/buildpacks/github-actions)

# Migration
[migration]: #migration

N/A

# Drawbacks
[drawbacks]: #drawbacks

* This increases the surface of the Platform Team, which already suffered from attrition. It is also one the team that owns one of the most critical CNB components: pack. This could put additional strain on its members.

# Alternatives
[alternatives]: #alternatives

* Do nothing - keep the same team structure. Both the Platform team and Distribution team would lack redundancy
* Disolve the Distribution Team - sunset the components it owns and find alternatives to Buildpack Registry and github-actions

# Prior Art
[prior-art]: #prior-art

* [Create a Distribution Team](https://github.com/buildpacks/rfcs/blob/main/text/0062-distribution-team.md)
* [Announcing OpenTelemetry: the merger of OpenCensus and OpenTracing](https://cloudblogs.microsoft.com/opensource/2019/05/23/announcing-opentelemetry-cncf-merged-opencensus-opentracing/)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

TBD

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

N/A

# History
[history]: #history

<!--
## Amended
### Meta
[meta-1]: #meta-1
- Name: (fill in the amendment name: Variable Rename)
- Start Date: (fill in today's date: YYYY-MM-DD)
- Author(s): (Github usernames)
- Amendment Pull Request: (leave blank)

### Summary

A brief description of the changes.

### Motivation

Why was this amendment necessary?
--->