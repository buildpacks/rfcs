# Meta
[meta]: #meta
- Name: API Versions
- Start Date: 2019-08-05
- Status: Implemented
- CNB Pull Request: [rfcs#19](https://github.com/buildpacks/rfcs/pull/19), [pack#282](https://github.com/buildpacks/pack/pull/282)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

Begin versioning the various APIs that the spec describes. Then require these versions be specified in related TOML files, under an `api` field.

# Motivation
[motivation]: #motivation

To enable logic and/or validation based on `api`. For instance, we could keep users from attempting to use a combination of incompatible buildpacks and lifecycle.

# What it is
[what-it-is]: #what-it-is

There would be two pieces to this:

1. A reference to the current versions of all APIs placed in the spec. Currently, we would version the Buildpack API (buildpack-to-lifecycle contract) and the Platform API (lifecycle-to-platform contract).
2. An `api` field in TOML files for entities that are dependent on a specific version of an API. For instance, `buildpack.toml` would have an `api` to represent the version of the buildpack API to which the buildpack conforms.

Example `api` field for `buildpack.toml`:

```toml
api = "<major>.<minor>"

[buildpack]
id = "<string>"
# ...
```

The format of a version would be `<major>.<minor>` or `<major>` (with a `minor` of `0` implied). A change to the `major` version of an API would indicate a non-backwards-compatible change, while a change to the `minor` version would indicate availability of one or more opt-in features.

A **missing or empty** `api` key would indicate `1.0` (the current version of the Buildpack API and Platform API, as of this writing). The next breaking change to either of the current APIs would bump that API version to `2.0`.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Where in the spec should we document current API versions?
- What about files that are not spec'd, but rather are related to the `pack` implementation (e.g. `builder.toml`)?
- Will it be confusing that the spec is already titled "Buildpack API v3 - Specification", while the Buildpack API version to be documented inside of it references only a subset of the spec (which begins at `1.0`, not `3.0`)?

# Related RFCs
[related-rfcs]: #related-rfcs
[RFC: Lifecycle descriptor](https://github.com/buildpacks/rfcs/pull/20)
