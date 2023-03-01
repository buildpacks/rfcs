# Meta
[meta]: #meta
- Name: Lifecycle releases with long term support (LTS)
- Start Date: 2023-02-24
- Author(s): joe-kimmel-vmw
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

Lifecycle to define approximately 4 releases per year as LTS.
LTS releases will have critical CVEs backported for a window of at least 1 year.
LTS releases may also recieve other backports, including but not limited to golang patch version bumps.

# Definitions
[definitions]: #definitions

**CVE**: While some scholars claim this acronym has origins in the Mayan codices[1], others seem to support a Norse origin[2]. Regardless of its hagiography, CVEs come in varying severities such as Critical, High, and "you probably don't need to patch it but we still wanted to let you know."
These severity levels are issued by the shadowy council of security elders and cannot be modified by mere practitioners such as ourselves.
However there are multiple councils[3] and they will occasionally grade the same vulnerability differently.
This proposal only relates to CVEs graded Critical by at least one council.


# Motivation
[motivation]: #motivation

- Why should we do this? Some organizations that bundle lifecycle into other products are sufficiently risk-averse to be opposed to upgrading to the latest version, but still desire critical CVE patches. This LTS patch-backporting strategy allows us to support these slower moving vendors with minimal effort.
- What use cases does it support? See above.
- What is the expected outcome? Lifecycle will have to maintain a trailing list of supported LTS versions with approximate sunset dates for each. Then for certain CVEs there will be some additional "release engineering" effort to ease backporting and then releasing patch versions.

# What it is
[what-it-is]: #what-it-is

It is risk mitigation for consumer and enterprise customers who want to apply critical patches without re-testing their entire platform for regressions which could occur during a full upgrade cycle.

# How it Works
[how-it-works]: #how-it-works

Lifecycle will maintain a publicly viewable table of LTS versions with anticipated sunset dates for support, probably by extending [this table](https://github.com/buildpacks/lifecycle#supported-apis).
Not all Lifecycle releases will need to be LTS, but 3-5 each year probably will be marked as LTS. Maintainers will be responsible for marking releases as LTS.
Some additional release automation will be built to support patching and releasing LTS releases.


# Migration
[migration]: #migration

N/A

# Drawbacks
[drawbacks]: #drawbacks

Like all efforts this does obviously come with an opportunity cost of alternative lines of work. Additionally, it's especially clear that the cost of this commitment will be not just one-time, but ongoing, until the community sunsets this LTS initiative itself.

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?
  - Just upgrade to the latest: This is our current approach, and works pretty well until some large enterprise partners don't want to do it.
  - Don't apply patches to critical CVEs: This is probably a bad idea.
- Why is this proposal the best? You're so smart, you only read the best proposals, and here you are, reading this one!
- What is the impact of not doing this? We risk alienating some enterprise users of CNB.

# Prior Art
[prior-art]: #prior-art


# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged? Just a general plan for support
- What parts of the design do you expect to be resolved through implementation of the feature? Specifics of release engineering.
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC? Patching policy for non-critical CVEs

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

N/A

# History
[history]: #history

https://www.youtube.com/watch?v=xuCn8ux2gbs

# Footnotes
[1] No,
[2] They don't
[3] see e.g. https://nvd.nist.gov/ and https://www.cve.org/

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
