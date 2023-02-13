# Meta
[meta]: #meta
- Name: Release Process
- Start Date: 2019-11-18
- Status: Implemented
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

A release process _template_ that may be applied to various components maintained by the Cloud Native Buildpacks
organization. This template is initially intended to be applied to [pack](https://github.com/buildpacks/pack). It does not try to solve for out-of-band releases such as patches, or otherwise changes in release dates due to coordination across dependencies or upstream changes.

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
- [release finalization](#release-finalization) - the step of finalizing and publishing a release

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

* Release Cadence: **Every 6 weeks** 
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

A change control board would consist of the maintainers of the components's sub-team. They would organize
changes that might be suitable for [release branches](#release-branches) during feature complete. The communication of
the board could take place in Slack, such as in `#release-planning`, or through meetings organized by the
[release manager](#release-manager).

The board members typically decide on whether a change should be included in the release based on the following criteria:

- Impact
- Effort
- Risk

#### Release branches

Release branches are protected branches that will be created at the beginning of feature complete. These branches are
protected, similar to `master`, if not more so depending on the [change control board](#change-control-board) members. 

The release branch will be tagged and merged into `master` upon release. At this point in time, there is no intention to
maintain the release branch after it has been merged in. For more details, refer to [release finalization](#release-finalization)

```text
                 master

                   o
                   |
                   |    release/1.2.3
                   |
                   o ---------+     <--+ merge release branch into master
                   |          |
                   |          o commit: fix/critical-or-minor (tag:v1.2.3)
                   |          |
                   |          |
commit: feature/Y  o          |
                   |          |
                   |          |
                   |          |
                   |          |
                   +----------+     <--+ start feature complete
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

A migration guide is a document which details breaking changes and provides actions that may be taken to migrate from
prior versions.

### Release Manager

A release manager is a role assigned to an individual selected to own the release process. A release manager should be
part of the component's maintainers sub-team. They may volunteer, or be selected by other members of the component's maintainers
sub-team. Their role and responsibilities start as soon as a release going into [feature complete](#feature-complete).

The responsibilities of the release manager include, but are not limited to:

- Communicating status during working group meetings.
- [Scheduling CCB meetings](#change-control-board).
- [Finalizing the release](#release-finalization).

### Release Finalization

Upon finalization of the release the following will take place:

- A github release will be created containing the following:
    - **Artifacts**
    - **Release Notes**
    - **Migration Guide**, when appropriate.
- The release branch will be tagged as `v<version>`.
- The release branch will be merged into `master`.
- Send out notifications:
    - Mailing List
    - Slack #announcements
    - Twitter

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

To avoid the necessity to create a new, short-lived (maybe, see [unresolved-questions](#unresolved-questions)) branches
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
- Configuration could apply across deliverable to ensure compatibility in similarly versioned releases.

##### Disadvantages:

- Increases complexity to release a feature.
- Feature flag configuration could become very cumbersome (perhaps once a feature is accepted and release, the flag
could be removed?)
- Feature flags not currently accepted as a proposal, or implemented.

### Lazy Consensus

Rather than convening a specific Change Control Board, a release candidate and accompanying release notes is published
and shared via mailing list and/or Slack with appropriate maintainer groups tagged. The change review process is then
opened for no less than five working days, during which any maintainer or contributor can raise any issues,
including requesting an extension to the review period.

##### Advantages

- Scheduling time for individuals to review a release should be simpler than trying to convene a group of people
frequently over a week long period.

##### Disadvantages

- The absence of blocking comments may not provide confidence that the release candidate has been actively reviewed
by all (or any) maintainers.
- Time spent thoroughly reviewing and reaching a decision to approve the release will become the responsibility of
each individual, rather than the forcing function of regularly scheduled meetings.
- An individual, or group would still need to take responsibility to actually initiate the publishing of a release.

### Continuous Release Notes

Each feature-adding or -changing PR should be accompanied with a change or addition to a release notes document or
folder in order to be accepted.

##### Advantages

- Simpler to release, as notes just need compiling

##### Disadvantages

- Note style and quality may be inconsistent amongst contributors

# Prior Art
[prior-art]: #prior-art

- [Kubernetes' Release SIG](https://github.com/kubernetes/sig-release/tree/master/releases)
- [Helm's release process](https://github.com/helm/community/blob/master/helm-maintainers-onboarding-guide.md#the-release-process)
- [Harbor's lazy consensus implementation](https://github.com/goharbor/community/blob/master/GOVERNANCE.md#lazy-consensus)

### References

* Release branches: https://docs.microsoft.com/en-us/azure/devops/repos/git/git-branching-guidance?view=azure-devops#manage-releases
* Change control board: https://en.wikipedia.org/wiki/Change_control_board
* Feature Complete and CCB: http://www.professionalqa.com/code-freeze

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Could, or should, the release branch be used to create future patches once it's merged to master?
    - The release branch _could_ be used to enable patches but not necessary since a new branch for patching can
    always be created from the tagged commit. 
