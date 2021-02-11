# Meta
[meta]: #meta
- Name: Builder key in project descriptor
- Start Date: 2021-02-11
- Author(s): @wburningham
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This is a proposal for a new `builder` key in the `project.toml` file.

# Definitions
[definitions]: #definitions

* _project descriptor_ - The `project.toml` file that describes a project.

# Motivation
[motivation]: #motivation

New optional `builder` field in the `project.toml` would allow configuration via file rather than CLI flags. This is useful when teams/companies have scaffolding/templetazing tools to help developers initialize a new project (ex: an internal tool/system can generate a `project.toml` with a default custom builder that matches the project). It is expected that a project/repo can store/serialize a `builder` in a parsable format (ie the `project.toml` rather than a `--builder` flag in a bash script). Being able to search repos to identify consumers of a specifier builder is helpful for auditing and communciating changes (hard to do when the `--builder` flag is specified in an unknown script/location).

# What it is
[what-it-is]: #what-it-is

* Add `builder` as a text field

# How it Works
[how-it-works]: #how-it-works

See the spec changes below for full details.

# Drawbacks
[drawbacks]: #drawbacks

It surfaces the question around which/how-many CLI flags of `pack` should be made available in the project descriptor file (should all CLI flags be configurable in a project descriptor?).

# Alternatives
[alternatives]: #alternatives

## Do Nothing

This would require teams 
1. to add some other propriety parsable file to store a builder and pre-parse it before invoking `pack`
or
2. fork `pack` to support parsing a builder from the project descriptor

# Prior Art
[prior-art]: #prior-art

* [Waypoint](https://www.waypointproject.io/plugins/pack) has a `builder` key likely because it is not configurable in the project descriptor. 

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

-Which/How-many CLI flags of `pack` should be made available in the project descriptor file?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

## proejct.toml (TOML)

```toml
[project]
id = "<string>"
...

[[build]]
builder = "<string>" # optional
...
```
