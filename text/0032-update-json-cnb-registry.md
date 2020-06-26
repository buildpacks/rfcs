# Meta
[meta]: #meta
- Name: Update JSON Structure of CNB Registry
- Start Date: 2020-03-19
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: [RFC-0022](https://github.com/buildpacks/rfcs/blob/main/text/0022-client-side-buildpack-registry.md)

# Summary
[summary]: #summary

This proposal corrects some mistakes and inefficiencies in the JSON structure proposed by [RFC-0022](https://github.com/buildpacks/rfcs/blob/main/text/0022-client-side-buildpack-registry.md).

# Motivation
[motivation]: #motivation

During implementation, we found that the JSON structure described in [RFC-0022](https://github.com/buildpacks/rfcs/blob/main/text/0022-client-side-buildpack-registry.md) was both incorrect and redundant.

# What it is
[what-it-is]: #what-it-is

Each file representing a buildpack in the buildpack registry index will contain JSON. The file will contain multiple entries representing each version of the buildpack split by a newline. However, each version entry will be minimized (stored on a single line), and multiple entries in the same file will not have a comma at the end (i.e. there will be no list/array using `[]`). Thus, each index file *will contain invalid JSON*. But this allows for smaller diffs and simpler appends. This follows the precedent set by [crates.io-index](https://github.com/rust-lang/crates.io-index), which strikes a balance between human redable, easy to parse, and minimizing the diffs for new updates.

# How it Works
[how-it-works]: #how-it-works

An entry will have the following structure:

```
{
  "ns" : "<string>",
  "name": "<string>",
  "version" : "<string>",
  "yanked" : <boolean>,
  "addr" : "<string>",
}
```

The fields are defined as follows:

* `ns` - can represent a set or organization of buildpacks.
* `name` - an identifier that must be unique within a namespace.
* `version` - the version of the buildpack (must match the version in the `buildpack.toml` of the buildpack)
* `yanked` - whether or not the buildpack has been removed from the registry
* `addr` - the address of the image stored in a Docker Registry (ex. `"docker.io/jkutner/lua@sha256:abc123"`). The image reference must use `@digest` and not use `:tag`.

An example of what this may look like for a single buildpack file:

```
{"ns":"heroku","name":"ruby","version":"0.1.0","yanked":false,"addr":"docker.io/hone/ruby-buildpack@sha256:a9d9038c0cdbb9f3b024aaf4b8ae4f894ea8288ad0c3bf057d1157c74601b906"}
{"ns":"heroku","name":"ruby","version":"0.2.0","yanked":false,"addr":"docker.io/hone/ruby-buildpack@sha256:2560f05307e8de9d830f144d09556e19dd1eb7d928aee900ed02208ae9727e7a"}
{"ns":"heroku","name":"ruby","version":"0.2.1","yanked":false,"addr":"docker.io/hone/ruby-buildpack@sha256:74eb48882e835d8767f62940d453eb96ed2737de3a16573881dcea7dea769df7"}
{"ns":"heroku","name":"ruby","version":"0.3.0","yanked":false,"addr":"docker.io/hone/ruby-buildpack@sha256:8c27fe111c11b722081701dfed3bd55e039b9ce92865473cf4cdfa918071c566"}
```

*Note:* id is the combination of two fields, `ns` and `name`. The `/` will be replaced by a `_` in the filename. The directories will use the first four characaters of the buildpacks `name`, split into two two character dirs. For example:

```
ja
└── va
    └── heroku_java
```

This ensures an even distribution of files, as opposed to use the first two characters of the `ns`, which would result in only a few directories, with some having a large number of files, and most having only a few.

# Drawbacks
[drawbacks]: #drawbacks

- The faux-JSON will not be parseable. Instead, it is required that consumers parse each line individually.

# Alternatives
[alternatives]: #alternatives

- Valid JSON
- Include the `digest` as its own field in the JSON structure.

# Prior Art
[prior-art]: #prior-art

- [Cargo](https://doc.rust-lang.org/cargo/) and [crates.io](https://crates.io/)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

None

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

None
