# Meta
[meta]: #meta
- Name: Spec Restructure
- Start Date: 2021-10-21
- Author(s): @jromero
- Status: Draft
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: [RFC-27](./0027-spec-api-branches.md)

# Summary
[summary]: #summary

Restructure the [spec repository][spec-repo] to support multiple versions on a single branch including any versions currently in development. This by effect removes the complexity of managing multiple development branches.

[spec-repo]: https://github.com/buildpacks/spec

# Definitions
[definitions]: #definitions

  * Spec
  * Version
  * Schema
  * [Release Branches][release-branches] -


[release-branches]: https://nvie.com/posts/a-successful-git-branching-model/#release-branches

# Motivation
[motivation]: #motivation

<!-- TODO: Reduces initial contribution hurdle -->
<!-- TODO: Reduces maintainer merging complexities -->
<!-- TODO: Allows for easier consumption of content -->

### Support for multiple files per spec

An additional benefit to using directories for specific versions is that we can associate multiple files to any given version. One example of such files are schema files for TOML files, JSON labels, etc. Another example is being able to break up a single specification into component based files (see distribution specification below) if desired.


# What it is
[what-it-is]: #what-it-is

1. The spec repository directory structure will be formated as...
    * Standard specifications...
        * Default: \
            `<spec>/<version>/<spec>.md`
        * Miscellaneous (optional): \
            `<spec>/<version>/**/<misc>.<ext>`
    * Extension specifications...
        * Default: \
            `extensions/<spec>/<version>/<spec>.md`
        * Miscellaneous (optional): \
            `extensions/<spec>/<version>/**/<misc>.<ext>`
    
2. Release branches will no longer be used (by default). Instead, a `dev` directory will be available for additional contributions. See [Release](#release) section below for release related details.

# How it Works
[how-it-works]: #how-it-works

### Release

Upon release, the contents of that directory are copied to a corresponding version directory and the commit is tagged.


### Example

The following is an example of how the directory structure _could_ look. 

It shows how... 

1. Every specification has a `dev` directory.
2. A specification could be split into components. See `distribution/dev/`.
3. A specification can have supporting documents such as schemas (as per [RFC-54][rfc-54]). See `buildpack/dev/schema/`.

```text
.
├── buildpack/
│   ├── 0.3/
│   │   └── buildpack.md
│   ├── ...
│   ├── 0.8/
│   │   └── buildpack.md
│   └── dev/
│       ├── schema/
│       │   ├── launch.json
│       │   ├── build.json
│       │   ├── build-plan.json
│       │   ├── buildpack.json
│       │   └── buildpack-plan.json
│       └── buildpack.md
├── distribution/
│   ├── 0.1/
│   │   └── distribution.md
│   ├── ...
│   └── dev/
│       ├── buildpack.md
│       ├── build-image.md
│       ├── builder.md
│       ├── lifecycle.md
│       └── run-image.md   
├── platform/
│   ├── 0.7/
│   │   └── platform.md
│   └── dev/
│       └── platform.md
└── extensions/
    ├── buildpack-registry/
    │   ├── 0.1/
    │   │   └── buildpack-registry.md
    │   └── dev/
    │       └── buildpack-registry.md
    └── project-descriptor/
        ├── 0.1/
        │   └── project-descriptor.md
        ├── 0.2/
        │   └── project-descriptor.md
        └── dev/
            └── project-descriptor.md
```

[rfc-54]: https://github.com/buildpacks/rfcs/blob/main/text/0054-project-descriptor-schema.md

# Drawbacks
[drawbacks]: #drawbacks

<!-- Why should we *not* do this? -->

### Simultanious API Development

This changes the process of developing multiple API versions of a spec simultaniously (ie. distribution 0.3 and distribution 0.4). Release branches could still be used as a fallback in this scenario but it becomes the exception instead of the rule.

# Alternatives
[alternatives]: #alternatives

### Seperate Repositories

#### Pros

#### Cons

# Prior Art
[prior-art]: #prior-art

### OpenAPI (previously Swagger)

OpenAPI has a hybrid approach where they follow [the directory structure][open-api-schemas] proposed in this RFC with the exception of `dev`. 

Development occurs on development branches (aka release branches) per upcoming versions as we do now. More details on their development processes can be found [here][open-api-dev].

It's worth noting that OpenAPI is managing only one schema in this repository as opposed to our spec repo which manages multiple specifications which at times have cross-cutting implications.

[open-api-dev]: https://github.com/OAI/OpenAPI-Specification/blob/main/DEVELOPMENT.md#tracking-process
[open-api-schemas]: https://github.com/OAI/OpenAPI-Specification/tree/main/schemas

# Unresolved Questions
[unresolved-questions]: #unresolved-questions
