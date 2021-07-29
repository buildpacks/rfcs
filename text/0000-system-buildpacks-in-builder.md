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

This is a proposal for a mechanism that would allow a builder to contain a default set of buildpacks that run on every build, independent of which buildpack group passes detection.

# Definitions
[definitions]: #definitions

* _system buildpacks_ - a standard buildpack, conforming to the Buildpack API, but which runs outside of normal groups

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
  optional = false

[[system.post.buildpacks]]
  id = "<buildpack ID>"
  version = "<buildpack version>"
  optional = false
```

The fields in the `system.pre.buildpacks` table and `system.post.buildpacks` table match the fields in the existing [`order.group` table](https://buildpacks.io/docs/reference/config/builder-config/#order-_list-required_).

When a builder includes one or more `system.*.buildpacks` entry, each build phase that uses the builder will run the `pre` buildpacks before ALL other buildpacks (whether they are defined by a default `order.group` or if they are provided as an explicit order to the lifecycle) and the `post` buildpack after ALL other buildpacks.

# How it Works
[how-it-works]: #how-it-works

Unless otherwise stated, system buildpacks conform to the [buildpack API](https://github.com/buildpacks/spec/blob/main/buildpack.md).

The `system.pre.buildpacks` will be transformed into a new table in `order.toml`. The `[system]` table in `order.toml` will be processed by the lifecycle, and each `pre`/`post` buildpack will run during the detect phase. Those that pass detection will run during the build phase.

## Detection

The results of detection by system buildpacks MUST NOT influence the selected buildpack group. If no system buildpacks pass detection, any buildpack group MAY pass detection. If a system buildpack pass detection and no buildpack groups pass detection, then detection MUST fail.

System buildpacks may require/provide in the build plan following standard buildpack API specification.

A new flag to the lifecycle `detector`, `--disable-system-buildpacks`, will disable system buildpacks

## Build

System buildpacks that have passed detection will be executed during the build phase. All `pre` buildpacks must execute before the detected buildpack group. All `post` buildpacks must execute after the detected buildpack group. However, the system buildpacks MUST NOT be added to the buildpack group, and their execution may be hidden from the end user.

If a system buildpack exits with a status of `100`, the build will fail.

A new flag to the lifecycle `builder`, `--disable-system-buildpacks`, will disable system buildpacks

# Drawbacks
[drawbacks]: #drawbacks

- Default buildpacks are essentially hidden from the user and may be unexpected.

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
- Should the system buildpacks output to stdout/stderr and should that be displayed?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

## `detector` in Platform specifiction

This proposal introduces a `--disable-system-buildpacks` flag on the `detector`.

```
/cnb/lifecycle/detector \
  [--disable-system-buildpacks] \
```

## `builder` in Platform specifiction

This proposal introduces a `--disable-system-buildpacks` flag on the `builder`.

```
/cnb/lifecycle/builder \
  [--disable-system-buildpacks] \
```

## `[[order.toml]]` in Platform specifiction

This proposal requires changes to the [`order.toml` schema](https://github.com/buildpacks/spec/blob/main/platform.md#ordertoml-toml).

```
[[system.pre.buildpacks]]
  id = "<buildpack ID>"
  version = "<buildpack version>"
  optional = false

[[system.post.buildpacks]]
  id = "<buildpack ID>"
  version = "<buildpack version>"
  optional = false
```

Where:
* Both `id` and `version` MUST be present for each buildpack object in a group.
* The value of `optional` MUST default to false if not specified.


