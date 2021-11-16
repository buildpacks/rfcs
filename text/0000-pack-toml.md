# Meta
[meta]: #meta
- Name: Support for `pack.toml`
- Start Date: 2021-11-16
- Author(s): [jkutner](http://github.com/jkutner)
- Status: Draft
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This is a proposal for a `pack.toml` file that is a special case of the `project.toml` descriptor file. The `pack.toml` will include configuration options specific to the Pack CLI, which may not be honored by other platforms.

# Definitions
[definitions]: #definitions

- *project descriptor* - a extension spec defining the [`project.toml`](https://github.com/buildpacks/spec/blob/main/extensions/project-descriptor.md) file.


# Motivation
[motivation]: #motivation

The `project.toml` file has been a useful and essential tool for buildpack users who need to codify certain arguments of their builds. However, there has been much debate around how to handle configuration options that may not be supported by all platforms.

We desire a descriptor file that is:
* specific to pack (i.e. not platform-neutral)
* advertises that the repo containing the file can be built with pack
* adheres to the best practices and learnings from [`project.toml`](https://github.com/buildpacks/spec/blob/main/extensions/project-descriptor.md)

# What it is
[what-it-is]: #what-it-is

The Pack CLI will support a new descriptor file, `pack.toml`, that is a superset of the project descriptor.
* An app MAY have a `pack.toml`
* An app MAY have a `project.toml`
* An app MAY have both a `pack.toml` and a `projec.toml`, in which case they will be merged.

The `pack.toml` will support an additional `[io.buildpacks.pack]` table that is NOT defined in the [project descriptor spec](https://github.com/buildpacks/spec/blob/main/extensions/project-descriptor.md). The `[io.buildpacks.pack]` table will have the following schema:

```toml
[io.buildpacks.pack]
builder = "<string (optional)>"
```

Where:

* `builder` is a uri to a CNB Builder docker image

## Example

```
[io.buildpacks.build]
exclude = ["/README.md"]

[[io.buildpacks.group]]
id = "example/java"
version = "1.0.0"

[io.buildpacks.pack]
builder = "example/my-builder-image"
```

# How it Works
[how-it-works]: #how-it-works

The Pack CLI will honor both the `pack.toml` and `project.toml` file descriptors with the following rules:

* If one or more descriptors are provided on the command line they will all be merged and used.
* If a `pack.toml` file exists in the workspace and no descriptors are provided on the command line, it will be used.
* If a `project.toml` file exists in the workspace and no descriptors are provided on the command line, it will be merged with any `pack.toml` that is present in the workspace and the result will be used.
* Else no project descriptor will be used

When multiple descriptors are _merged_ the following precedence is given:

* Configuration in a file provided on the command line will take precedence over files provided on the command line after it.
* Configuration in a `pack.toml` will take precedence over configuration in a `project.toml`

# Drawbacks
[drawbacks]: #drawbacks

* Using a `pack.toml` and `project.toml` descriptor together in a `pack` build may be confusing. The rules of merging two files may not be obvious.

# Alternatives
[alternatives]: #alternatives

## Support `pack.toml` as a subset of `project.toml`

* If a path to a `pack.toml` is provided on the command line it will be used.
* Else if a `pack.toml` file exists in the workspace, it will be used.
* Else no project descriptor will be used

At the same time:

* If a path to a `project.toml` is provided on the command line it will be used.
* Else if a `project.toml` file exists in the workspace, it will be used.
* Else no project descriptor will be used

## Support `pack.toml` and `project.toml` as mutually exclusive descriptors

* If a descriptor is provided on the command line it will be used.
* Else If a `pack.toml` file exists in the workspace, it will be used. Only configuration in the `[io.buildpacks]` table and sub-tables will be honored. The root `[_]` will be optional.
* Else if a `project.toml` file exists in the workspace, it will be used. Any configuration in the `[io.buildpacks.pack]` table will be ignored.
* Else no project descriptor will be used

# Prior Art
[prior-art]: #prior-art

## Terraform Manifests

A repository may contain multiple [Terraform](https://www.terraform.io/) manifest, in which case the resources in those files will be merge into a single plan.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

N/A

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

N/A
