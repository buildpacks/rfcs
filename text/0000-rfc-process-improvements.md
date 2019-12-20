# Meta
[meta]: #meta
- Name: RFC process improvements
- Start Date: 2019-12-20
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: Amends [rfc#4](https://github.com/buildpacks/rfcs/pull/7/files)

# Summary
[summary]: #summary

The RFC process provides the main vehical for substantial changes to the project, but needs amending to prevent RFCs getting stuck.

# Motivation
[motivation]: #motivation

The RFC process currently has at least two problems that allow proposals to stall:
1. It has an unclear forcing function (its unclear how to intiate the FCP process) and so RFCs can languish
2. When voting members are absent RFCs cannot move forward

As to issue #1, the RFC process needs to function smoothly in order for changes to the project to happen. As a general rule, RFCs are a response to a problem at hand and are thus dealt with best in a timely fashion before the urgency that generated them is lost and community members move on to other priorities; and if they move onto other things, we should have a way of closing the page on a discussion that hasn't borne fruit. As an infrastructural project, we should have a bias towards stability (which the RFC process provides), but we also need to bring some sense of urgency to the process of growing the project.

For example, [scriptless buildpacks](https://github.com/buildpacks/rfcs/pull/17) seems to have broad concensus and healthy discussion, but has seen a slowdown of activity as time passes and priorities have shifted to other things. At the same time, it addresses a real need in the ecosystem for the existence of a simpler, high-level API for buildpacks. This RFC proposes some process changes that might improve the throughput of the RFC process.

So that we can maintain forward momentum, we should do everything we can to sanely deal with ideas that people are generally in support of, but nobody is willing to champion and drive to completion, and thus sit around in discussion and in draft form creating drag on the project and spreading our focus by limiting the project's work in progress.

As to #2, voting members should be able to take vacation, step away from the project for personal reasons, kick back their heells on a desert island, etc. In these cases, their needs to be support for the process not stalling.

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
+- When deemed "ready", a team member will propose a "motion for final comment period (FCP)" along with a disposition. If RCF has remained open for longer than 90 days and a team member has not moved for the proposal to be moved to FCP (deemed "ready"), the RFC will be automatically tagged with `FCP` via (github action, eg.) with a disposition to close the RFC.
```

This RFC also proposes adding a new additon to the RFC process:

- Core maintainers can and should delegate a voting proxy if they are going to be absent from project activities for longer than 1 week. Their delegat can be scoped globally (they can vote on anything) or scoped locally to a subteam. The maintainer in question should designate their proxy by opening a pull request with the following text which will remain open during the time of their tenure as votiong delegate:
> For the dates of YYYY-MM-DD to YYYY-MM-DD I designate @person to vote on my behalf on RFCs covering [global, subteams]


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
- Is forcing issue to be dealt with or closed the best way to achieve the design and concennsus outcomes we want out of the RFC process?
