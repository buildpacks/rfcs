# Meta
[meta]: #meta
- Name: Define a minimum standard for docs in order to ship the lifecycle
- Start Date: 4/7/2021
- Author(s): natalieparellano
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

The project has made improving our documentation a priority for 2021. In order to deliver on this promise, this RFC proposes defining a minimum standard for documentation that should be met before we're able to ship new versions of the lifecycle.

# Definitions
[definitions]: #definitions

Docs repo: https://github.com/buildpacks/docs

Migration guides: https://github.com/buildpacks/docs/tree/main/content/docs/reference/spec/migration

Lifecycle-specific content: https://github.com/buildpacks/docs/tree/main/content/docs/concepts/components/lifecycle

# Motivation
[motivation]: #motivation

- Why should we do this? Better docs!
- What use cases does it support? Every persona will be happier about this.
- What is the expected outcome? Better docs!

# What it is
[what-it-is]: #what-it-is

Today, our minimum standard for docs gating the implementation team's ability to ship the lifecycle is largely non-existent. We do require that the spec has been released (for which there are release notes), and we also provide release notes for the lifecycle. We've lately been trying to have migration guides at least in PR status to the docs repo. However the migration guides often do not contain enough information to sufficiently explain a feature, because "core" documentation is missing - see [exec.d on Windows](https://buildpacks.io/docs/reference/spec/migration/buildpack-api-0.5-0.6/#execd-on-windows) which explains that Windows is now supported but doesn't link to any further documentation to understand exec.d, because said documentation does not exist.

Proposal: For each new version of the lifecycle, we should create a `release/lifecycle/<lifecycle version>` milestone and branch on the docs repo (see [docs release process](https://github.com/buildpacks/docs/blob/main/RELEASE.md#lump-changes) for more information on this process). Prior to shipping the lifecycle, `release/lifecycle/<lifecycle version>` should contain:
* Migration guides for the new APIs implemented
* New content in the lifecycle-specific docs (or wherever is relevant) such that every new feature in the lifecycle is fully explained in the docs (ideally, this content could be linked to from the migration guides)

`release/lifecycle/<lifecycle version>` should be merged into `main` immediately after the lifecycle is shipped. 

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this? More work for the implementation team. We will be slower in shipping new releases.

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered? Leave things the way they are.
- Why is this proposal the best? Docs really need improvement.
- What is the impact of not doing this? Continued frustration for buildpacks users.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should we require docs prior to merging PRs to the lifecycle?
  - Could potentially reduce volume of last minute docs work prior to shipping, but might be aggravating for contributors.
- Who is responsible for verifying that we've met the desired standard? Learning maintainers, implementation maintainers?
- What exemptions to this process should exist? (e.g., for critical bugfixes)
- This RFC doesn't contemplate changes in process for other CNB components, but could provide inspiration.
