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

Make a list of the definitions that may be useful for those reviewing. Include phrases and words that buildpack authors or other interested parties may not be familiar with.

# Motivation
[motivation]: #motivation

- Why should we do this?
- What use cases does it support?
- What is the expected outcome?

# What it is
[what-it-is]: #what-it-is
<!--
This provides a high level overview of the feature.

- Define any new terminology.
- Define the target persona: buildpack author, buildpack user, platform operator, platform implementor, and/or project contributor.
- Explaining the feature largely in terms of examples.
- If applicable, provide sample error messages, deprecation warnings, or migration guidance.
- If applicable, describe the differences between teaching this to existing users and new users.
-->

`./.buildpacks.<ext>`

### Supported Formats

Proposed supported extensions:

 - `toml` => TOML
 - `yaml`, `yml` => YAML

> If multiple files exist, `toml` would be selected.

#### TOML

```toml
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

This is the technical portion of the RFC, where you explain the design in sufficient detail.

The section should return to the examples given in the previous section, and explain more fully how the detailed proposal makes those examples work.

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
