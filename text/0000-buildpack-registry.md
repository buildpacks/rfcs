# Meta
[meta]: #meta
- Name: Buildpack Registry
- Start Date: 2019-08-27
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

The Buildpack Registry is a place to publish, store, and discover buildpacks.

# Motivation
[motivation]: #motivation

The Buildpack Registry will support distribution of buildpacks. It will provide a
centralized service that platforms can use to resolve a buildpack ID and version
into a concrete buildpack that can be downloaded and used.

A registry will also support a healthy ecosystem of buildpacks because it allows
buildpack authors to publish and share their work. Buildpack consumers can use the
registry to search discover existing buildpacks.

One of the advantages buildpacks have over other mechanisms for creating Docker
images is their reusability. Once a buildpack is written, it can run on any app,
and a consume can leverage the work that has gone into it instead of rewriting
it themselves. The registry will facilitate this process.

# What it is
[what-it-is]: #what-it-is

* buildpack registry - a service that manages published buildpacks
* namespace - the owner of a buildpack. This may need to become an attribute in `buildpack.toml`
* backend registry - a Docker Registry that the Buildpack Registry uses to store images

A user will begin by logging into the Buildpack registry:

```
$ pack login registry.buildpacks.io/myname
```

The user will be prompted to connect this account, `myname`, to a third party service, which may be one of:

* Github
* Docker Hub

The account name will be linked to either a user, org, or team within the third party service. Access to the `myname` account will then be controlled by who has access to the corresponding third-party account. Account names will be given on a first-come-first-serve basis, but we will retain the right to shutdown or change an account.

The registry will not store any secrets. It will only store a mapping of Buildpack Registry account to third-party account.

To publish a buildpack, a buildpack author may then run a command like:

```
$ pack publish registry.buildpacks.io/myname/mycnb
```

This will push the buildpackage to a Docker registry. Then it will register that image with the Buildpack Registry as a buildpack. To ensure that the buildpack author has access to the account and the image that has been publish, the Buildpack Registry will do the following:

1. Create a temporary private/public key pair
1. Generate a random token
1. Encrypt the token
1. Add the encrypted token to the buildpackage metadata.
1. Send the random token and the public key to the Buildpack Registry
1. The Buildpack Registry will use the public key to encrypt the random token
1. If the encrypted token matches the encrypted token stored in the image metadata we know the client is the one who published that image.

(I think this works, but if not, we could keep the private key in the Buildpack Registry, and the client could request the public key to use. I'm fairly certain that works, but it requires an extra step that I think isn't necessary)

To download a buildpack, any client may run:

```
$ docker pull registry.buildpacks.io/myname/mycnb
```

All buildpacks will be publicly accessible, so there is no access control required to read buildpacks.

# How it Works
[how-it-works]: #how-it-works

Proxy to an Docker registry backend.

## Endpoints

The following HTTP endpoints will be exposed by the buildpack registry service.
For all endpoints the parameters are defined as:

* `:namespace` - the owner of the buildpack
* `:id` - the ID of the buildpack
* `:tag` - the Docker Registry tag of the buildpack image

### `GET /v2/`

A client will invoke this endpoint to begin the auth process. This endpoint matches [Docker Registry HTTP API v2](https://docs.docker.com/registry/spec/api/).

This endpoint with *always* fail and respond with a 401, which will cause the client to fetch a token.

### `GET /v2/:namespace/:id/manifests/:tag`

A client will invoke this endpoint to retrieve the manifest for a buildpack. This endpoint matches [Docker Registry HTTP API v2](https://docs.docker.com/registry/spec/api/).

The service will respond with the manifest stored in the local database and associated with the `namespace/id:tag`.

### `GET /v2/:namespace/:id/blobs/:sha`

A client will invoke this endpoint to retrive a blob for a buildpack layer. This endpoint matches [Docker Registry HTTP API v2](https://docs.docker.com/registry/spec/api/).

The service will proxy the request to the backend registry associated with the `namespace/id:tag` buildpack.

### `HEAD /v2/:namespace/:id/blobs/:sha`

This endpoint matches [Docker Registry HTTP API v2](https://docs.docker.com/registry/spec/api/). The service will proxy the request to the backend registry associated with the `namespace/id:tag` buildpack.

### `GET /token?scope=namespace/id`

This endpoint follows the [Token Authentication Specification](https://docs.docker.com/registry/spec/auth/token/) of the [Docker Registry HTTP API v2](https://docs.docker.com/registry/spec/api/).

The service will redirect (307) to the backend registry associated with the buildpack represented by the `namespace/id` in the `scope` parameter.

### `POST /buildpacks/`

This endpoint is used to publish a buildpack with the `pack publish` command.
It accepts a payload that contains the buildpack's ID, version, and a reference
to an image on a remote Docker registry.

### `POST /buildpacks/:namespace/:id/manifests/:tag`

This endpoint is used to update the manifest of the buildpackage. This is what will be returned by the
`GET /v2/:namespace/:id/manifests/:tag` endpoint.

### `POST /namespaces/:namespace/login`

Does the oauth dance with a third-party service to get a token. Then it verifies that the request is in fact who they say they are on the third-party service. If they are, we store the mapping of namespace to third-party account.

# Drawbacks
[drawbacks]: #drawbacks

- The Cloud Native Buildpacks team will need to maintain and operate the service
- The are some security concerns related to the third-party auth
- We risk screwing up, and allowing someone to publish a malicious buildpack
- Curating the registry might get out-of-hand if it becomes very popular

# Alternatives
[alternatives]: #alternatives

- Use a 307 redirect to a registry instead of a proxy
- Use central backend storage instead of a federated backend

# Prior Art
[prior-art]: #prior-art

- [Heroku Buildpack Registry](https://devcenter.heroku.com/articles/buildpack-registry)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- How will we index buildpacks to facilitate searching?
- How will we index buildpacks to facilitate fast resolution (w/o spamming the registry)?
