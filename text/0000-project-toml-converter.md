# Meta
[meta]: #meta
- Name: Project TOML Converter
- Start Date: 10 Aug 2021
- Author(s): haliliceylan, natalieparellano
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

The idea is to ship a binary with the lifecycle that would be responsible for translating project.toml from the schema defined in the project descriptor extension spec into something that the lifecycle knows the platform can understand i.e., a schema defined in the platform spec.

# Definitions
[definitions]: #definitions

* __project descriptor__ - a file that is included in the application directory to configure various behavior related to buildpacks; for more information, see the [`project.toml`](https://github.com/buildpacks/spec/blob/main/extensions/project-descriptor.md) extension specification

* __CNB_PLATFORM_API__ The Project TOML Converter will use the `CNB_PLATFORM_API` environment variable to decide which API to implement. For now, if `CNB_PLATFORM_API` is not supplied, platform API 0.3 (the currently implemented API) will be assumed, to avoid breaking existing platforms that do not currently set this environment variable.

# Motivation
[motivation]: #motivation

- This feature has similarities with the "prepare" phase that has been discussed previously (see #555). But it is much smaller in scope. Potentially, the binary described in this RFC could eventually take on more responsibilities and look more like "prepare". But that is out of scope for this RFC.

- It is non-trivial for platform operators to upgrade support for different versions of project.toml. Project Descriptor is a file which describe behavior related to buildpacks. Platform operators need to give these behaviors according to developer app requests. So with this feature we are giving to developers the ability to use any version of project.toml knowing that the platform can always support it. At the same time we are giving to operators the convenience of only having to know about one schema at a time for project.toml.

- What is the expected outcome?

# What it is
[what-it-is]: #what-it-is

The Project TOML Converter is a CLI tool that will ship alongside the lifecycle. It has only one responsibility at this time, to support conversion between schemas.

# How it Works
[how-it-works]: #how-it-works

Example Project.TOML
```
[project]
id = "io.buildpacks.my-app"
version = "0.1"

[build]
include = [
    "cmd/",
    "go.mod",
    "go.sum",
    "*.go"
]

[[build.buildpacks]]
id = "io.buildpacks/java"
version = "1.0"

[[build.buildpacks]]
id = "io.buildpacks/nodejs"
version = "1.0"

[metadata]
foo = "bar"

[metadata.fizz]
buzz = ["a", "b", "c"]
```
TODO: Which keys are platform specific ? idk maybe metadata or buildpacks order. 

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

# Alternatives
[alternatives]: #alternatives

- having the lifecycle process project.toml directly (like prepare phase see: #555). Prepare is not only for this problem, is kinda big and have a lot of responsibility. This RFC Topic is only focusing this problem so can be done quick and well tested.
- do nothing, hope everything will be fine (We can leave as it is). We think it's too hard for platform operators to support multiple versions of project.toml. The platform API already represents the contract between the lifecycle and the platform, so it makes more sense than "project descriptor schema -> project descriptor schema" translation.
- having the translator binary translate from e.g., project.toml schema 0.1 -> project.toml schema 0.2 (actually this RFC). 

# Prior Art
[prior-art]: #prior-art 

Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What will the platform schema for project.toml look like?
- Out of scope: parts of project.toml that aren't relevant to the platform api (like setting env vars)

# Spec. Changes (OPTIONAL)
new platform schema look ?
