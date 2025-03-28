# Meta
[meta]: #meta
- Name: Application source files mtime
- Start Date: 2025-03-28
- Author(s): Infra-Red
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: "N/A"

# Summary
[summary]: #summary

Currently, the modification time (mtime) of application source files within images created by Cloud Native Buildpacks is hard-coded to January 1, 1980. This behavior results in web caching issues because the `Last-Modified` HTTP header is always set to `Tue, 01 Jan 1980 00:00:01 GMT`. This RFC proposes adding options to either preserve the original modification time (mtime) of source files or set it based on the value provided in the `SOURCE_DATE_EPOCH` environment variable.

# Definitions
[definitions]: #definitions

mtime - modified timestamp (mtime) indicates the last time the contents of a file were modified. For example, if new contents were added, deleted, or replaced in a file, the modified timestamp is changed.

# Motivation
[motivation]: #motivation

### Why should we do this?

This feature has been requested by the community (https://github.com/buildpacks/lifecycle/issues/1358), and the issue was demonstrated in the [matthewrobertson/bp-mtime-issue](https://github.com/matthewrobertson/bp-mtime-issue) repository.

### What use cases does it support?

This is important for the users who serve static content from their applications as they want to make sure that clients are always getting updated content.

### What is the expected outcome?

Lifecycle will be capable of copying the source files into the application image with original mtime preserved or set to a user-provided value.

# What it is
[what-it-is]: #what-it-is

- Define the target persona: buildpack user.
  - A buildpack user could pass a flag or set an environment variable to stop resetting mtime value.

# How it Works
[how-it-works]: #how-it-works

The [layer writer](https://github.com/buildpacks/lifecycle/blob/c895ed40025a70f3de5a197f111c7d27687e1d80/layers/writer.go#L34) would check for a user-provided option. If no option is provided, the default behaviour of normalizing mtimes would be used for existing users.

# Migration
[migration]: #migration

N/A

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

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