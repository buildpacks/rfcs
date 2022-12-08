# Meta
[meta]: #meta
- Name: Rebase by Image Digest Reference
- Start Date: 2022-12-08
- Author(s): [@joeybrown-sf](https://github.com/joeybrown-sf)
- Status: Draft
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This is a feature for the implementation team.

Allow passing a digest reference as rebase target. 

# Definitions
[definitions]: #definitions

An **image reference** refers to either a **tag reference** or **digest reference**.

A **tag reference** refers to an identifier of form `<registry>/<repo>:<tag>` which locates an image manifest in an [OCI Distribution Specification](https://github.com/opencontainers/distribution-spec/blob/master/spec.md) compliant registry.

A **digest reference**  refers to a [content addressable](https://en.wikipedia.org/wiki/Content-addressable_storage) identifier of form `<registry>/<repo>@<digest>` which locates an image manifest in an [OCI Distribution Specification](https://github.com/opencontainers/distribution-spec/blob/master/spec.md) compliant registry.


# Motivation
[motivation]: #motivation

- This feature will support a workflow where the rebase executing agent only has the digest available to it.

# What it is
[what-it-is]: #what-it-is

This is a feature to expand the lifecycle rebase command to allow targeting an image by either `tag` or `digest`.

Today, we get the following error when using a digest reference:
```
ERROR: failed to rebase: failed to write image to the following tags: [localhost:5003/foo/bar@sha256:916a9e100569ee521b86d03b8499b9b93d7d256d6e838868ae720295f2ea2f76: PUT http://localhost:5003/v2/foo/bar/manifests/sha256:916a9e100569ee521b86d03b8499b9b93d7d256d6e838868ae720295f2ea2f76: DIGEST_INVALID: provided digest did not match uploaded content]
```

# How it Works
[how-it-works]: #how-it-works

Today, we can execute rebase by using **tag references** but not **digest references**.

Here are some examples of valid rebase commands using **tag references**:
1. `lifecycle rebase my-repo/foo`
1. `lifecycle rebase my-repo/foo:latest`
1. `lifecycle rebase my-repo/foo:v4`

Here are some examples of currently invalid rebase commands using **digest references**:
1. `lifecycle rebase my-repo/foo@sha256:1234 myrepo/foo`
1. `lifecycle rebase my-repo/foo@sha256:1234 myrepo/foo:latest`
1. `lifecycle rebase my-repo/foo@sha256:1234 myrepo/foo:vNext`

Supporting Rebase by Image Digest Reference will make both sets of commands valid.

- When using a digest reference as the image target, there must be at least one tag reference to apply to exported image.
- If a `<tag reference>` is included without a `<tag>`, the tag `latest` will be used.

# Migration
[migration]: #migration

This is backwards compatible.

# Drawbacks
[drawbacks]: #drawbacks

# Alternatives
[alternatives]: #alternatives

# Prior Art
[prior-art]: #prior-art

`pack` explicitly does not support this. There is validation in `pack`:
`<rebase target> is not a tag reference`

# Unresolved Questions
[unresolved-questions]: #unresolved-questions


# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes


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