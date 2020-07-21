# Meta
[meta]: #meta
- Name: Project Descriptor Flexibility
- Start Date: 2020-07-21
- Author(s): hone
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

The Project Descriptor will become more flexible by making two changes:

1. Derive the top-level "primary" table to match the filename.
1. The Cloud Native Buildpacks project only reserves the `[build]` and filename keys at the "top level".

# Motivation
[motivation]: #motivation

The current spec of the Project Descriptor is simple but restrictive for companies and other projects to adopt it for their own use case. These projects may want to use a different filename other than the default of `project.toml` which is currently supported, but then they're required to use the `[project]` key which does not align.

As a project we have a pattern to provide a table in toml `[metadata]` for arbitrary keys for the user. This brings a lot of benefits and flexibility for the project. Unfortunately, this is fairly restrictive for anyone looking to adopt the Project Descriptor for their own use case. Not being allowed to create your own "top level" keys, means non build concerns will be treated as "second class citizens". For instance, if you were using CNB for a FaaS product, it's plausible to have an `[event]` key to configure invocation that would be native to that platform. Forcing all this config to be under `[metadata]` is awkward.

By not allowing this level of control, it massively limits the Project Descriptor's ability to be used in various configurations. In practice, Cloud Native Buildpacks only cares about defining a limited set of the schema.

# What it is
[what-it-is]: #what-it-is

The Project Descriptor will become more flexible by making two changes:

1. Derive the top-level "primary" table to match the filename.
1. The Cloud Native Buildpacks project only reserves the `[build]` and filename keys at the "top level".

By default, the Project Descriptor expects `project.toml` and a `[project]` at the "top level". This table's name is now flexible and will be based on the filename of the TOML file itself. For instance, `app.toml` will the schema:

```toml
[app]
id = "<string>" # machine readble
name = "<string>" # human readable
version = "<string>"
authors = ["<string>"]
documentation-url = "<url>"
source-url = "<url>"
```

Instead of restricting all keys at the "top level", the Project Descriptor will now only restrict the "filename" and the `[build]` keys. This means for `app.toml` adding an arbitrary key like `[event]` would be valid.

```toml
[event]
invoking-event = "<json string>"
account-id = "<string>"
version = "<string>"
```

## Backwards Compatibility

Since these are additive changes and less restrictive, all the existing Project Descriptors will be compatible with these changes.

# How it Works
[how-it-works]: #how-it-works

Parsing the Project Descriptor now becomes slightly more complicated. Instead of being able to hardcode a struct for the entire file, we'll need to only use structs for the different sections. This measn the TOML file will need to be mapped to `map[string]interface{}` initially, and certain keys will need to be unmarshalled manually.

# Drawbacks
[drawbacks]: #drawbacks

* dynamic tables are more complex to parse and have to be figured out at runtime
* by allowing arbitrary "top level" keys, potential future changes can introduce "breaking" change.

# Alternatives
[alternatives]: #alternatives

## Do Nothing
We can force everyone to continue to use `[metadata]`. This will deter other projects for using and expanding upon the Project Descriptor.

## Use the first table as the "primary" table instead of the filename
Instead of using the filename, it could be possible to try to use the first table/key defined in the TOML file.

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
This RFC will require changes to the Project Descriptor extension spec that are outlined from this RFC.
