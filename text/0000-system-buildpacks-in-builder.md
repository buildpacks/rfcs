# Meta
[meta]: #meta
- Name: System Buildpacks in Builder Images
- Start Date: 2021-07-24
- Author(s): [@jkutner](https://github.com/jkutner)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This is a proposal for a mechanism that would allow a builder to contain a default set of buildpacks that participate in every detection group, regardless of the buildpack order passed by the platform.

# Definitions
[definitions]: #definitions

* _system buildpacks_ - a standard buildpack, conforming to the Buildpack API, which participate in all groups

# Motivation
[motivation]: #motivation

Forthcoming changes to the lifecycle (such as [removal of shell-specific logic](https://github.com/buildpacks/rfcs/pull/168)) will remove capabilities that users have come to expect. This includes mechanisms like `.profile`, which allows a buildpack user to customize the environment a process type runs in. We seek to replace these lost mechanisms with buildpacks, in an effort to preserve the capability while still removing complexity from the lifecycle.

# What it is
[what-it-is]: #what-it-is

We introduce a `[system]` table in the `builder.toml` schema with the following structure:

```
[[system.pre.buildpacks]]
  id = "<buildpack ID>"
  version = "<buildpack version>"
  optional = true

[[system.post.buildpacks]]
  id = "<buildpack ID>"
  version = "<buildpack version>"
  optional = true
```

The fields in the `system.pre.buildpacks` table and `system.post.buildpacks` table match the fields in the existing [`order.group` table](https://buildpacks.io/docs/reference/config/builder-config/#order-_list-required_). However, `optional` in this case is required and the only acceptable value is `true`. Non-optional buildpacks will cause the builder creation to fail.

When a builder includes one or more `system.*.buildpacks` entry, the detect phase will prepend and append all `pre` and `post` buildpacks to each detection group in the provided order, respectively.

# How it Works
[how-it-works]: #how-it-works

Unless otherwise stated, system buildpacks conform to the [buildpack API](https://github.com/buildpacks/spec/blob/main/buildpack.md).

The `system.pre.buildpacks` will be transformed into a new table in `order.toml`. The `[system]` table in `order.toml` will be processed by the lifecycle, and each `pre`/`post` buildpack will run during the detect phase. Those that pass detection will run during the build phase.

## Detection

The exit code of detection by system buildpacks MUST NOT influence the selected buildpack group. If no system buildpacks pass detection, any buildpack group MAY pass detection. If a system buildpack passes detection and no buildpack groups pass detection, then detection MUST fail.

System buildpacks may require/provide in the build plan following standard buildpack API specification.

A new flag to the lifecycle `detector`, `--disable-system-buildpacks`, will disable system buildpacks.

## Build

System buildpacks that have passed detection will be added to `group.toml` and treated like any other buildpack for the remainder of the build.

If a system buildpack exits with a status of `100`, the build will fail.

A new flag to the lifecycle `builder`, `--disable-system-buildpacks`, will disable system buildpacks.

# Drawbacks
[drawbacks]: #drawbacks

- Default system buildpacks are hidden from the user before the build and their execution may be unexpected.

# Alternatives
[alternatives]: #alternatives

## Do Nothing

End users would have to add buildpacks like the `profile-buildpack` or other buildpacks that implement system/spec behaviors themselves.

## Use the `[[order]]` table

Instead of a new `[system]` table, we could put `pre` and `post` in the `[[order]]` table. However, this could imply that there is a interaction/override/etc between these buildpacks and the `pre`/`post` buildpacks in `project.toml`. But there is not.

## Use the `[lifecycle]` table

```
[lifecycle]
  version = "<string>"

  [[lifecycle.pre.buildpacks]]
    id = "<buildpack ID>"
    version = "<buildpack version>"
    optional = false

  [[lifecycle.post.buildpacks]]
    id = "<buildpack ID>"
    version = "<buildpack version>"
    optional = false
```

# Prior Art
[prior-art]: #prior-art

- [RFC-0078: Group additions to Builder order](https://github.com/buildpacks/rfcs/blob/main/text/0078-group-additions.md)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should the system buildpacks that pass detection be added to the buildpack group? This might make it difficult to hide them.
    - disposition: yes. hiding is optional and up to the platform
- Should the system buildpacks output to stdout/stderr and should that be displayed?
    - disposition: it may be

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

## `detector` in Platform specifiction

This proposal introduces a `--pre-buildpacks` and `--post-buildpacks` option on the `detector`.

```
/cnb/lifecycle/detector \
  [--pre-buildpacks <group>]\
  [--post-buildpacks <group>]\
```

The lifecycle:

* SHALL merge the `<pre-buildpacks>` group with each group from `<order>` such that the `pre` buildpacks are placed at the beginning of each group before running detection.
* SHALL merge the `<post-buildpacks>` group with each group from `<order>` such that the `post` buildpacks are placed at the end of each group before running detection.


