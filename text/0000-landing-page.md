# Meta
[meta]: #meta
- Name: Create a community landing page
- Start Date: 1-6-2020
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

Prospective contributors to the project don't have a central place to go for information. This RFC proposes the creation of a community or "landing page" repo at `buildpacks/community` with high level information about the project including key personnel, governance, guidelines for contributions, meeting schedules, etc.

# Outcomes
[outcomes]: #outcomes

 - New contributors feel welcomed.
 - A new contributor can easily find information they want about the project, can join the slack and WG meetings, and can quickly contribute pull-requests, RFCs, and issues.

# Motivation
[motivation]: #motivation

A major part of the success of the CNB project will necessitate growing contributors beyond the current core. As new people learn about the project and want to contribute, we need a friendly central landing place where all the information _about_ the project is housed. Ideally this repo serves as a pointer for all the relevant information that somebody would need to answer "How do I get started contributing to the project"? Some overview of the ecosystem that the project is creating and working within seems relevant to these contributors.

There's probably some overlap between information contained on buildpacks.io and this repo. Ideally the former is targeted to the end user getting started, without overburdening them with too much information that would be irrelevant to using project. Ideally buildpacks.io would answer "How do I get started __using__ this project?" The end users would, ideally, become contributors 😸 to the ecosystem and thus buildpacks.io should probably link to this repo somewhere, not on its front page.

# What it is
[what-it-is]: #what-it-is

This RFC proposes the creation of a project landing page that will be house at `buildpacks/community`.
It will have a central `README.md` that included the following information and links to documents that provide more details if and when that's necessary:

- Purpose of the project and high level overview including some canonical talk from YouTube, etc
- Technical overview, including guides to the various components of the projects and links to their respective repositories
- Project and community overview, including key personnel, governance structures (links to `GOVERNANCE.md`), explanations of and links to our various communication channels: slack, WG calendar events, our mailing list, and twitter, a link to our code of conduct, and a link to a contribution guide (this document is likely sufficiently detailed as to necessitate a separate document below).
- `CONTRIBUTING.md` which will link to our RFC readme and include various other pieces of information about how to get started contributing to the project
- Ecosystem overview with links to various platforms, builders, adoptions, etc. to give a sense of the scope of the community beyond the immediate CNB project
- `GOVERNANCE.md` which thoroughly lays out how the project runs from a governance standpoint


Any current information from https://github.com/buildpacks/resources will get ported over and that repo will be retired.

# Alternatives
[alternatives]: #alternatives

- Keep doing what we're doing
- Add a "contributing" section to `buildpacks.io`

# Prior Art
[prior-art]: #prior-art

- https://github.com/ipfs/ipfs (landing page for IPFS project)
- https://github.com/desktop/desktop (central repo for github desktop but has community information on there)
- https://github.com/goharbor/community
- https://github.com/open-telemetry/community
- https://github.com/helm/community


# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should this include some sort of roadmap? This would ideally give people a sense of where they can start to chip in
- Should we host our WG meetings out of the CNCF calendar so they're more publicly discoverable? Who moderates the Zoom?
