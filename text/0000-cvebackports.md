# Meta
[meta]: #meta
- Name: CVE discretional Patching
- Start Date: 2023-03-08
- Author(s): joe-kimmel-vmw, natalieparellano
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary
This RFC describes how maintainers MAY issue patch releases in response to critical and high severity CVEs being detected in past or current releases of the lifecycle binary.

# Definitions
[definitions]: #definitions
CVE - Literally expands to “Common Vulnerabilities and Exposures” but in general it refers to a security gap which could be exploited by a malicious attacker, which can be fixed by patching a single component.

CVE Severity: CVEs are announced with a severity score. While this score can vary between vendors, it is made by considering many factors including how easy it is to take advantage of the exploit, what resources are exposed by the exploit, and whether there is already a known exploit in circulation. See https://nvd.nist.gov/vuln-metrics/cvss/v3-calculator

Critical and High are the two highest severity ratings available under the current severity rating system.


# Motivation
[motivation]: #motivation

- Why should we do this?

Patching CVEs is industry best practice. By providing patched updates of recent releases we enable CNB-using organizations with low risk tolerance or high upgrade friction to make a minimal change to their runtime infrastructure that still keeps secure against known vulnerabilities. 
Following patch version line architecture also boosts user trust vs. a pledge to roll forward security fixes to higher version lines with the promise of no breaking changes, which would be looked upon skeptically by some enterprise users. Those same users who are skeptical of any & all promises that new versions won’t have any regressions are especially likely to be running older versions in the wild, thus providing patches to older versions ensures that they can continue to use CNB lifecycle without risking exposure to the riskiest CVEs.

- What use cases does it support?

This is especially important for users who do not use CNB as part of a SaaS product, i.e. for “on-prem” deployments. These on-prem users are pulling down the provided lifecycle images and running the binaries on their own infrastructure, thus increasing their potential risk exposure and liability.

Additionally, as we do have concrete plans to deprecate platform API versions in the lifecycle this calendar year, there's increased likelihood to learn of
other lifecycle consumers who are not ready to upgrade and who would appreciate patch releases.

- What is the expected outcome?

Maintainers MAY issue patch releases in response to critical and high CVEs. Most importantly, users MAY upgrade to consume these patch releases in a timely manner if they are not comfortable consuming the latest version.

# What it is
[what-it-is]: #what-it-is

It is risk mitigation for consumer and enterprise customers who want to apply critical patches without any other changes that would come with a minor version upgrade.

# How it Works
[how-it-works]: #how-it-works

Patch releases will be published at the discretion of the maintainers in response to Critical and High CVEs.

The lifecycle will still offer the same strong backwards compatibility guarantees as ever.

Existing process (patch most recent version N until it becomes N-1) bumps dependencies and the go version each month irrespective of CVEs being present. This proposal does not involve changing that process.

# Migration
[migration]: #migration

N/A

# Drawbacks
[drawbacks]: #drawbacks

Maintaining past releases does take time. However under this proposal that maintenance is optional and performed at the discretion of the maintainers.

For a vague guess at the volume of this work: In the year from March 2022 March 2023, the grype scanner found 3 High and 0 Critical CVEs in the 0.13.5 lifecycle binary, so there would have been at most 3 additional patch releases of that line.
Similarly, grype scanner found 1 High and 0 Critical CVEs in the 0.14.3 lifecycle image (from October 2022),  and 0 High or Critical CVEs in the 0.15.3 lifecycle image (from Jan 2023).



# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?
  - Only Patch the Most Recent Release: This is a fine idea but it only works in a world where all users are willing to migrate to the latest release. This RFC addresses the wants and needs of users who are not comfortable performing minor version upgrades, even with backwards compatibility guarantees, in order to address CVEs.
  - Only Patch development trunk, and wait for the next release: This also only works in a world where minor version upgrades are seen as cheap or low-risk to perform.
  - Don’t Patch CVEs: we probably wouldn’t ever do this option.


- Why is this proposal the best? 
This is the only proposal palatable to orgs that view minor releases as high-risk and/or expensive.
- What is the impact of not doing this? 
We risk alienating some enterprise users of CNB.

# Prior Art
[prior-art]: #prior-art

N/A

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

N/A beyond general feedback and consensus.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

N/A

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
