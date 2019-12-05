# Meta
[meta]: #meta
- Name: Client-Side Buildpack Registry
- Start Date: 2019-11-21
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: https://github.com/buildpack/rfcs/pull/24

# Summary
[summary]: #summary

The Buildpack Registry is a place to publish, store, and discover buildpacks. This is a proposal for a Buildpack Registry that requires minimal server-side support.

# Motivation
[motivation]: #motivation

The Buildpack Registry will support distribution of buildpacks. It will provide a centralized service that platforms can use to resolve a buildpack ID and version into a concrete buildpack that can be downloaded and used.

A registry will also support a healthy ecosystem of buildpacks because it allows buildpack authors to publish and share their work. Buildpack consumers can use the registry to search discover existing buildpacks.

# What it is
[what-it-is]: #what-it-is

* buildpack registry - a list of published buildpacks
* namespace - the owner of a buildpack. This may need to become an attribute in `buildpack.toml`

This proposal introduces two new components:

* An index of buildpacks, which is stored on Github
* CLI commands to search and use buildpacks from the registry

## Adding a Buildpack to the Registry

When a buildpack author would like to publish and share their buildpack on the registry, they will do the following:

1. Push their CNB (as a buildpackage) to a Docker Registry (ex. Docker Hub, GCR, etc). This can be done with either a `docker push` or a `pack push-buildpack` (or similar name).
1. Submit a Pull Request to the buildpack/registry Github repo to add the new buildpack to the index (the `pack push-buildpack` command will create this for you).

## Using a Buildpack from the Registry

A buildpack can be pulled from the regsitry by running `pack pull-package` or `docker pull`. However, most users will not consume the buildpack in such a raw format. The following sections describe how each persona will use the registry.

### Persona: Buildpack User

When a buildpack user wants to include a buildpack from the registry, they

```
$ pack build myapp --buildpack example/lua
```

If the buildpack passed with the `--buildpack` flag is not found in the builder image, `pack` will download it from the registry.

### Persona: Platorm Implementor

If a platform implementor wants to include a buildpack from the registry in a builder image, they will add the following:

```toml
[[buildpacks]]
id = "example/lua"
version = "1.2.3"
```

When no `uri` is provided in the `[[buildpacks]]` entry, the `pack create-builder` command will download the buildpack(age) from the registry.

### Persona: Buildpack Author

When buildpack authors wants to include a buildpack from the registry in a meta-buildpack, they can add the following to their `buildpack.toml`:

```toml
[[order]]
  [[order.group]]
  id = "example/lua"
  version = "1.2.3"
```

When no `uri` is provided in the `[[order.group]]`, the `pack create-package` command will download the buildpack from the registry.

# How it Works
[how-it-works]: #how-it-works

## Github Repo

The registry index will be stored in a Github repo similar to [crates.io-index](https://github.com/rust-lang/crates.io-index).

However, instead of multiple JSON files, we will use a single `index.json` at the root of the repo. This file will have the following structure:

```
{
  "buildpacks" : [
    {
      "id" : "<string>",
      "version" : "<string",
      "cksum" : "<string>",
      "yanked" : <boolean>,
      "uri" : "<uri>",
    }
  ],
  "indicies": [
    {
      "uri": "<uri>"
    }
  ]
}
```

*Note:* We may want to split the `id` into two fields, including a `namespace`, which would alter this dir structure

The `buildpacks` fields are defined as follows:

* `id` - the globally unique identifier of the buildpack, which will be used in commands like `pack pull-buildpack example/lua`
* `version` - the version of the buildpack (must match the version in the `buildpack.toml` of the buildpack)
* `cksum` - the image ID of the OCI image that represents the buildpack (used for validation)
* `yanked` - whether or not the buildpack has been removed from the registry
* `uri` - the address of the image stored in a Docker Registry (ex. `"docker.io/jkutner/lua"`)

The `indicies` array contains a list of locations of other index files. This will be used in the future to decompose the `index.json` into separate files to improve performance of searching and updating. Its fields are defined as:

* `uri` - The location of an index file with the same structure as this file (note: We will want to support relative paths too, which may mean `uri` is too specific)

New entries will be added with a Pull Request, which can be crafted by the `pack` command.

## CLI

The `pack` CLI (or any platform that wishes to support buildpacks from a registry) will maintain a local clone of the Git repository (in `~/.pack/registry` or similar).

* `pack create-builder`
* `pack create-package`
* `pack build` with the `--buildpack` flag

## Docker Registry

The CNB team will operate a docker registry proxy that facilitates the `docker pull` command. This proxy will be similar to the registry described in https://github.com/buildpack/rfcs/pull/24, but with the following differences:

* No authentication
* Read-only
* No backend database. Instead it will use the index from the Github repo.

This component will be considered non-critical, and end-users who require a more reliable proxy will be encourage to run their own instance of the proxy.

# Drawbacks
[drawbacks]: #drawbacks

* We risk screwing up, and allowing someone to publish a malicious buildpack
* Curating the registry as a Github repo might get out-of-hand if it becomes very popular

# Alternatives
[alternatives]: #alternatives

- All of the options in: https://github.com/buildpack/rfcs/pull/24

## Crates.io Format

The index would consist of multiple JSON files, split into directories based on the `id` of the buildpack.

```
├── ex
│   └── am
│       ├── example_foo.json
│       └── example_lua.json
└── he
    └── ro
        └── heroku_java.json
```

The `indicies` section of the index file allows us to adopt this format in the future.

## TOML Files

Instead of JSON we may want to use TOML, which would allow us to append to an index file. This may provide a performance improvement, but the specifics are unclear.

# Prior Art
[prior-art]: #prior-art

* [Heroku Buildpack Registry](https://devcenter.heroku.com/articles/buildpack-registry)
* [Cargo](https://doc.rust-lang.org/cargo/) and [crates.io](https://crates.io/)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Will we run a proxy that enables `docker pull buildpacks.io/example/lua` like commands?
- Should we split `id` into `namespace` and `id`?