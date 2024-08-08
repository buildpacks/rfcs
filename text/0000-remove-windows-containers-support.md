# Meta
[meta]: #meta
- Name: Remove Windows Containers Support
- Start Date: 2024-04-11
- Author(s): aidan.delaney
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: "N/A"

# Summary
[summary]: #summary

Retain Windows Containers support in the buildpacks specification, but remove Windows Containers support from `lifecycle`, `pack` CLI, and documentation.

# Definitions
[definitions]: #definitions

Make a list of the definitions that may be useful for those reviewing. Include phrases and words that buildpack authors or other interested parties may not be familiar with.

* [Windows Containers](https://learn.microsoft.com/en-us/virtualization/windowscontainers/about/): Containers derived from Windows Server Containers.  For example: `mcr.microsoft.com/dotnet/framework/sdk:4.8-windowsservercore-ltsc2022`

# Motivation
[motivation]: #motivation

- There are no known users of Windows Container support within the buildpacks ecosystem.
- Supporting Windows Containers is straightforward at a specification level.  However, the CNB project has neither the time nor the expertise to continue to support Windows Containers in our tooling.
- Removing Windows Container support from CNB tooling will speed up development, simplify testing and impact no existing users.
- Establish platform parity between `pack` and `kpack`.  `kpack` has never supported building Windows Containers.

# What it is
[what-it-is]: #what-it-is

- We want to remove Windows Containers related documentation, but clearly state that the specification is platform neutral.
- Remove Windows Containers support from `pack`, but retain the Windows platform release of the `pack` CLI.
    * this ensures `pack` users can still invoke `pack` on a Command or Power Shell console
- Remove Windows Containers support from `lifecycle`.  Lifecycle can remove the Windows platform release as it will then be guaranteed to run on a Linux-based container.

# How it Works
[how-it-works]: #how-it-works


# Migration
[migration]: #migration

Teams that require Windows Container support will have to

* continue to use the last release of `pack` that supports Windows Containers,
* fork `pack` and `lifecycle` to maintain Windows Containers support, or
* adopt alternative tooling that supports Windows Containers.

# Drawbacks
[drawbacks]: #drawbacks

Windows Containers support is well tested within `pack`.  Removing support for Windows Containers removes a unique selling point of the `pack` CLI and `lifecycle`

# Alternatives
[alternatives]: #alternatives

- We have discussed platform support with `pack` users.  There are no `pack` users who want to maintain Windows Container support.  Should engineering effort become available to help with development and maintenance, then this proposal can be dropped.

# Prior Art
[prior-art]: #prior-art

N/A

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- We have made outreach efforts to CNB users to survey requirements of Windows Container support.  We have found no users.  The number of CNB users that require Windows Container support is still an open question.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

This proposal requires no specification changes.

# History
[history]: #history

<!--
## Amended
### Meta
[meta-1]: #meta-1
- Name: (fill in the amendment name: Variable Rename)
- Start Date: (fill in today's date: YYYY-MM-DD)
- Author(s): (Github usernames)
- Amendment Pull Request: (leave blank)

### Summary

A brief description of the changes.

### Motivation

Why was this amendment necessary?
--->
