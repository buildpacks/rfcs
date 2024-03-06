# Meta
[meta]: #meta
- Name: Rebase by Image Digest Reference
- Start Date: 2022-12-08
- Author(s): [@joeybrown-sf](https://github.com/joeybrown-sf)
- Status: Implemented
- RFC Pull Request: [rfcs#262](https://github.com/buildpacks/rfcs/pull/262)
- CNB Pull Request: https://github.com/buildpacks/lifecycle/pull/985
- CNB Issue: [buildpacks/lifecycle#983](https://github.com/buildpacks/lifecycle/issues/983)
- Supersedes: N/A

# Summary
[summary]: #summary

Allow passing a digest reference as rebase target. 

# Definitions
[definitions]: #definitions

An **image reference** refers to either a **tag reference** or **digest reference**.

A **tag reference** refers to an identifier of form `<registry>/<repo>:<tag>` which locates an image manifest in an [OCI Distribution Specification](https://github.com/opencontainers/distribution-spec/blob/master/spec.md) compliant registry.

A **digest reference**  refers to a [content addressable](https://en.wikipedia.org/wiki/Content-addressable_storage) identifier of form `<registry>/<repo>@<digest>` which locates an image manifest in an [OCI Distribution Specification](https://github.com/opencontainers/distribution-spec/blob/master/spec.md) compliant registry.


# Motivation
[motivation]: #motivation

Enables rebasing by targeting an immutable image digest. There are some scenarios where the **digest reference** is preferred over **tag reference**.

# What it is
[what-it-is]: #what-it-is

This is a feature to expand the lifecycle rebase command to allow targeting an image by either `tag` or `digest`.

Today, `lifecycle` returns the following error when appempting to use a **digest reference**:
```
ERROR: failed to rebase: failed to write image to the following tags: [localhost:5003/foo/bar@sha256:916a9e100569ee521b86d03b8499b9b93d7d256d6e838868ae720295f2ea2f76: PUT http://localhost:5003/v2/foo/bar/manifests/sha256:916a9e100569ee521b86d03b8499b9b93d7d256d6e838868ae720295f2ea2f76: DIGEST_INVALID: provided digest did not match uploaded content]
```

This error could be avoided if digest references were permitted.

# How it Works
[how-it-works]: #how-it-works

Today, we can execute rebase by using **tag references** but not **digest references**.

Here are some examples of valid rebase commands. **Tag** is `latest` if not specified:

```
lifecycle rebase my-repo/foo
```
```
lifecycle rebase my-repo/foo:latest
```
```
lifecycle rebase my-repo/foo:v4
```

It is not currently possible to target an image using a **digest reference**.

_The proposed feature will provide a mechanism to target an image rebase by tag reference or digest reference._

Here is what targeting an image via digest will look like:
```
lifecycle rebase -previous-image my-repo/foo@sha256:1234 -tag my-repo/foo:rebase my-repo/foo
```

- When using a digest reference as the image target, the caller may specify zero or more `<tag references>` to apply to exported image. If no `tag` is provided, `latest` will be used.
- If `-previous-image` is not provided, it is infered from the first argument. This is similar behavior to `analyzer`, for instance.

# Migration
[migration]: #migration

This is backwards compatible.

# Drawbacks
[drawbacks]: #drawbacks

# Alternatives
[alternatives]: #alternatives

# Prior Art
[prior-art]: #prior-art

`pack` explicitly does not support this. There is a friendly validation message in `pack`:

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
