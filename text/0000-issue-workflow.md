# Meta
[meta]: #meta
- Name: Issue workflow
- Start Date: 2020-03-10
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: "N/A"

# Summary
[summary]: #summary

A workflow template for taking issues from creating to resolution. Project repositories would opt-in to using this
workflow and reference it.

# Motivation
[motivation]: #motivation

As a community member, I would like to get reasonable response times.

As a community member, I would like to see what state issues are currently in.

As a contributor, I would like to easily identify what issues are ready to be worked on.

# What it is
[what-it-is]: #what-it-is

The target audience for this RFC is project contributors. It defines a workflow that project contributors and maintainers
should follow to provide the level of community support that is desired.

The outcome of this RFC would be the documentation of this workflow being published in the
[community](https://github.com/buildpacks/community) repo.

### Labels

##### Statuses
- status/triage
- status/requires-rfc
- status/duplicate
- status/invalid 
- status/incomplete 
- status/blocked
- status/discussion-needed
- status/not-planned
- status/ready
- status/in-progress
- status/resolved
- status/code-approved
- status/user-accepted

##### Types
- type/support
- type/enhancement
- type/bug
- type/research
- type/chore

# How it Works
[how-it-works]: #how-it-works

This is the technical portion of the RFC, where you explain the design in sufficient detail.

### Standard Workflow

```text
     +----------+  +----------------------+            +----------+  +----------------------+
     |             |                      |            |             |                      |
     |             |     status/triage    |            |             |    status/triage     |
     |             |                      |         P  |             |                      |
     |             +----------------------+         U  |             +----------------------+
     |                         |                    L  |                         |
  I  |                         |                    L  |                         |
  S  |             +-----------v----------+            |             +-----------v----------+
  S  |             |                      |         R  |             |                      |
  U  |             |     status/ready     |         E  |             | status/code-approved |
  E  |             |                      |         Q  |             |                      |
  S  |             +----------------------+         U  |             +----------------------+
     |                         |                    E  |                         |
     |                         |                    S  |                         |
     |             +-----------v----------+         T  |             +-----------v----------+
     |             |                      |         S  |             |                      |
     |             |  status/in-progress  |            |             | status/user-accepted |
     |             |                      |            |             |                      |
     +----------+  +----------------------+            +----------+  +----------------------+
                               |                                                 |
                               |                                                 |
                               |                                                 |
                               v                                                 v
                             CLOSED                                            CLOSED
```


### Actionable Issues

An actionable issue is one that can be worked on such that the following is true:

- Definition of done - that may be acceptance criteria or clear expectations.
- Appropriate labels
    - `type/*`
    - `size/*` (if possible)
    - `status/ready`
    - `good first issue` (if applicable)


### Triage

The following is a flow assist contributors in assigning the appropriate labels in script format.

#### Issues

- Is this a support request?
    - Yes
        - Add label type/support
        - Provide support and close the issue with label `status/resolved`\
          OR 
        - Request further information from the issue author and label `status/incomplete`
        - If activity is missing for 7 business days, follow up or close
    - No
        - See below
- Is this something we want to do?
    - I don’t even understand this issue
        - Remove label `status/triage`
        - Add label `status/invalid`
        - Comment and close
    - No - not valid / relevant for our project
        - Remove label status/triage
        - Add label `status/not-planned` or `status/invalid`
        - Comment and close
    - Maybe - needs RFC
        - Remove label `status/triage`
        - Add label `status/requires-rfc`
        - Comment and close
    - Maybe - needs alignment
        - Remove label `status/triage`
        - Add label `status/discussion-needed`
        - Add appropriate `type/*`
    - Maybe - I can’t tell from the information in the issue
        - Remove label `status/triage`
        - Add label `status/incomplete`
        - Request further information from issue author
        - If activity is missing for 7 business days, follow up or close
    - Yes - but it’s not on our roadmap (would consider a PR)
        - Remove label `status/triage`
        - Add label `status/not-planned`
        - Comment and close
    - Yes
        - Could this be worked on right now?
            - Yes
                - Remove label `status/triage`
                - Add label `status/ready`
                - Add appropriate `size/*` (if possible) and `type/*`
            - No - needs clearer definition of done
                - Remove label `status/triage`
                - Add acceptance and label `status/incomplete`
                - Add appropriate `size/*` (if possible) and `type/*`
                - If activity is missing for 7 business days, follow up or close
            - No - needs alignment
                - Remove label `status/triage`
                - Add label `status/discussion-needed`
                - Add appropriate `size/*` (if possible) and `type/*`
            - No - blocked by other work
                - Remove label `status/triage`
                - Add label `status/blocked`
                - Add appropriate `size/*` (if possible) and `type/*`

#### Pull Requests

> Ignoring:
> - Drafts
> - PRs that have recent activity

- As a contributor...
    - If no one has responded within (2 business days):
        - Notify appropriate maintainers
    - If author has not updated PR after feedback within (30 days):
        - Follow up\
          OR
        - Close
- As a maintainer...
    - Does code look good?
        - Yes
            - Remove `status/triage`
            - Add `status/code-approved`
            - Did user acceptance pass?
                - Yes
                    - Add `status/accepted`
                    - Merge
                - No
                    - Add `status/incomplete`
                    - Submit review with changes requested
        - No - needs some changes
            - Remove `status/triage`
            - Add `status/incomplete`
            - Submit review with changes requested
### Automation

This RFC does not call any specific automation but in providing processes around issues and pull requests
it would enable further automation such as:

- Labels can be synchronized across repositories ([RFC#53](https://github.com/buildpacks/rfcs/pull/53)).
- Block PR merges until `status/accepted` label is added.
- Relabel issues for triage as they become stale.

# Drawbacks
[drawbacks]: #drawbacks

- Adds process and responsibility to project contributors and maintainers.  

# Alternatives
[alternatives]: #alternatives

- Do nothing.

# Prior Art
[prior-art]: #prior-art

- [k8s Issue Triage](https://github.com/kubernetes/community/blob/master/contributors/guide/issue-triage.md)
- [k8s First Contributions](https://github.com/kubernetes/community/blob/master/contributors/guide/first-contribution.md)
- [k8s Pull Request Process](https://github.com/kubernetes/community/blob/master/contributors/guide/pull-requests.md#the-pull-request-submit-process)


# Unresolved Questions
[unresolved-questions]: #unresolved-questions