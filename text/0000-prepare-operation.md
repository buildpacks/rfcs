# Meta
[meta]: #meta
- Name: Prepare Operation
- Start Date: 2022-02-07
- Author(s): @jromero
- Status: Draft
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

It is common for platform to execute common operations before executing the lifecycle. These sort of operations include, downloading buildpacks, making changes the the `order.toml`, cleaning up the workspace, and more. These operations are typically influenced by configuration. One of those common configuration inputs is the `project.toml` (aka Project Descriptor). This RFC, proposes a contractual interface for a Prepare operation that is executed before the Build operation. The benefits for doing so are it enables common functionality to be made portable. Additionally, it allows the project to provide guidance on what the expected behaviour is regarding input configuration such as the `project.toml`.

# Definitions
[definitions]: #definitions

- namespace - A table within `project.toml` that encompasses a set of properties.
- Prepare operation - a new operation that occurs before the Build operation.
- `project.toml` - A project descriptor file specified [here][project-descriptor-spec].

[project-descriptor-spec]: https://github.com/buildpacks/spec/blob/main/extensions/project-descriptor.md

# Motivation
[motivation]: #motivation

The motiviation for this change was to enable the following goals from being achieved:

  - **Goal 1: Serializing CLI configuration**
    > As a user, I would like to be able to serialize and share the parameters I use with certain platforms such as `pack`.
  - **Goal 2: A recognizable file in repositories**
    > As a user, I would like to be able to recognize, based on the file system, if a project is using Cloud Native Buildpacks.
  - **Goal 3: Platform recognition of project.toml**
    > As a user, I would like to ensure that my configuration in `project.toml` is being used.

**This RFC directly solves for Goal 3**, while enabling the solutions for Goals 1 and 2 via a supplimental RFC ([Support for pack.toml][rfc-pr-189]).

[rfc-pr-189]: https://github.com/buildpacks/rfcs/pull/189

# What it is
[what-it-is]: #what-it-is

The proposal is composed of following changes:

- [Changes to `io.buildpacks` namespace.](#changes-to-iobuildpacks-namespace)
  - [Define criteria for properties in namespace.](#criteria-for-properties)
  - [Version `io.buildpacks` namespace.](#version-iobuildpacks-namespace)
- [A replaceable new phase `prepare` that applies platform configuration.](#prepare-phase)
- [Supporting Cloud Native Buildpack utilities.](#cloud-native-buildpacks-utilities)

## Changes to `io.buildpacks` namespace

### Criteria for properties

This namespace declares default values that platforms should acknowledge. A majority of properties should be spec'd but we would allow for unspec'd additional properties.

The criteria for spec'd properties in this namespace would be based on whether they affect inputs to the lifecycle phases. For example, the order and environment variables are inputs to the lifecycle. The `builder`, in contrast, is not an input to the lifecycle so it wouldn't meet the criteria.

Therefore the following changes have been made from the [latest schema][pd-02]:

 - **Remove `builder` from `io.buildpacks` namespace**

[pd-02]: https://github.com/buildpacks/spec/blob/extensions/project-descriptor/0.2/extensions/project-descriptor.md#iobuildpacks-optional

### Version `io.buildpacks` namespace

The `io.buildpacks` namespace schema should be able to change without changing the Project Descriptor spec. For this reason, the namespace should define a `schema-version`.

### Schema

See [`io.buildpacks` Namespace Schema](#io-buildpacks-Namespace-Schema) section below.

#### Usages Examples

###### Multi-Platform (pack + kpack)

In the following example we show how various platform namespaces can have their own configuration but properties can be promoted to `io.buildpacks` if the user's intent is to apply it to all platforms.

```toml
[io.buildpacks]
schema-version = "0.2"

###
# common buildpacks config
##

[io.buildpacks]
exclude = ["some-files/**"]

##
# pack config
##

[io.buildpacks.pack]
schema-version = "0.1"
builder = "cnbs/sample-builder:bionic"
cache-volume = "my-app-cache"           # (example only)

##
# kpack config
##

[com.vmware.kpack]
schema-version = "0.1"

[[com.vmware.kpack.build.env]]
name="CUSTOM_ENV"
value="SOME_VALUE"
```

Notice:

1. Both `pack` and `kpack` are expected to apply `io.buildpacks.exclude`.
2. `io.buildpacks.pack` has additional properties that are specific to `pack` only.

## Prepare phase

A `prepare` phase would be a new lifecycle phase that gets executed before `create` or `detect` phase. Similar to the `rebaser`, it is outside of the standard [Build operation][build-operation].

[build-operation]: https://github.com/buildpacks/spec/blob/main/platform.md#build

#### Responsibilities

At minimum, the expected reponsibility of the `preparer` would be to:

 - Apply the requested configuration.

#### Inputs

The `prepare` phase would take all the same inputs as `creator` plus the addition of a path to `project.toml`.

#### Outputs

The `prepare` phase may affect the file system, and mutation or create files that would be consumed be futher phases.

## Cloud Native Buildpacks utilities

The Cloud Native Buildpacks project will provide the following functionality in the form of utilities:

###### `go` prepare function

A function that can help developers apply configuration to the filesystem based on a provided configuration. 

> This would be useful for builder providers or platform implementers that choose to provide their own [`preparer` executable](#preparer-executable).

###### `preparer` executable

The Cloud Native Buildpacks project will have a `preparer` it ships along with the existing `lifecyle` image.

> This would be useful for builder providers or platform implementers to not have to develop standard functionality.

The default implementation COULD take care of applying the following configuration:

- `io.buildpacks.group` →
    - Download buildpacks
    - Update `order.toml`
- `io.buildpacks.build.env` →
    - Set build env vars in `<platform>/env`
- Notify users of any other properties in `io.buildpacks`

# Drawbacks
[drawbacks]: #drawbacks

1. Parsing and applying the `io.buildpacks` namespace becomes responsibility of the platform.
    - This is mitigated by providing [utilities](#Cloud-Native-Buildpacks-utilities) and the fact that the prepare phase is an independant and swappable.
2. Executing the Prepare operation may require an additional container to be spun up in some platforms; this would effectively increase the overall build process.

# Alternatives
[alternatives]: #alternatives

#### [Converter RFC][converter-rfc]

> The idea is to ship a binary with the lifecycle that would be responsible for translating project.toml from the schema defined in the project descriptor extension spec into something that the lifecycle knows the platform can understand i.e., a schema defined in the platform spec.

- Benefits
    - Converting various possible user provided schemas to a platform API schema makes it easier for platforms to consume the configuration.
        - Counter-point: The "ease" of consumption could be provided by other means such as language-specific libraries that ease parsing to general models.
- Drawbacks
    - Having a converter instead of an entire swappable prepare phase means that the process of applying configuration becomes a 2-step process for platforms.

[converter-rfc]: https://github.com/buildpacks/rfcs/pull/182

#### Project Descriptor Buildpack

The idea of a buildpack that can apply configuration from `project.toml` has been kicked around and would work for _some_ properties such as environment variables.

- Benefits
    - Buildpacks are more robust. Updated versions can be used to apply the later versions of project descriptor with no platform operator/implementer intervention.
- Drawbacks
    - Not all operations may be applied at the buildpack level. For example, buildpack order. There would need to be a higher-order operation to apply other parts of the configuration. Given a higher-order operation, it doesn't make sense to split the application of the configuration.

# Prior Art
[prior-art]: #prior-art

- [rebase][rebase] - Another "out-of-build" operation.


[rebase]: https://github.com/buildpacks/spec/blob/main/platform.md#rebase

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should arbitrary properties be allowed in `io.buildpacks`?
- How does the Prepare operation make changes to non-filesystem options such as `tags`, `run-image`, etc?
    - Ideally, the lifecycle would have a filesystem based interface that we can leverage. This would prevent the preparer from having it's own independant mechanism. A prior RFC for something similar has existed (see [Add Lifecycle Config File RFC][lifecycle-config-rfc]). It may be worth revisiting.
- Where do we define the `io.buildpacks` namespace if we want to keep it seperate from the Project Descriptor Spec?
    - We've been wanting to restructure our spec repo to include other schemas, in JSON format, as well. Maybe this is an opportunity to rethink our repo structure.

[lifecycle-config-rfc]: https://github.com/buildpacks/rfcs/pull/128

# Spec. Changes
[spec-changes]: #spec-changes

## Distribution Spec

No changes necessary.

## Platform Spec

### Add Project Descriptor

---

#### `project.toml` (TOML)

The format of `project.toml` MUST adhere to version `0.2` of the [project descriptor specification][project-descriptor-spec]. Within the `project.toml` file the `io.buildpacks` namespace MAY be defined.

[project-descriptor-spec]: https://github.com/buildpacks/spec/blob/main/extensions/project-descriptor.md

---

### Add Prepare operation

---

#### Prepare

Before the [Build](#Build) operation is executed, a platform MUST prepare the build environment.

During, the Prepare phase, the platform:

  - SHOULD apply provided [Project Descriptor][project-descriptor] configuration is present.
      - SHOULD generate a warning for any `io.buildpacks` property not applied.
  - MAY make changes to any path in the filesystem.

[project-descriptor]: https://github.com/buildpacks/spec/blob/main/extensions/project-descriptor.md

---


### Add `prepare` section

---

#### `preparer`

Usage:
```
/cnb/lifecycle/preparer \
  [-app <app>] \
  [-buildpacks <buildpacks>] \
  [-cache-dir <cache-dir>] \
  [-cache-image <cache-image>] \
  [-daemon] \
  [-gid <gid>] \
  [-launch-cache <launch-cache> ] \
  [-launcher <launcher> ] \
  [-layers <layers>] \
  [-log-level <log-level>] \
  [-order <order>] \
  [-platform <platform>] \
  [-previous-image <previous-image> ] \
  [-process-type <process-type> ] \
  [-project-descriptor <project-descriptor> ] \
  [-project-metadata <project-metadata> ] \
  [-report <report> ] \
  [-run-image <run-image>] \
  [-skip-restore <skip-restore>] \
  [-stack <stack>] \
  [-tag <tag>...] \
  [-uid <uid> ] \
  <image>
```

The `preparer` SHOULD accept the same inputs as the `creator` with the addition of the following:

| Input             | Environment Variable| Default Value| Description
|-------------------|---------------------|--------------|----------------------
| `<project-descriptor>`| `CNB_PROJECT_DESCRIPTOR_PATH`| `<app>/project.toml`    | Path to a [Project Descriptor](#projecttoml-TOML)

##### Outputs

A `preparer` may make general changes to the file system, modify input files, or create input files.

| Exit Code       | Result
|---              |---
| `0`             | Success
| `1-10`, `13-19` | Generic lifecycle errors

<!-- </details> -->

---

## Project Descriptor Spec

#### Remove `io.buildpacks` namespace

We'll want to remove the `io.buildpacks` namespace since it will be versioned seperate from the project descriptor.

---

## `io.buildpacks` Namespace Schema

> NOTE: This is expected to live in a seperate file.

---

##### `io.buildpacks` namespace

```toml
[io.buildpacks]
schema-version = "0.2"

[io.buildpacks]
include = ["<.gitignore pattern>"]
exclude = ["<.gitignore pattern>"]

[[io.buildpacks.pre.group]]
id = "<buildpack ID>"
version = "<buildpack version>"
uri = "<url or path to the buildpack"

  [io.buildpacks.pre.group.script]
  api = "<buildpack API version>"
  shell = "<string>"
  inline = "<script contents>"

[[io.buildpacks.group]]
id = "<buildpack ID>"
version = "<buildpack version>"
uri = "<url or path to the buildpack"

  [io.buildpacks.group.script]
  api = "<buildpack API version>"
  shell = "<string>"
  inline = "<script contents>"

[[io.buildpacks.post.group]]
id = "<buildpack ID>"
version = "<buildpack version>"
uri = "<url or path to the buildpack"

  [io.buildpacks.post.group.script]
  api = "<buildpack API version>"
  shell = "<string>"
  inline = "<script contents>"

[[io.buildpacks.build.env]]
name = "<name>"
value = "<value>"
```

Where:

 - `schema-version` (required): is the version of the schema.
 - `defaults` (optional): is a table of default properties that all platforms should apply.
    _`include` and `exclude` are mutually exclusive. If both are present the build process MUST result in an error._
     - `include` (optional): is an array of `.gitignore` pattern-based paths to include during the build operation.
     - `exclude` (optional): is an array of `.gitignore` pattern-based paths to exclude from the build operation and thereby produced image.
     - `group` (optional): is an array of buildpacks.
       _Either a `version`, `uri`, or `script` table MUST be included, but MUST NOT include any combination of these elements._
         - `id` (optional): is the ID of the buildpack.
         - `version` (optional, default=`latest`): is the version of the buildpack.
         - `uri` (optional, default=`urn:buildpack:<id>`): is the URI to the buildpack.
         - `script` (optional): defines an inline buildpack.
             - `api` (required): is the api key defines its Buildpack API compatibility.
             - `shell` (optional, default=`/bin/sh`): defines the shell used to execute the inline script.
             - `inline` (required): is the build script for the inline buildpack.
     - `build` (optional):
         - `env` (optional): an array table that defines environment variables to be applied during the `build` phase.
             - `name` (required): is the name of the environment variable.
             - `value` (required): is the value of the environment variable.

---