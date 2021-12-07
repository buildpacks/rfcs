# Meta
[meta]: #meta
- Name: Migrate to CNCF Slack
- Start Date: 2021-12-07
- Author(s): [@samj1912](https://github.com/samj1912)
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This RFC proposes that we move our independent slack instance to the CNCF slack instance.

# Definitions
[definitions]: #definitions

N/A

# Motivation
[motivation]: #motivation

CNCF slack is an umbrella slack enterprise instance that quite a few CNCF projects use. As Buildpacks is maturing as a CNCF project, using the CNCF slack will put us closer to our sibling projects and their community. The CNCF slack also comes with CNCF support around spam prevention, moderation and integration with LFX insights. This will help us manage and track the growth of our community. CNCF slack is also an enterprise instance which means that we will have unlimited retention of messages and the ability to create people groups to mention maintainer teams. We will also be able to use private channels if needed.

As a part of CNCF slack onboarding, we can also migrate all of our data and channels onto the CNCF workspace, preserving any past history of conversations that took place in the Buildpacks slack. For more details please see [CNCF - Migrating workspaces](https://slack.com/intl/en-gb/help/articles/217872578-Import-data-from-one-Slack-workspace-to-another)

# What it is
[what-it-is]: #what-it-is

This RFC proposes that we move the Buildpacks slack instance from an independent instance to the CNCF instance.

# How it Works
[how-it-works]: #how-it-works

The maintainers will have to request the migration of the Buildpacks slack over to CNCF slack and co-ordinate the announcements/user migration.

The following are the slack channels that will be migrated over and their proposed names after migrations - 

| Current                 | Proposed                       |
| ----------------------- | ------------------------------ |
| announcements           | buildpacks-announcements       |
| arm                     | buildpacks-arch-arm            |
| buildpacks-authors      | buildpacks-authors-team        |
| buildpacks-distribution | buildpacks-distribution        |
| general                 | buildpacks                     |
| implementation          | buildpacks-implementation-team |
| implementation-ops      | buildpacks-implementation-ops  |
| learning                | buildpacks-learning-team       |
| learning-ops            | buildpacks-learning-ops        |
| maintainers             | buildpacks-maintainers         |
| mentoring               | buildpacks-mentoring           |
| ops                     | buildpacks-ci-ops              |
| pack-cli                | buildpacks-pack-cli            |
| platform                | buildpacks-platform-team       |
| registry                | buildpacks-registry            |
| spec                    | buildpacks-spec                |
| spec-ops                | buildpacks-spec-ops            |
| tekton                  | buildpacks-platform-tekton     |
| windows                 | buildpacks-arch-windows        |

The following channels will not be migrated - 

- classic (inactive)
- community (inactive)
- delivery (inactive)
- docs (inactive)
- elixir (inactive)
- governance (inactive)
- java (inactive)
- kaniko (inactive)
- kpack (not part of the official project)
- packfile (inactive)
- python (inactive)
- random (inactive)
- rfcs (inactive)
- ruby (inactive)
- stacks (inactive)
- summit-2021 (inactive)
- user-research (inactive)
- wg-chat (inactive)


# Drawbacks
[drawbacks]: #drawbacks

- All of the current users are not moved over to the new slack instance as a part of the migration. Users who are in the Buildpacks slack but not in the CNCF slack will have to create new accounts on the CNCF slack.
- The migration might also be disruptive to the existing Buildpacks community on slack, as such we should carefully evaluate whether we want to move or not.

# Alternatives
[alternatives]: #alternatives

- Keep using the Buildpacks slack.
- Use the Kubernetes slack instance, which is the other alternative that CNCF provides. Kubernetes slack has a larger user base but doesn't come with the ability to create private channels.

# Prior Art
[prior-art]: #prior-art

TBD

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

How to handle the migration with no downtime?
