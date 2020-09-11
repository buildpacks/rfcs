# Meta
[meta]: #meta
- Name: Create Repo Issues
- Start Date: 2020-08-06
- Author(s): @dfreilich
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: [#04](https://github.com/buildpacks/rfcs/blob/main/text/0004-rfc-process.md) (which was [rfc#7](https://github.com/buildpacks/rfcs/pull/7))

# Summary
[summary]: #summary
Once an RFC has been accepted, prior to it being merged in to the [RFC repo](http://github.com/buildpacks/rfcs), the appropriate sub-team maintainers should create issues in the relevant Buildpacks repositories, linking them to the RFC pull request (using [Github references](https://docs.github.com/en/github/writing-on-github/autolinked-references-and-urls#issues-and-pull-requests))

# Definitions
[definitions]: #definitions

* RFC &rarr; Request For Comments. It is the process followed by the Cloud Native Buildpacks project, as well as many other OSS ones, to provide a consistent and controlled path for new features to enter the spec, libraries, or tools, so that all stakeholders can be confident about the direction Cloud Native Buildpacks is evolving in.
* FCP &rarr; Final Comment Period. This is step taken on a particular RFC when enough discussion of the tradeoffs have taken place and the team is in a position to make a decision. Before entering FCP, super majority of the team must sign off.
* PR &rarr; (Github) Pull Request.

# Motivation
[motivation]: #motivation

As the number of RFCs increase, it has become increasingly hard to ensure that a given RFC has been implemented, or will be implemented. This RFC proposes an amendment to the [RFC process](https://github.com/buildpacks/rfcs#rfc-process).

The current RFC process [defines](https://github.com/buildpacks/rfcs#rfc-process) that:
> the team member who merges the pull request should do the following ... Create a corresponding issue in the appropriate repo.

In practice, that adds extra work for the team member who merges in the PR, and it may slip through the cracks occasionally. Additionally, the sub-team maintainers are often the best people to create the issue, given their insight into how it should be implemented.

As an additional consideration, it is often hard to track work from the RFC proposal to the implementation, and difficult to ensure that it was completed. If we use [Github references](https://docs.github.com/en/github/writing-on-github/autolinked-references-and-urls#issues-and-pull-requests) to link the RFC PR to the issue on the appropriate repository, we can better track the work, and be notified when it is fully implemented.

# What it is
[what-it-is]: #what-it-is
This defines a process for sub-team maintainers to open issues on the relevant repositories, after FCP for the RFC concludes, before it is merged in.

# How it Works
[how-it-works]: #how-it-works
When a PR has been accepted (after FCP has concluded), the sub-team maintainers make issues (tagging the RFC PR) in the relevant buildpack repos, and labels the PR `issues-created`. At that point, the RFC PR may be merged in, with references to the CNB issues added to the RFC [metadata](https://github.com/buildpacks/rfcs/blob/main/text/0044-pack-publish-buildpack.md#meta).

Given an RFC PR #002, which discusses a change relevant to the `pack CLI` to add in a `pack my-bags` command. After discussion in Working Group meetings and votes from the Core Team, the RFC is placed in FCP for 7 days. At the end of those, the platform maintainers should open an issue (issue #005) in the `pack CLI`, which tags the RFC PR. For example,

```
### Description

To enable easier traveling, we would like to add a `pack my-bags` command

### Proposed solution
This issue is a request to implement the proposed solution as detailed in #buildpacks/rfcs#002

### Additional context
- This feature should be documented as part of standard pack CLI commands documentation.
```

After creating the issue, the maintainer should add the label `issues-created`  to the PR. Upon seeing that issue created, a member of the core team will merge it in, adding references to the RFC metadata, like so:
```
# Meta
[meta]: #meta
- Name: Pack My Bags
...
- CNB Issue: [buildpacks/pack#005](https://github.com/buildpacks/pack/pull/5)
```

# Drawbacks
[drawbacks]: #drawbacks
N/A

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?
    * Core member makes the issue(s) &rarr; This adds extra responsibility when merging issues
    * Author of the RFC &rarr; That was my initial suggestion, but there was a concern that it could make the RFC process less approachable for new contributors, and as a community-driver process, we should take steps to make our process friendly.
    * Anarchy

# Prior Art
[prior-art]: #prior-art

- [LSST DM RFC Process](https://developer.lsst.io/v/DM-5063/processes/decision_process.html#adopting-an-rfc) &rarr; `When consensus is established the Assignee should create a set of tickets that specify the implementation work, and then mark the RFC as Adopted in JIRA.`
- [Rust RFC Process](https://github.com/rust-lang/rfcs#implementing-an-rfc) &rarr; `Every accepted RFC has an associated issue tracking its implementation in the Rust repository; thus that associated issue can be assigned a priority via the triage process that the team uses for all issues in the Rust repository.`
- [EmberJS RFC Process](https://github.com/emberjs/rfcs#the-rfc-life-cycle) &rarr; `Once an RFC becomes active the relevant teams will plan the feature and create issues in the relevant repositories.`

A number of other RFC processes don't define who creates the issues, though they do emphasize that while the author of an RFC is not obligated to implement it, a given RFC having been accepted implies nothing about what priority is assigned to its implementation, nor whether anybody is currently working on it.
Some of those include: 
* [GatsbyJS](https://github.com/gatsbyjs/gatsby/tree/master/rfcs#the-rfc-life-cycle)
* [NixOS](https://github.com/NixOS/rfcs#the-rfc-life-cycle)
* [Yarn](https://github.com/yarnpkg/rfcs#the-rfc-life-cycle)
* [React](https://github.com/reactjs/rfcs/blob/master/README.md#the-rfc-life-cycle)

[Swift](https://github.com/apple/swift-evolution/blob/master/process.md#preparing-an-implementation) requires that an RFC be coupled with a PR for its implementation.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

No. However, this RFC would entail a proposed change to the RFC process, as defined in the https://github.com/buildpacks/rfcs/blob/main/README.md. It would now read:

Once an RFC has been accepted, (a) maintainer(s) from the relevant sub-team(s) should create (an) issue(s) in the relevant repositories to implement the RFC, [referencing](https://docs.github.com/en/github/writing-on-github/autolinked-references-and-urls#issues-and-pull-requests) the RFC PR. At that point, they should add the label `issues-created` to the RFC.

Upon seeing the issue(s) created, the team member who merges the pull request should do the following:
* Assign an id based off the pull request number.
* Rename the file based off the id inside text/.
* Create a corresponding issue in the appropriate repo.
* Fill in the remaining metadata at the top.
* Commit everything.