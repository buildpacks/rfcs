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

* __CNB_PLATFORM_API__ The Project TOML Converter will use the `CNB_PLATFORM_API` environment variable to decide the target schema. The `CNB_PLATFORM_API` environment variable is set by the platform in the lifecycle's execution environment. Version 0.3 is assumed if it is not set.

# Motivation
[motivation]: #motivation

- This feature has similarities with the "prepare" phase that has been discussed previously (see #555). But it is much smaller in scope. Potentially, the binary described in this RFC could eventually take on more responsibilities and look more like "prepare". But that is out of scope for this RFC.

- Project Descriptor (aka project.toml) is a file which describes behavior related to buildpacks. It is non-trivial for platform operators to upgrade support for different versions of project.toml. So with this feature we are giving to developers the ability to use any version of project.toml knowing that the platform can always support it. At the same time we are giving to operators the convenience of only having to know about one schema at a time for project.toml.

- What is the expected outcome?

# What it is
[what-it-is]: #what-it-is

The Project TOML Converter is a CLI tool that will ship alongside the lifecycle. It has only one responsibility at this time, to support conversion between schemas.

# How it Works
[how-it-works]: #how-it-works

Example Project.TOML
```
[project]
id = "<string>" # machine readable
name = "<string>" # human readable
version = "<string>"
authors = ["<string>"]
documentation-url = "<url>"
source-url = "<url>"

[[project.licenses]]
type = "<string>"
uri = "<uri>"

[build]
include = ["<string>"]
exclude = ["<string>"]
[[build.buildpacks]]
id = "<string>"
version = "<string>"
uri = "<string>"
[[build.env]]
name = "<string>"
value = "<string>"
[metadata]
# additional arbitrary keys allowed
```

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

- Another binary to maintain

# Alternatives
[alternatives]: #alternatives

- Having the lifecycle process project.toml directly (like prepare phase see: #555). This RFC is only focusing on the upgrade problem so that it can be done quickly.
- Do nothing, hope everything will be fine (we can leave as it is). We think it's too hard for platform operators to support multiple versions of project.toml.
- Having the translator binary translate from e.g., project.toml schema 0.1 -> project.toml schema 0.2. The platform API already represents the contract between the lifecycle and the platform, so it makes more sense than "project descriptor schema -> project descriptor schema" translation.. 

# Prior Art
[prior-art]: #prior-art 

Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What will the platform schema for project.toml look like?
- Out of scope: parts of project.toml that aren't relevant to the platform api (like setting env vars)

# Spec. Changes (OPTIONAL)
The new platform schema could look something like:
```
[project]
id = "<string>"
version = "<string>"

[build]
builder = "cnbs/sample-builder:bionic"
include = ["<string>"]
exclude = ["<string>"]

[[build.buildpacks]]
id = "io.buildpacks/java"
version = "1.0"

[metadata]
# all metadatas here
```

*Here is the namespace conversions*

For conversion to/from v0.1
```
project = project
build = build
build.buildpacks = build.buildpacks
metadata = metadata
```

For conversion to/from v0.2:

```
project = _
build = io.buildpacks
build.buildpacks = io.buildpacks.group
metadata = _.metadata
```