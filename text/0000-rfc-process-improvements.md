# Meta
[meta]: #meta
- Name: RFC process improvements
- Start Date: 2019-12-20
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: Amends [rfc#4](https://github.com/buildpacks/rfcs/pull/7/files)

# Summary
[summary]: #summary

The RFC process provides the main vehicle for substantial changes to the project, but needs amending to prevent RFCs getting stuck.

# Motivation
[motivation]: #motivation

The RFC process currently allows proposals to stall, because it has an unclear forcing function (its unclear how to initiate the FCP process) and so RFCs can languish in discussion.

The RFC process needs to function smoothly in order for changes to the project to happen. As a general rule, RFCs are a response to a problem at hand and are thus dealt with best in a timely fashion before the urgency that generated them is lost and community members move on to other priorities; and if they move onto other things, we should have a way of closing the page on a discussion that hasn't borne fruit. As an infrastructural project, we should have a bias towards stability (which the RFC process provides), but we also need to bring some sense of urgency to the process of growing the project.

For example, [scriptless buildpacks](https://github.com/buildpacks/rfcs/pull/17) seems to have broad consensus and healthy discussion, but has seen a slowdown of activity as time passes and priorities have shifted to other things. At the same time, it addresses a real need in the ecosystem for the existence of a simpler, high-level API for buildpacks. This RFC proposes some process changes that might improve the throughput of the RFC process.

So that we can maintain forward momentum, we should do everything we can to sanely deal with ideas that people are generally in support of, but nobody is willing to champion and drive to completion, and thus sit around in discussion and in draft form creating drag on the project and spreading our focus by limiting the project's work in progress.

# What it is
[what-it-is]: #what-it-is

This RFC proposes an amendment to [rfc#4](https://github.com/buildpacks/rfcs/pull/7/files) to address the above issues.

# How it Works
[how-it-works]: #how-it-works
This RFC amends [rfc#4](https://github.com/buildpacks/rfcs/pull/7/files), specifically the section that begins:

> Once a pull request is opened, the RFC is now in development and the following will happen:

Change:
```diff
-- When deemed "ready", a team member will propose a "motion for final comment period (FCP)" along with a disposition of the outcome (
+- When deemed "ready", a team member will propose a "motion for final comment period (FCP)" along with a disposition. If the RCF has remained open for longer than the "discussion period" days and a team member has not moved for the proposal to be moved to FCP (deemed "ready"), the RFC will be automatically tagged with `FCP` via (github action, eg.) with a disposition to close the RFC.
+- The discussion period will initially be set at 90 days, and adjusted up or down based on whether team members feel this period is achieving the dual goals of fomenting healthy discussion and arriving at a timely decision.
```

# Drawbacks
[drawbacks]: #drawbacks

This change gives maintainers more work and maybe cause contentious issues to either be moved through too quickly or closed prematurely.

# Alternatives
[alternatives]: #alternatives

- Consider RFCs stale after 30 days of inactivity and close them without moving to FCP.
- Automatically merge RFCs after FCP closes

# Prior Art
[prior-art]: #prior-art

Not sure here

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What period of time makes sense for RFCs to be considered stale?
- Is forcing issue to be dealt with or closed the best way to achieve the design and consensus outcomes we want out of the RFC process?
- What of RFCs that are closed because no agreement could be reached, but still seem important?
