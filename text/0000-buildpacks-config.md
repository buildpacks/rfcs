# Meta
[meta]: #meta
- Name: (fill in the feature name: My Feature)
- Start Date: (fill in today's date: YYYY-MM-DD)
- Author(s): (Github usernames)
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes:
    - [RFC#19](https://github.com/buildpacks/rfcs/blob/main/text/0019-project-descriptor.md)
    - [RFC#54](https://github.com/buildpacks/rfcs/blob/main/text/0054-project-descriptor-schema.md)
    - [RFC#54](https://github.com/buildpacks/rfcs/blob/main/text/0054-project-descriptor-schema.md)
    - [RFC#80](https://github.com/buildpacks/rfcs/blob/main/text/0080-builder-key-in-project-descriptor.md)
    - [RFC#84](https://github.com/buildpacks/rfcs/blob/main/text/0084-project-descriptor-domains.md)

# Summary
[summary]: #summary

A configuration file intended for end-users to influence how a buildpack build occurs.

# Definitions
[definitions]: #definitions

 - **Application API**: A new specification detail the contract and schema between the application, it's configuration, and the `lifecycle` components.
 - **Platform API**: Existing specification detailing contract between the `platform` and `lifecycle`.
 - **platform config**: A new file that provides a Platform API specific configuration to the platform from an Application API configuration.
 - **project.toml (Project Descriptor)**: An existing configuration file created by this project with higher asperations of configuring not just buildpacks but other tools and platforms. See "Supersedes" meta issues above.

# Motivation
[motivation]: #motivation

The current use of the _project descriptor_ has a few issues:

### Cross-Platform Support

The current specification treats the _project descriptor_ as an "extension" specification meaning that it may only be optionally supported by platforms to be compliant.

From a user's point-of-view, it's unexpected to have their application built one way locally via `pack` (which supports `project.toml`) and another way using another platform such as `Tekton` (which doesn't support `project.toml`) where both platforms natively support Cloud Native Buildpacks. See reported [issue][issue-tekton-33].

### Obscure

Due to the generic intent of `project.toml`, it is not inherently clear that a project is configured to be built by Cloud Native Buildpacks using a `project.toml`. Compare this to recognizing a platform or system specific configuration file such as `.github/`, `Dockerfile`, `travis.yml`, etc.

```text
.
├── .git/
├── .github/
├── src/
├── .gitignore
├── .gitpod.yml
├── README.md
├── codecov.yml
├── golangci.yaml
├── Dockerfile
└── project.toml
```

### Complex Syntax

In trying to support multiple use cases in a single file, the syntax become slightly more complex by the use of ["reverse domain namespacing"][reverse-domain-namespacing].

```toml
[_]
api = "0.2"
id = "<string>" # machine readable
name = "<string>" # human readable
version = "<string>"
authors = ["<string>"]
documentation-url = "<url>"
source-url = "<url>"

[[_.licenses]]
type = "<string>"
uri = "<uri>"

[io.buildpacks]
api = "0.1"

[io.buildpacks.build]
include = ["<string>"]
exclude = ["<string>"]

[[io.buildpacks.build.buildpacks]]
id = "<string>"
version = "<string>"
uri = "<string>"

[[io.buildpacks.build.env]]
name = "<string>"
value = "<string>"
```

[reverse-domain-namespacing]: https://github.com/buildpacks/rfcs/blob/main/text/0084-project-descriptor-domains.md
[issue-tekton-33]: https://github.com/buildpacks/tekton-integration/issues/33

# What it is
[what-it-is]: #what-it-is

The proposed solution to the issues listed in the [motivation](#motivation) is to create a **Cloud Native Buildpacks specific file** that **MUST be supported by platforms**.

## File

`buildpacks.<ext>` where `<ext>` corrolates to a supported format.

By using the term "buildpacks" in the file name, it becomes immediately apparent that this project has custom configuration for Cloud Native Buildpacks.

### Supported Formats

By supporting multiple file formats, we lower the barrier to entry and allow for the flexibility desired by some app developers.

Proposed supported extensions (in order of precedence):

 - `toml` => TOML
 - `yaml`, `yml` => YAML

#### TOML

```toml
schema="0.1"

[images]
names=[
    "cnbs/sample-app",
    "cnbs/sample-app:v1",
    "grc.io/cnbs/sample-app:v1"
]

[images.builder]
name="cnbs/sample:builder"
trusted=true

[images.previous]
name="cnbs/sample-app"

[images.run]
name = "cnbs/sample-stack-run:bionic"
mirrors = [
	"grc.io/cnbs/sample-stack-run:bionic",
]

[[env]] # build-time env vars
name="ENV_1"
value="ENV_2"
operation="append" # default=override

[[buildpacks]]
id = "samples/hello-world"
version = "0.0.1"

[[buildpacks]]
id = "samples/java-maven"
version = "0.0.1"

###
# Contents Configuration
###

[source]
workspace = "/workspace"
# exclude = [] # mutially exclusive with 'include'
include = [
    "cmd/",
    "go.mod",
    "go.sum",
    "*.go"
]

##
# Caching
# See https://github.com/buildpacks/rfcs/blob/main/text/0091-pack-cache-options.md
##

[cache]
format="image"
name="cnbs/sample-app-cache:build"

## Alternatives:
#
# [cache]
# format="volume"
# name=""
#
# [cache]
# format="bind"
# source="./cache"

###
# Process Specific Configuration
###

[process]
default = "web"

[[process.web.env]] # runtime env vars
name="PATH"
value="ENV_2"
operation="append" # default=override
```

#### YAML

```yaml
schema: "0.1"
images:
  names:
    - cnbs/sample-app
    - 'cnbs/sample-app:v1'
    - 'grc.io/cnbs/sample-app:v1'
  builder:
    name: 'cnbs/sample:builder'
    trusted: true
  previous:
    name: cnbs/sample-app
  run:
    name: 'cnbs/sample-stack-run:bionic'
    mirrors:
      - 'grc.io/cnbs/sample-stack-run:bionic'
env:
  - name: ENV_1
    value: ENV_2
    operation: append
buildpacks:
  - id: samples/hello-world
    version: 0.0.1
  - id: samples/java-maven
    version: 0.0.1
source:
  workspace: /workspace
  include:
    - cmd/
    - go.mod
    - go.sum
    - '*.go'
cache:
  format: image
  name: 'cnbs/sample-app-cache:build'
process:
  default: web
  web:
    env:
      - name: PATH
        value: ENV_2
        operation: append
```

# How it Works
[how-it-works]: #how-it-works

### Configuration Properties

To prevent unnecessary complexity for end-users (app developers), the `buildpacks.<ext>` file would only support properties associated with Cloud Native Buildpacks. See full list of properties in the [file](#file) section.

### Cross-Platform Support

Support for this configuration would be part of a _new_ specification (`Application API`). 

Building upon [RFC PR#182][rfc-pr-182], the `buildpacks.<ext>` file would be part of a contract between the `application` -> `converter` -> `platform`. Platforms will be required to support the `buildpacks.<ext>` files through changes to the `Platform API` and use of an intermediate file named _platform config_ (`platform.toml`). The `platform.toml` will be a Platform API version specific configuration file which contains only properties the platform can handle. Any unsupported features should yield a warning. Platforms can additional opt-out of features but would also be requested to yield warnings or errors in such cases.

```text
                      Application API
┌────────────────────────────────────────────────────────────────┐
│                                                                │

                         ┌───────┐
                         │       │   buildpacks.*    ┌───────────┐
┌────────┐               │   p   ├───────────────────►           │
│        │ buildpacks.*  │   l   │                   │ converter │
│ source ├───────────────►   a   │                   │           │
│        │               │   t   │                   └──┬────────┘
└────────┘               │   f   │                      │
                         │   o   ◄──────────────────────┘
                         │   r   │   platform.toml
                         │   m   │
                         │       │
                         └───────┘

                         │                                       │
                         └───────────────────────────────────────┘
                                       Platform API
```


[rfc-pr-182]: https://github.com/buildpacks/rfcs/pull/182

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?
- Why is this proposal the best?
- What is the impact of not doing this?

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?
- What parts of the design do you expect to be resolved through implementation of the feature?
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
Does this RFC entail any proposed changes to the core specifications or extensions? If so, please document changes here.
Examples of a spec. change might be new lifecycle flags, new `buildpack.toml` fields, new fields in the buildpackage label, etc.
This section is not intended to be binding, but as discussion of an RFC unfolds, if spec changes are necessary, they should be documented here.
