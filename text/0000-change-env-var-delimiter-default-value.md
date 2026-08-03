# Meta
[meta]: #meta
- Name: Change environment variable delimiter default value for append/prepend operations
- Start Date: 2025-03-12
- Author(s): sgaist
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: "N/A"

# Summary
[summary]: #summary

This RFC proposes to change the default empty delimiter value used in append and prepend operations when modifying environment variables to be the platform delimiter (e.g. `:` for Linux).

# Definitions
[definitions]: #definitions

N/A

# Motivation
[motivation]: #motivation

When appending or prepending a value to an environment variable such as PATH, the default delimiter used is an empty string. In the majority of cases, it's not the value required nor expected and buildpacks maintainers have to explicitly set its value to the separator used for the platform(s) they are targeting.

Changing that empty default value would simplify buildpack creation and maintenance because most of the time, appending or prepending a value requires a non empty delimiter.

As expected outcome, this will simplify the code of the buildpack and its content. Essentially removing the need for the `<env-var>.delimiter` file creation and its presence.

# What it is
[what-it-is]: #what-it-is

### Define the target persona:

Buildpack author, project contributor.

### Explaining the feature largely in terms of examples


### Migration

1) If the delimiter in use is the platform delimiter, remove the code that generates `<env-var>.delimiter`
2) If the delimiter in use is empty, add code to create an empty `<env-var>.delimiter` file

### Describe the differences between teaching this to existing authors and new authors.

For existing authors, they can drop the code handling the delimiter file creation if using the platform delimiter.

For new authors, the default new behaviour should be the expected beahaviour so there shouldn't be anything special to be done.

# How it Works
[how-it-works]: #how-it-works

The current default value should be changed to use the default platform separator.

# Migration
[migration]: #migration

As described above, only buildpacks authors that rely on an empty strings will have to take actions (i.e. create an empty `<env-var>.delimiter` file. Others can either keep the status, or cleanup their buildpack code.

# Drawbacks
[drawbacks]: #drawbacks

Currently, the benefits of simplifying the creation and maintenance of buildpacks outweighs the breakage of a small number of them.

# Alternatives
[alternatives]: #alternatives

N/A

# Prior Art
[prior-art]: #prior-art

N/A

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

N/A

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

- New default value of delimiter which was previously an empty string.

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