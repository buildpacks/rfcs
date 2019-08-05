# Meta
[meta]: #meta
- Name: API Versions
- Start Date: 2019-08-05
- CNB Pull Request: (leave blank)
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

1. A reference to the current versions of all APIs placed somewhere in the spec (location within spec TBA). For instance, a Buildpack API and a Platform API.
2. An `api` field in TOML files for entities that are dependent on a specific version of an API. For instance, `buildpack.toml` would have an `api` to represent the version of the buildpack API to which the buildpack conforms.

Example `api` field for `buildpack.toml`:

```toml
api = "<version>"

[buildpack]
id = "<string>"
# ...
```

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Given the current state of the project, what would we deem to be the first "APIs?" Potentially there are two to begin with: a Buildpack API and a Platform API, but more may be warranted in the future.
- What format should the version take? Integer? Semver?
- Given the answer to the above, what version should we begin with for each API?
- What about files that are not spec'd, but rather are related to the `pack` implementation (e.g. `builder.toml`)?