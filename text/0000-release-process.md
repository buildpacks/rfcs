# Meta
[meta]: #meta
- Name: Release Process
- Start Date: 2019-11-18
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

The release process for the various components maintained by the Cloud Native Buildpacks organization.

# Motivation
[motivation]: #motivation

Through the previous releases of pack and lifecycle we've come to learn that a time-based release cadence makes the
most sense. Unfortunately, due to the fact that there is no formal process, making the release happen has been met by
some inconsistencies in timing and confusion in processes. These are generally in the form of conversations revolving 
the following questions _"when are we going to release?"_, _"what do we want to put in this release?"_, 
_"should we wait for feature Y to release?"_, etc.

# Consumer Impact

#### Improvements

At the moment, releases tend to get pushed back to ensure certain feature sets are released. With more
definitive guidance we could plan around it and isolate features when necessary through the process of
[CCB](#change-control-board) while maintaining the goal of releasing on time.

#### Concerns

If the [Release Cadence](#timetable) is too long, consumers would need to wait longer for features they request
if they are not included in the currently scheduled release.

# What it is
[what-it-is]: #what-it-is

The proposed release process aims to be flexible while providing structure. It proposes a 3-phase release cycle for
the purpose of:
 
1. Enabling [scheduled releases](#timetable)
2. Allowing for the [continuation of development](#concurrency)
3. [Isolating releases](#release-branches) and their features
4. Ensure [user acceptance](#user-acceptance-testing) takes place
5. [Migration](#migration-guide) is considered

### Phases
Each release would consists of the following 3 phases:

- development - standard development process _(issue -> PR -> merge)_
- [feature complete](#feature-complete) - branch of code into a [release branch](#release-branches) for ongoing [UAT](#user-acceptance-testing)
- [release execution](#release-execution) - the step of finalizing and publishing a release

```text
 release X

 +---------------+      +------------------+      +---------+
 |  development  | ---> | feature complete | ---> | release |
 +---------------+      +------------------+      +---------+

```

# How it Works
[how-it-works]: #how-it-works

### Timetable

_The following schedules are suggestive and subject to change based on practicality._

* Release Cadence: **Monthly** on the **1st Tuesday** of the month 
* Feature Complete: **5 business days** prior to scheduled release
* CCB Review: **daily**

### Concurrency

Due to the nature of [release branches](#release-branches), this enables development to continue on future releases
while finalizing the current release. 

```text
 release X

 +---------------+      +------------------+      +---------+
 |  development  | ---> | feature complete | ---> | release |
 +---------------+      +------------------+      +---------+

+---------------------------------------------------------------------------------+

                        release Y

                        +---------------+      +------------------+      +---------+
                        |  development  | ---> | feature complete | ---> | release |
                        +---------------+      +------------------+      +---------+
```

### Terminology

#### User Acceptance Testing

User acceptance testing (UAT) is the process of manually verifying that new features and fixes are **complete** and 
**don't introduce issues**. Typically, there are two strategies:

1. Rolling UAT - User acceptance is done per issue as the issue is completed.
2. Feature-Complete UAT - User acceptance is done when all features are complete.

More commonly Feature-Complete User Acceptance is used in practice because any additional changes could have unexpected
side-effects invalidating prior completed UATs. In our case, Feature-Complete UAT fit perfectly during the
[feature complete](#feature-complete) phase.

#### Feature Complete

Feature complete for a particular release is a period of time when changes are analyzed and vetted before being added to
a release.

The following take place:

1. At the beginning, a release branch is created (`release/<version>`).
2. At the beginning, a [change control board](#change-control-board) is organized on a daily basis to review additional
requested changes.
3. During, only changes approved by the CCB are merged into the release branch.

#### Change Control Board

A change control board would consist of core developers that, on a daily basis, organize changes that might
be suitable for [release branches](#release-branches) during the feature complete.

The board members typically decide on whether a change should be included on the release based on the following criteria:

- Impact
- Effort
- Risk

#### Release branches

Release branches are protected branches that will be created at the beginning of feature complete. These branches are
protected, similar to `master`, if not more so depending on the [change control board](#change-control-board) members. 

The release branch will be merged into `master` upon release.

```text
                 master

                   o
                   |
                   |    release/1.2.3
                   |
                   |          o commit: fix/critical-or-minor
                   |          |
                   |          |
commit: feature/Y  o          |
                   |          |
                   |          |
                   |          |
                   |          |
                   +----------+ <--+ start feature complete
                   |
                   |
                   |
                   |
commit: feature/X  o
                   |
                   |
                   +
```

#### Migration Guide

A migration guide is a document which details breaking changes for migrating from prior versions.

### Release Execution

Upon execution of the release the following will take place:

- A github release will be created containing the following:
    - **Artifacts**
    - **Release Notes**
    - **Migration Guide**, when appropriate.
- The release branch will be tagged as `v<version>`.
- The release branch will be merged into `master`.

# Drawbacks
[drawbacks]: #drawbacks

A number of these processes could be considered quite heavy, especially when compared with the current informal
approach.
- Arranging time for a suitably diversely represented Change Control Board to meet on a daily basis for the week of
releases could be challenging to schedule, and a burden on the time of members of the board.
- Release branches may be hard for contributors to track, and understand where pull requests should be made to.

# Alternatives
[alternatives]: #alternatives

As there are a number of sub-processes discussed in this RFC, alternatives can be considered for individual parts of the
proposed process. In this way we can pick and choose a combination of steps that meet our needs.

### Continuing trunk based development

To avoid the necessity to create a new, short-lived (maybe, see [unresolved-questions](#unresolve-questions)) branches
for each release cycle, there are a number of approaches we could use that would allow us to release directly from our
master branch.

#### Advantages to continuing trunk based development

- No changes to existing development workflow - all PRs target master
- Low overhead visibility to code included in current build
- Released commit guaranteed to be part of consistent commit history

#### Approach: PR acceptance freeze

During the change control window, we could selectively choose not to accept feature change PRs.

##### Advantages:

- Existing process requires PR approval and maintainer to merge changes, this would be relatively low touch to 
implement.

##### Disadvantages:

- Slowing down acceptance of contributions unnecessarily could be off-putting to contributors.
- Certain test suites such as the pack compatibility suite are only ran once the change has been merged to master,
feedback for any failures introduced would be delayed.

#### Approach: Build time feature flags for all new features

As detailed in the existing [Feature Flags Proposal](https://github.com/buildpacks/pack/issues/368), we could require
that any new features added to our code can be turned on or off through build time configuration. Our build time
configuration for each release would be kept in version control which could be used to independently build release
candidates and the final release. Our test suites should be configured using the same source to ensure we are testing
only what we expect to be included, and perhaps that we are not including code we don't expect to exist.

##### Advantages:

- Release configuration, and justifications maintained in searchable source code with history.
- Configuration could apply across deliverables to ensure compatibility in similarly versioned releases.

##### Disadvantages:

- Increases complexity to release a feature.
- Feature flag configuration could become very cumbersome (perhaps once a feature is accepted and release, the flag
could be removed?)
- Feature flags not currently accepted as a proposal, or implemented.

### Lazy Consensus

Rather than convening a specific Change Control Board, a release candidate is published and shared via mailing list
and/or Slack

# Prior Art
[prior-art]: #prior-art

- [Helm's release process](https://github.com/helm/community/blob/master/helm-maintainers-onboarding-guide.md#the-release-process)
- [Harbor's lazy consensus implementation](https://github.com/goharbor/community/blob/master/GOVERNANCE.md#lazy-consensus)

### References

* Release branches: https://docs.microsoft.com/en-us/azure/devops/repos/git/git-branching-guidance?view=azure-devops#manage-releases
* Change control board: https://en.wikipedia.org/wiki/Change_control_board
* Feature Complete and CCB: http://www.professionalqa.com/code-freeze


# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Who makes up the Change Control Board, and how are meetings scheduled?
- Will the release branch be maintained after the changes have been merged back in to master? Could, or should, this
branch be used to create future patches?
