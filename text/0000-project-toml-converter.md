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

- This feature has similarities with the "prepare" phase that has been discussed previously (see #555). But it is much smaller in scope. Potentially, the binary described in this RFC could eventually take on more responsibilities and look more like "prepare". But that is out of scope for this RFC. If the binary were to eventually take on more responsibility, all of its functions should be easily turned on and off, so that platform operators could choose which functionality to expose to users.  

- Project Descriptor (aka project.toml) is a file which describes behavior related to buildpacks. It is non-trivial for platform operators to upgrade support for different versions of project.toml. So with this feature we are giving to developers the ability to use any version of project.toml knowing that the platform can always support it. At the same time we are giving to operators the convenience of only having to know about one schema at a time for project.toml.

- What is the expected outcome?

# What it is
[what-it-is]: #what-it-is

The Project TOML Converter is a CLI tool that will ship alongside the lifecycle. It has only one responsibility at this time, to support conversion between schemas. The tool will not need to be executed in a containerized environment (similar to `rebase`). Though it can be invoked as a separate binary it may end up being part of the lifecycle which itself is a multi-call binary (see https://github.com/buildpacks/rfcs/blob/main/text/0024-lifecycle-multicall-binary-for-build.md). 

# How it Works
[how-it-works]: #how-it-works

Example Project.TOML with 0.1 schema
```
[project]
id = "io.buildpacks.my-app" # machine readable
name = "my app" # human readable
version = "1.2.3"
authors = ["Great Developer"]
documentation-url = "my-site.com/docs"
source-url = "my-site.com/source"

[[project.licenses]]
type = "some-license-type"
uri = "my-site.com/license"


[build]
include = [
    "cmd/",
    "go.mod",
    "go.sum",
    "*.go"
]
exclude = ["secrets.yaml"]

[[build.buildpacks]]
id = "io.buildpacks/java"
version = "1.0"
uri = "myreg.io/myspace/java"

[[build.buildpacks]]
id = "example/post-build"

    [build.buildpacks.script] # does this make sense?
    api = "0.5"
    inline = "./post-build.sh"

[[build.env]]
name = "SOME_VAR"
value = "some-val"


[metadata]
cdn = "https://cdn.example.com"
```


Example Project.TOML with 0.2 schema
```
[_]
schema-version = "0.2"
id = "io.buildpacks.my-app"
name = "my app"
version = "1.2.3"
authors = ["Great Developer"]
documentation-url = "my-site.com/docs"
source-url = "my-site.com/source"

[[_.licenses]]
type = "some-license-type"
uri = "my-site.com/license"

[_.metadata]
cdn = "https://cdn.example.com"


[io.buildpacks]
builder = "myreg.io/myspace/builder"
include = [
    "cmd/",
    "go.mod",
    "go.sum",
    "*.go"
]
exclude = ["secrets.yaml"]

[[io.buildpacks.group]]
id = "io.buildpacks/java"
version = "1.0"
uri = "myreg.io/myspace/java"

[[io.buildpacks.group]]
id = "example/post-build"
  
    [io.buildpacks.group.script]
    api = "0.5"
    inline = "./post-build.sh"

[[io.buildpacks.build.env]]
name = "SOME_VAR"
value = "some-val"


[com.fun-company]
name = "I am missing in the 0.1 schema version"
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

*Here are the namespace conversions*

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