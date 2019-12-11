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
* buildpack registry api - API service that handles access control to writing to the index
* namespace - the owner of a buildpack. This may need to become an attribute in `buildpack.toml`

This proposal introduces two new components:

* An index of buildpacks, which is stored on Github
* CLI commands to search and use buildpacks from the registry

## Adding a Buildpack to the Registry

When a buildpack author would like to publish and share their buildpack on the registry, they will do the following:

1. Push their CNB (as a buildpackage) to a Docker Registry (ex. Docker Hub, GCR, etc). This can be done with either a `docker push` or a `pack push-buildpack` (or similar name).
1. Use `pack publish-buildpack` command to publish a new buildpack. This will create a Pull Request to the buildpack/registry Github repo to add the new buildpack to the index.

(Alternatively: these steps could be done in one command)

## Yanking a Buildpack from the Registry

Sometimes a buildpack author may have pushed up a bad version that they wish to not be available in the index. In order to not break builds, it will not be possible to fully remove an entry from the index. Instead, the entry in the index will be marked as "yanked". This information can than be used when resolving which buildpacks to fetch.

1. Use `pack yank-buildpack <namespace>/<name> <version>` command to yank a buildpack.

If a buildpack author wants to undo the yank and make the buildpack version available in the index, they can use the `--undo` flag.

```
$ pack yank-buildpack --undo <namespace>/<name> <version>
```

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

The index should be able to be replicated completely locally, so the structure should work across all major Operating Systems.

Folders with be split by two nested folders. The reasoning for this is so the index doesn't run into a files in a folder limit. The first folder will be represent the first two characters and the third and fourth characters will be in the second folder. The filename will be the id, where it matches: `[a-z0-9\-\.]{1,253}`. For ids that are 1-3 characters long, they'll go in special folders.

Here's an example directory structure:

```
1
├── a
└── b
2
├── aa
└── ab
3
├── a
│   ├── abc
│   └── acd
└── b
    ├── bcd
    └── bed
fo
├── ob
│   ├── fooball
│   └── foobar
└── oc
    └── foocal
```

The following ids are reserved by Windows, so they aren't allowed as valid ids:

* nul
* con
* prn
* aux
* com1
* com2
* com3
* com4
* com5
* com6
* com7
* com8
* com9
* lpt1
* lpt2
* lpt3
* lpt4
* lpt5
* lpt6
* lpt7
* lpt8
* lpt9


The file will contain minified JSON for each buildpack. Multiple entries will exist in a file split by a newline. This strikes a balance between human redable, easy to parse, and minimizing the diffs for new updates.

An entry will have the following structure:

```
{
  "buildpacks" : [
    {
      "ns" : "<string>",
      "name": "<string>",
      "version" : "<string",
      "cksum" : "<string>",
      "yanked" : <boolean>,
      "addr" : "<string>",
    }
  ],
}
```

The `buildpacks` fields are defined as follows:

* `ns` - can represent a set or organization of buildpacks.
* `name` - an identifier that must be unique within a namespace.
* `version` - the version of the buildpack (must match the version in the `buildpack.toml` of the buildpack)
* `cksum` - the image ID of the OCI image that represents the buildpack (used for validation)
* `yanked` - whether or not the buildpack has been removed from the registry
* `addr` - the address of the image stored in a Docker Registry (ex. `"docker.io/jkutner/lua"`)

An example of what this may look like for a single buildpack file:
```
{"namespace":"heroku","name":"ruby","version":"0.1.0","cksum":"a9d9038c0cdbb9f3b024aaf4b8ae4f894ea8288ad0c3bf057d1157c74601b906","yanked":false,"addr":"docker.io/hone/ruby-buildpack:0.1.0"}
{"namespace":"heroku","name":"ruby","version":"0.2.0","cksum":"2560f05307e8de9d830f144d09556e19dd1eb7d928aee900ed02208ae9727e7a","yanked":false,"addr":"docker.io/hone/ruby-buildpack:0.2.0"}
{"namespace":"heroku","name":"ruby","version":"0.2.1","cksum":"74eb48882e835d8767f62940d453eb96ed2737de3a16573881dcea7dea769df7","yanked":false,"addr":"docker.io/hone/ruby-buildpack:0.2.1"}
{"namespace":"heroku","name":"ruby","version":"0.3.0","cksum":"8c27fe111c11b722081701dfed3bd55e039b9ce92865473cf4cdfa918071c566","yanked":false,"addr":"docker.io/hone/ruby-buildpack:0.3.0"}
```

*Note:* id is the combination of two fields, `ns` and `name`. The `/` will be replaced by a `_` in the filename. For example:

```
he
└── ro
    └── heroku_java
```

### Manipulating the Index

In general, the file will be append only for add. This will add new entries through `pack publish-buildpack`.

When performing a `pack yank-buildpack`, it will rewrite the corresponding line by adjusting the `yanked` field to `true`.

When performing a `pack yank-buildpack --undo`, it will rewrite the corresponding line by adjusting the `yanked` field to `false`.

### Squashing the Index

For performance reasons, the git history will be periodically squashed. This strikes a balance between ensuring fast fresh clone experience and incremental updates. The way squashes are handled should still ensure small deltas. In order to squash the index:

1. create a branch with the current date as the name, i.e. `snapshot-YYYY-MM-DD`.
1. replace master with a single commit containing the current state
1. force push to master

### Namespace ownership

Each `namespace` will be owned by an entity. The mapping of this entity, called owner, to a namespace will have the following structure:

```
[
  {
    "namespace" : "<string>",
    "owner" : [
      "id" : "<string>",
      "type" : "<string>"
    ]
  }
]
```

* `namespace` - can represent a set or organization of buildpacks. matches `ns` in the primary index
* `owner.id` - the identifier of the user or group that owns a namespace. this will be specific to `owner.type`
* `owner.type` - the type of owner (i.e. a Github account, a Google account, etc)

Namespaces are allocated to owners on a first-come-first-serve basis. However, we will retain the right to retroactively change ownership.

The mapping of owners to namespaces will be stored in a seperate database (potentially a JSON file in a different Github repo). In the future, we may decide to merge this mapping into the registry index repo if we decided that it can be done in a vendor-neutral way (i.e. without coupling to Github).

Each buildpack release will be checked against the ownership database to ensure the user submitting the release has ownership of the namespace (either directly or as part of an organization like a Github org).

Ownership data is neither private, nor sensitive and *can* be stored in clear text and be publicly accessible.

## CLI

The `pack` CLI (or any platform that wishes to support buildpacks from a registry) will maintain a local clone of the Git repository (in `~/.pack/registry` or similar).

* `pack create-builder`
* `pack create-package`
* `pack build` with the `--buildpack` flag
* `pack search-buildpacks`

Since the Git Repository will be squashed at times, the CLI will need to be able to handle this.

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

## API

An API server would replace some of the logic performed by the CLI/client. The API server will manage the Git repository index and maintain a bot that will commit to the git repository. It will be a pain for individual users to write minified JSON, so the API server will automate this work. It bare minimum it will need to support 3 endpoints beyond auth/login.

* `POST /buildpacks/new` - this will be used for publishing a new version of a buildpack
* `DELETE /buildpacks/buildpack_id/:version/yank` - this will be used to yank an existing buildpack version from the index
* `PUT /buildpacks/:buildpack_id/:version/yank` - this will be used to undo a yank of a buildpack version

## Human Readable Index as Gateway

In addition to the machine readable index described in [How it works](#how-it-works), we may want to support a human readable index that acts as a gateway for PRs. This would not be on the critical path, but would make the experience of publishing easier.

In the future, the Human readable index could be replaced by an API service and web frontend.

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
