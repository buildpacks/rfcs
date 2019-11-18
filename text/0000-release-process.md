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

# Prior Art
[prior-art]: #prior-art

### References

* Release branches: https://docs.microsoft.com/en-us/azure/devops/repos/git/git-branching-guidance?view=azure-devops#manage-releases
* Change control board: https://en.wikipedia.org/wiki/Change_control_board
* Feature Complete and CCB: http://www.professionalqa.com/code-freeze


# Unresolved Questions
[unresolved-questions]: #unresolved-questions