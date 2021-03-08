# Meta
[meta]: #meta
- Name: Add Contributer Graph
- Start Date: 2020-03-08
- Author(s): aemengo
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This RFC proposes adding a customized contributer graph to the buildpacks [website](https://buildpacks.io/community/). Please see [mockup](#prior-art) for concept.

# Definitions
[definitions]: #definitions

* Contribution - Opening a issue, Creating a PR, or Creating an RFC
* Organization - The corporation represented by those making a contribution
* OSS community - People engaging in discussion, usage and contribution to an OSS project

# Motivation
[motivation]: #motivation

Tracking the health of an OSS community can be a very intensive activity. It can consist of keeping tabs on GitHub issues across multiple key repositories, or being an active participant in a multiple OSS slack channels, or keeping up with blog posts, etc. Although these collectively yield the most accurate insight into the health of an OSS community, not everyone can devote the time and attention on a consistent basis.

For these others that are still invested in the health of the community, quantitative metrics are a useful recourse. These "others" could be prospective engineers deciding whether to immerse themselves within the community, or hobbyists looking to champion buildpacks within their organizations.

The expected outcome is that more productive discussions about community engagement can occur when centered around the metrics attempting to depict it.

# What it is
[what-it-is]: #what-it-is

Please note: _This RFC does not intend to provide something fully realized. Instead, it aims to introduce the concept and have it be shaped by discussion, feasibility, and utility._

At a high level, it is a graph that lives on the buildpacks [website](https://buildpacks.io/community/). The graph will show the full lifecycle of an OSS contribution, which could include the following:

- RFC -> Issue/PR -> Shipped
- Issue/PR -> Shipped

A contribution is indicated as a data point and linked to other contributions via lines. The graph is seperated into the most critical repositiories of the buildpacks project. Contributions are color-coded by the participants' organization. Contributions are hyperlinked to GitHub issues. The graph aims to show 3 metrics within a given time interval:

- Total amount of contributions
- Percentage of contributions by organization
- Average turnaround time from RFC -> Issue or Issue -> Shipped. (_This metric is currently illustrated poorly in the mockup_)

There is also a CSV print-out option for those that prefer.

# How it Works
[how-it-works]: #how-it-works

The GitHub API is queried and a graph is rendered from the information. Links between contributions can be extracted from labels on issues. If it proves to be too much logic for the frontend, it can be moved to a backend service.

# Drawbacks
[drawbacks]: #drawbacks

- Not all contributors may want their organization affliations displayed
- The buildpacks community might not want this information publically depicted

# Prior Art
[prior-art]: #prior-art

- [Mockup](https://user-images.githubusercontent.com/4236888/110389457-8dc2b500-8032-11eb-9dc1-3101dd35aff6.gif)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What metrics to show
- What the design looks like
- How to implement