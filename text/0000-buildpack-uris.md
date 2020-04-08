# Meta
[meta]: #meta
- Name: Buildpack URIs
- Start Date: 02/07/2020
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: "N/A"

# Summary
[summary]: #summary

A set of predefined URIs for referring to buildpacks from various sources (protocols). 

_Please note that the scheme denotes protocol and not type._

# Motivation
[motivation]: #motivation

Given that we support a multitude of sources for buildpacks, a certain level of ambiguity has naturally presented
itself. We currently _try_ to resolve the various sources through a complex set of rules yet the ambiguity to users
still exists. In config files, this ambiguity is at times resolved by introducing a separate key name to signify
the source (protocol).

The aim of this RFC is to propose a set of URI schemes that could be used in both CLI arguments and config files
while solving the ambiguity problem.

A few references to further express the problem:

- [A poll](https://buildpacks.slack.com/archives/C94UJCNV6/p1580920669081100) to understand what users expect when
providing buildpacks and there is overlap of sources.
- [Issue](https://github.com/buildpacks/pack/issues/489) to provide additional clarity in logs due to ambiguity. 
- [A conversation](https://buildpacks.slack.com/archives/CJ6B92ZSB/p1578502454017000) when trying to determine how to
provide reference to all buildpacks in builder.
- [Issue](https://github.com/buildpacks/pack/issues/376) where an `image` key was added to differentiate between
directory and image. 
 
# What it is
[what-it-is]: #what-it-is

### Scheme

| Name | Format | Examples |
|--- |--- |--- |
| Relative | `<path>` | `./my/buildpack.tgz`<br>`/home/user/my/buildpack.tgz`
| Filesystem | `file://[<host>]/<path>` | `file:///my/buildpack.tgz`<br>`file:///home/user/my/buildpack.tgz`
| URL | `http[s]://<host>/<path>` | `http://example.com/my/buildpack.tgz`<br>`https://example.com/my/buildpack.tgz`  
| Docker | `docker://[<host>]/<path>[:<tag>⏐@<digest>]` | `docker://gcr.io/distroless/nodejs`<br>`docker:///ubuntu:latest`<br>`docker:///ubuntu@sha256:45b23dee08...`
| CNB Registry | `cnb://[<host>]/[<id>[@<version>]]` |  `cnb:///my-org/my-bp`<br>`cnb://index.buildpack.io/my-org/my-bp`<br>`cnb://index.buildpack.io/my-org/my-bp@bp.version`
| CNB Builder Resource | `urn:cnb:builder[:<id>[@<version>]]` | `urn:cnb:builder`<br>`urn:cnb:builder:bp.id`<br>`urn:cnb:builder:bp.id@bp.version`
| CNB Registry Resource | `urn:cnb:registry[:<id>[@<version>]]` | `urn:cnb:registry:bp.id`<br>`urn:cnb:registry:bp.id@bp.version`

### Relative

A URI without a scheme is treated as a relative reference as per [RFC 3986 section 4.1](https://tools.ietf.org/html/rfc3986#section-4.1).

### Filesystem

The filesystem scheme is the implementation of [RFC 8089](https://tools.ietf.org/html/rfc8089).

### URL

The URL scheme is the implementation of [RFC 7230](https://tools.ietf.org/html/rfc7230#section-2.7.1).

### Docker

The docker scheme denotes the use of the [Docker HTTP API v2 protocol](https://docs.docker.com/registry/spec/api/).

- `<host>` is optional and defaults to `index.docker.io`.
- Similar to the `file` scheme, there is a minimal declaration for omitting host by using a simple slash (`/`). 
eg. `docker:/ubuntu:latest`

### CNB

The cnb scheme resolves buildpacks using the buildpacks registry described in [RFC #22](https://github.com/buildpacks/rfcs/blob/master/text/0022-client-side-buildpack-registry.md).

- `<host>` is optional and would default to a host predefined (or configured) in the platform.
- Similar to the `file` scheme, there is a minimal declaration for omitting host by using a simple slash (`/`).
eg. `cnb:/my-org/bp.id@bp.version`

### Resources

The defined URNs are resource names to buildpacks where they reside is predetermined. For example, in `urn:cnb:builder`,
there is only a single builder in the build context. In `urn:cnb:registry`, the registry is similarly provided as a
default to the platform.

#### CNB Builder

- `urn:cnb:builder` - A reference to ALL the buildpacks in the builder.
- `urn:cnb:builder:bp.id` - A reference to a buildpack with id `bp.id` in the builder.
- `urn:cnb:builder:bp.id@bp.version` - A reference to a buildpack with id `bp.id` at the specific version `bp.version`.

#### CNB Registry

- `urn:cnb:registry:bp.id` - A reference to a buildpack by id `bp.id` in the registry.
- `urn:cnb:registry:bp.id@bp.version` - A reference to a buildpack with id `bp.id` at the specific version `bp.version`.

# How it Works
[how-it-works]: #how-it-works

### pack

Certain `pack` CLI arguments would take URIs supported instead of the current inconsistent format.

Some examples:

```shell script
pack build my-app \
  --buildpack urn:cnb:builder:bp.id@bp.version \                  # buildpack from builder
  --buildpack file:///home/user/path/to/buildpack/ \              # absolute via file
  --buildpack /home/user/path/to/buildpack/ \                     # absolute via schemeless
  --buildpack ../path/to/buildpack/ \                             # relative file
  --buildpack docker:/cnbs/some-package \                         # Docker Hub image
  --buildpack docker://gcr.io/cnbs/sample-package-2:bionic \      # GCR image (with tag)
  --buildpack cnb://index.buildpack.io/my-org/bp.id@bp.version \  # buildpack from registry
  --buildpack urn:cnb:builder                                     # All buildpacks in builder
```   

### Config Files

Config files would replace `image` with `uri`, using the `docker://` scheme, where applicable.

`package.toml`:
```toml
[buildpack]
uri = "."

[[dependencies]]
uri = "docker:/my/image:latest"

# ...
``` 

`builder.toml`:
```toml
# ...

[[buildpacks]]
uri = "./my/buildpacks/"

[[buildpacks]]
uri = "docker:/my/image:latest"

# ...
```

# Additional considerations

#### `pack` User Experience

`pack` could provide additional logic in order for users to have a nicer user experience when providing references
via CLI. For example, `pack` could have an order of precedence to make a best guess at which type of reference
they are referring to or provide additional feedback if it's ambiguous.

# Drawbacks
[drawbacks]: #drawbacks

- The user would need to type an additional scheme prefix for any URI which is not a relative reference.

# Alternatives
[alternatives]: #alternatives

#### Flags and Config Keys

A different flag or config properties to signify the different protocols and would render the need for
URI moot.

#### Docker scheme

An alternative to `docker` is to use a more generic term such as `oci`. There is an official
[OCI distribution spec](https://github.com/opencontainers/distribution-spec/blob/master/spec.md) based on Docker HTTP
API v2 but it's direct compatibility would require additional research. Additionally, `oci` scheme has an overlap with
[Oracle Cloud Infrastructure Object Storage Service](https://docs.cloud.oracle.com/en-us/iaas/tools/hdfs/2.9.2.1/). 

# Prior Art
[prior-art]: #prior-art

- Predefined set of URI schemes for OCI images created by [Skopeo](https://github.com/containers/skopeo).
- [from=builder][from-builder] syntax.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Where would this be documented long-term?
    - Answer: Would solely live in the docs site.
- How does `urn:cnb:registry:bp.id@bp.version` translate to a `namespace` + `name` as detailed in [RFC #22](https://github.com/buildpacks/rfcs/blob/master/text/0022-client-side-buildpack-registry.md)?
    - Answer:
        > As of now, a namespace/name is an acceptable form of buildpack ID (like ID is a superset). So think defining the URN as `urn:cnb:registry:<id>@<version>` is sufficient for this proposal. In a future proposal we might define more strict rule about ID, but this definition would stay the same.

[from-builder]: (https://github.com/buildpacks/pack/pull/450#issue-361762357)