# Meta
[meta]: #meta
- Name: Project Descriptor (project.toml) Schema
- Start Date: 2020-28-07
- Author(s): @joshwlewis
- Status: Approved
- RFC Pull Request:
- CNB Pull Request:
- CNB Issue:
- Supersedes: N/A

# Summary
[summary]: #summary

This is a proposal to introduce a schema for the project descriptor
(project.toml) and leverage this schema within `pack` to validate user-supplied
project descriptors for compliance with the schema.

# Definitions
[definitions]: #definitions

- Project Descriptor: Otherwise known as project.toml. It is defined
  in [RFC 19](./0019-project-descriptor.md).
- Schema: A consumable representation of a desired data structure.
- JSON Schema: A JSON-based vocabulary to annotate and validate JSON documents.
  The spec is defined [here](https://json-schema.org/)

# Motivation
[motivation]: #motivation

As a user of `pack` and/or a developer integrating with `pack`, it can be 
difficult to understand whether a given `project.toml` is correct and
understood by `pack`. Generally, the procedure to validate this file is to
execute `pack build myimage --descriptor project.toml` and check that it 
doesn't error, and that the settings from the project descriptor are present 
in the build output and/or the resulting image. Even then, the validation 
`pack` performs is not exhaustive (it won't check for invalid keys, or value 
formats for example). Nor does it provide helpful errors in case of type errors.

# What it is
[what-it-is]: #what-it-is

The project descriptor schema is a JSON-schema file, available for public
consumption. Developers of `pack` or other tools (even tools written in other
languages) can use this schema to validate the correctness of a project
descriptor and yield informative error messages.

`pack` will leverage this schema to validate any `--descriptor` files provided
to it, and yield informative error messages before attempting to use any
descriptor data.

As an example, for a `project.toml` using `[build.env]` instead of 
`[[build.env]]` the error messaging might improve from

```
pack build myimage --descriptor project.toml
ERROR: toml: cannot load TOML value of type map[string]interface } into a Go
slice`
```

to something like

```
pack build myimage --descriptor project.toml
ERROR: Expected project descriptor's build.env to be an array
```

Or, for a `project.toml` with a numeric `build.buildpacks.version`, the error
messaging would improve from

```
pack build myimage --descriptor project.toml
ERROR: toml: cannot load TOML value of type int64 into a Go string
```

to something like

```
pack build myimage --descriptor project.toml
ERROR: Expected project descriptor's build.buildpacks[0].version to be a string
```

The schema and corresponding human-readable documentation will be available 
for public consumption from [buildpacks/spec](https://github.com/buildpacks/spec).

# How it Works
[how-it-works]: #how-it-works

TOML does not have support for schemas, but TOML data can be represented as
a JSON document. JSON-Schema is a well established schema format, with parsers
and validators in a wide variety of languages. Tools validating a project
descriptor will need to convert the descriptor to JSON, then use schema to
validate the JSON descriptor.

The schema might look something like this:

```json
{
  "$schema": "http://json-schema.org/schema#",
  "$id": "https://buildpacks.io/schemas/project-descriptor.json",
  "type": "object",
  "properties": {
    "build" : {
      "type": "object",
      "properties": {
        "env": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["name", "value"],
            "properties": {
              "name": {
                "type": "string"
              },
              "value": {
                "type": "string"
              }
            }
          }
        },
        "include": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "exclude": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "buildpacks": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id"],
            "properties": {
              "id": { 
                "type": "string"
              },
              "version": {
                "type": "string"
              },
              "uri": { 
                "type": "string"
              }
            }
          }
        }
      }
    }
  }
}
```

This schema could be further enhanced to define the exclusivity of
`build.include` and `build.exclude` and other complex rules.

# Drawbacks
[drawbacks]: #drawbacks

- If the schema is published in an independent repository, it complicates the
  dependency graph and changes to the schema become more complicated to release.
- It may potentially break builds for users that have undected errors in their
  function.toml.
- JSON-Schema error messages are more informative than errors we have now, but 
  can sometimes be cryptic as the schema complexity grows.

# Alternatives
[alternatives]: #alternatives

- Do nothing
  With this alternative, project descriptor errors continue to be a bit weird 
  around the edges. Additionally, developing integrations with and extensions
  to the project descriptor requires reimplementing parts of pack.
- Further iterate on descriptor parsing in `pack`
  This would involve adding validation rules to `pack` and improve error
  messages. This is tougher for intergrations to work with, and doesn't scale
  as well as more project descriptor features and rules are added.

# Prior Art
[prior-art]: #prior-art

- [The project descriptor RFC](./0019-project-descriptor.md)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?
  - Where should this schema live? **[buildpacks/spec](https://github.com/buildpacks/spec)**
  - Should it include human-readable documentation? **Yes, perhaps this could be automated from the specification**
  - Should it provide generated types for consumption in `pack`? **Out of scope for now**
  - Should it provide a generalized binary for validating a `project.toml`? **Out of scope for now**
  - Is this an extension point for other CNB `toml` files, or directly targeted only at `project.toml`? **We'd like to use this strategy for any public facing toml files**
- What parts of the design do you expect to be resolved through implementation of the feature?
  - Which JSON-schema library should be used? Options: gojsonschema, santhosh-tekuri/jsonschema, qri-io/jsonschema
  - How to convert TOML to JSON before attempting to serialize to types?
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

This work will introduce a schema file and human-readable documentation of the
schema.
