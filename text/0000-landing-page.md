# Meta
[meta]: #meta
- Name: Create a community landing page
- Start Date: 1-6-2020
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

People interested in the project don't have a central place to go for information. This RFC proposes the creation of a community or "landing page" repo at `buildpacks/buildpacks` with high level information about the project including key personel, governance, guidelines for contributions, meeting schedules, etc.

**Outcomes**
[outcomes]: #outcomes

 - New contributors feel welcomed.
 - A new contributor or user of the project can easily find what they want, join the slack, WG meetings, and immediately contribute pull-requests, RFCs, and issues.

# Motivation
[motivation]: #motivation

A major part of the success of the CNB project will necessitate growing contributors beyond the current core. As new people learn about the project and want to use it or contribute, we need a friendly central landing place where all the information _about_ the project is housed.

# What it is
[what-it-is]: #what-it-is

This RFC proposes the creation of a project landing page that will be house at `buildpacks/buildpacks`.
It will have a central `readme.md` that included the following information and links to documents that provide more details if and when that's necessary

- Purpose of the project and high level overview including some canonical talk from youtube, etc
- Technical overview, including guides to the various components of the projects and links to their respective repos
- Project and community overview, including key personel, governance structures, link to slack, calendar links, and links to a contribution guide (this document is likely sufficiently detailed as to necessitate a seperate document beloew)
- `contributing.md` which details the RFC process and various other pieces of information about how to get started contributing to the project
- Ecosystem overview with links to various platforms, builders, adoptions, etc. to give a sense of the scope of the community beyond the immediate CNB project

# Alternatives
[alternatives]: #alternatives

- Keep doing what we're doing

# Prior Art
[prior-art]: #prior-art

- https://github.com/ipfs/ipfs (landing page for IPFS project)
- https://github.com/desktop/desktop (central repo for github desktop but has community information on there)


# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should this include some sort of roadmap? This would ideally give people a sense of where they can start to chip in
- Should we host our WG meetings out of the CNCF calendar so they're more publicall discoverable? Who moderates the zoom?
