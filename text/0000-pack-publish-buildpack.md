# Meta
[meta]: #meta
- Name: Pack Publish Buildpack
- Start Date: 2020-04-27
- Author(s): [Joe Kutner](https://github.com/jkutner)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: https://github.com/buildpacks/rfcs/blob/master/text/0022-client-side-buildpack-registry.md

# Summary
[summary]: #summary

This RFC describes the implementation the following commands:
* `pack publish-buildpack`
* `pack yank-buildpack`

# Motivation
[motivation]: #motivation

The [Client-Side Registry RFC (0022)](https://github.com/buildpacks/rfcs/blob/master/text/0022-client-side-buildpack-registry.md) established that two CLI commands would allow users to add/remove buildpacks in the registry, but the implementation of those commands was vauge. In this document we describe the details of how they will work.

# What it is
[what-it-is]: #what-it-is

## Adding a Buildpack to the Registry

When a buildpack author would like to publish a version of a buildpack on the registry, they will use the `pack publish-buildpack <url>` command. This command will create a Github Issue on the `https://github.com/buildpack/registry` (or similarly named) Github repo requesting the addition the new buildpack version to the index.

## Yanking a Buildpack from the Registry

Sometimes a buildpack author may have pushed up a bad version that they wish to not be available in the index. In order to not break builds, it will not be possible to fully remove an entry from the index. Instead, the entry in the index will be marked as "yanked". This information can then be used when resolving which buildpacks to fetch.

The user will run the `pack yank-buildpack <namespace>/<name>@<version>` command to yank a buildpack. If a buildpack author wants to undo the yank and make the buildpack version available in the index, they can run the same command and use the `--undo` flag.

# How it Works
[how-it-works]: #how-it-works

There are four mechanisms for publishing a buildpack:
* Default, which opens a Github Issue in a browser
* Headless, which uses an API token to POST the buildpack to a specified endpoint
* Native, which commits directly to the local Git repository for the index and makes a Git push to the origin
* Yank, which removes a buildpack from the registry

## Default: `pack publish-buildpack <url>`

This command will ONLY work against the official `buildpacks.io` registry index. If the default registry is set otherwise, the command will prompt with instructions for publishing to a non-official registry.

Arguments:

* `url` - the location of a buildpackage _in an Docker registry_ to be released in the buildpack registry

Steps:

1. Pulls the image manifest for the buildpackage at `url` if it does not already exist locally.
1. Reads the following information from the image manifest (if any of these are missing, the command fails):
    - `id` (must include a `namespace` and `name` in the form `<namespace>/<name>`)
    - `version`
1. Opens a link to a new Github Issue in the user's browser
    - The user must be logged into Github
    - The link will use [Github query parameters](https://help.github.com/en/github/managing-your-work-on-github/about-automation-for-issues-and-pull-requests-with-query-parameters) to pre-populate the title, body, and labels.
    - The issue will be opened against the `https://github.com/buildpacks/registry` repo, which is *not* the index. The `buildpacks/registry` defines the [namespace ownership as described in RFC-0022](https://github.com/buildpacks/rfcs/blob/master/text/0022-client-side-buildpack-registry.md#namespace-ownership).
    - The issue body will contain structured data that defines the buildpack id, version, digest, and url.
1. A Github action will detect the new issue and do the following:
    - If this is the first time the `namespace` is used, it will add the namespace to the `buildpacks/registry` repo with the Github user who opened the issue as the owner.
    - If this is *not* the first time the `namespace` is used, it will confirm that the Github user who opened the issue is an owner of the buildpack.
    - Create and merge a PR against the `https://github.com/buildpacks/registry-index` repo using a Gitub token (i.e. all commits in that repo will be made by the same "user"). The PR will add the buildpack version described in the issue.
    - Close the Github issue.

## Headless: `pack publish-buildpack --token <token> <url>`

When the `pack publish-buildpack` command is passed the `--token` option, it will use an API to publish the buildpack. However, it will require an API token from the user.

Steps:

1. Pulls the image manifest for the buildpackage at `url` if it does not already exist locally.
1. Reads the following information from the image manifest (if any of these are missing, the command fails):
    - `id` (must include a `namespace` and `name` in the form `<namespace>/<name>`)
    - `version`
1. Makes an HTTP POST request to the endpoint `<registry-write-url>/<namespace>/<name>@<version>` with the following:
    - Header: `Authorization: Bearer <token>`
    - Body: a JSON payload represeting the buildpack version as defined in [RFC-0022](https://github.com/buildpacks/rfcs/blob/master/text/0022-client-side-buildpack-registry.md)

**NOTE:** This command requires the default Registry URL be split into a read URL (for the Git pull) and a write URL (for the HTTP POST). Alternatively, we could define a specification for resolving a Git URL from a unified registry URL.

## Native: `pack publish-buildpack --native <url>`

When the `pack publish-buildpack` command is passed the `--native` option, it will commit the buildpack directly to the local registry cache, and attempt to push to the origin. This will NOT work against the official registry index, and the CLI will explicitly check for this before pushing so that it can error out with an appropriate message.

Steps:

1. Pulls the image manifest for the buildpackage at `url` if it does not already exist locally.
1. Reads the following information from the image manifest (if any of these are missing, the command fails):
    - `id` (must include a `namespace` and `name` in the form `<namespace>/<name>`)
    - `version`
1. Makes a Git commit to the local registry index with a JSON payload represeting the buildpack version as defined in [RFC-0022](https://github.com/buildpacks/rfcs/blob/master/text/0022-client-side-buildpack-registry.md)
1. Uses Git to push the commit to the registry index's `origin`.

## `pack yank-buildpack <buildpack-id-and-version>`

Arguments:

* `buildpack-id-and-version` - a buildpack ID and version in the form `<id>@<version>`

Steps:

1. Opens a link to a new Github Issue in the user's browser
    - The user must be logged into Github
    - The link will use [Github query parameters](https://help.github.com/en/github/managing-your-work-on-github/about-automation-for-issues-and-pull-requests-with-query-parameters) to pre-populate the title, body, and labels.
    - The issue will be opened against the `https://github.com/buildpacks/registry` repo.
    - The issue body will contain structured data that defines the buildpack id and version to yank.
1. A Github action will detect the new issue and do the following:
    - Confirm that the Github user who opened the issue is an owner of the buildpack.
    - Create and merge a PR against the `https://github.com/buildpacks/registry-index` repo using a Gitub token (i.e. all commits in that repo will be made by the same "user"). The PR will set `yanked=true` for the buildpack version described in the issue.
    - Close the Github issue.

Options:

* `--undo` - this option will execute the same flow, but set `yanked=false`

# Drawbacks
[drawbacks]: #drawbacks

* Github is a single-point-of-failure
* The user must have a Github account
* The user must publish via a browser or provide a Github API token to the CLI
* "publish" is ambigious (we use it in `pack package-buildpack --publish` to mean pushing an OCI image to a Docker registry).

# Alternatives
[alternatives]: #alternatives

## Direct commits to the index

Instead of handling Github Issues on the `buildpacks/registry` repo, the `publish-buildpack` command could open a PR against the `buildpacks/registry-index`. This has the following drawbacks:

* The user *must* fork the `buildpacks/registry-index`
* The contents of a PR to the `buildpacks/registry-index` repo are not intended to be human readable, which would make it difficult for users to audit before submitting.
* This would result in commits against the index from the actual user, which requires that they DCO sign-off the commit (it's unclear if automating the sign-off is legally acceptable).
* This differs from [rust-lang/crates.io-index](https://github.com/rust-lang/crates.io-index), which only has commits from a single user.

## Using `push-buildpack` instead of `publish-buildpack`

The command to release a new version could be `pack push-buildpack` to avoid ambiguity with other commands that use a `--publish` flag.

# Prior Art
[prior-art]: #prior-art

* [rust-lang/crates.io-index](https://github.com/rust-lang/crates.io-index)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What is the structure of the data in the Github Issue?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

 None
