# Meta
[meta]: #meta
- Name: Add Status to RFC Metadata
- Start Date: 2021-07-14
- Author(s): @aemengo, @ekcasey
- Status: Implemented
- RFC Pull Request: [rfcs#177](https://github.com/buildpacks/rfcs/pull/177)
- CNB Pull Request: (leave blank)
- CNB Issue: [buildpacks/rfcs#183](#https://github.com/buildpacks/rfcs/issues/183)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This is a proposal to add a `Status:` field to the `Meta` section of the RFC template.

# Definitions
[definitions]: #definitions

**Core team:** The party that votes on the approval of RFCs.

# Motivation
[motivation]: #motivation

This RFC formally introduces the **"On Hold"** status for an RFC, in a way that's clear to the community.

# What it is
[what-it-is]: #what-it-is

A new `Status:` field in the `Meta` section of the RFC template. See [#meta](#meta) for example.

The acceptable values are distinguished in the following ways:
- **Draft**: The Core team has not yet approved the RFC. Edits are still being made.
- **Approved**: The Core team has approved the RFC and is accepting PRs for its implementation.
- **On Hold**: The Core team has approved the RFC, but PRs are currently not being accepted for its implementation. A reason must be provided in the RFC.
- **Superseded**: The Core team has approved the RFC, but it is replaced with another RFC

The `Status:` field does not intend to reflect states that are already implied by the RFC process. Examples including: *In Review*, *Closed*, etc.

# How it Works
[how-it-works]: #how-it-works

We will add the following to the RFC `Meta` section template:

```
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
```

When an RFC is approved, the [../merge-rfc.sh](../merge-rfc.sh) script reflects the change like so:

```
- Status: Approved
```

When an RFC is put on hold (_via Pull Request_) then change is reflected like so:

```
- Status: On Hold
```

Pull requests that change the status of a previously accepted RFC to "On Hold", should add a Section titled `Notes` to the top of the RFC containing an explanation for the change of status.

Example:

```
# Notes
## On Hold
Since the approval of this RFC additional concerns X, Y, and Z have been raised. Solving problem Foo is still a priority for the project but the core team has decided to place this RFC on hold pending further discussion of alternative solutions. If you are interested in problem Foo place participate in the discussion on RFC #XXXX.
```

If at a later date the core team or responsible sub-team wishes to move the RFC from "On Hold" back to "Approved", this should be done via PR and another note should be added, describing the resolution of the discussion and the rationale for proceeding with the original RFC.

When an RFC is fully implemented (i.e., the associated tracking issue is closed), then change is reflected like so:

```
- Status: Implemented
```

# Drawbacks
[drawbacks]: #drawbacks

* This field might get out of sync if not properly maintained.

# Alternatives
[alternatives]: #alternatives

- Communicate "On Hold" status through word of mouth
- Reject the "On Hold" status altogether

# Prior Art
[prior-art]: #prior-art

- TensorFlow has an ["Status" field](https://github.com/tensorflow/community/blob/master/rfcs/yyyymmdd-rfc-template.md)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should **"Implemented"** be one of the accepted values?
    - Yes, the RFC shepherd should create a PR updating the status from `Approved` to `Implemented` when the tracking issue is closed.

- How do we retroactively add a **Status:** field to prior RFCs?
    - Manually?

- How do we validate the [#meta](#meta) section of prior RFCs?
    - Perhaps we make a [../validate-rfcs.sh](../validate-rfcs.sh) script that lints the **#meta** section of all rfcs?

# History
[history]: #history

## Amended
### Meta
[meta-1]: #meta-1
- Name: Add Implemented
- Start Date: 2022-12-01
- Author(s): natalieparellano
- Amendment Pull Request: (leave blank)

### Summary

Added `Implemented` as a valid status.

### Motivation

Why was this amendment necessary?

It can be confusing when reviewing older RFCs to know if they were implemented or not.
This can lead to RFCs being "forgotten".
The introduction of [tracking issues](https://github.com/buildpacks/rfcs/blob/main/.github/ISSUE_TEMPLATE/tracking.md) to our process can help ensure that the status gets updated appropriately.
