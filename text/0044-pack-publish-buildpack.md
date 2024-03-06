# Meta
[meta]: #meta
- Name: Pack Register Buildpack
- Start Date: 2020-04-27
- Author(s): [Joe Kutner](https://github.com/jkutner), [Javier Romero](https://github.com/jromero)
- Status: Implemented
- RFC Pull Request: [rfcs#75](https://github.com/buildpacks/rfcs/pull/75)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: https://github.com/buildpacks/rfcs/blob/main/text/0022-client-side-buildpack-registry.md

# Summary
[summary]: #summary

This RFC describes the implementation of the following commands:
* `pack register-buildpack`
* `pack yank-buildpack`

# Motivation
[motivation]: #motivation

The [Client-Side Registry RFC (0022)](https://github.com/buildpacks/rfcs/blob/main/text/0022-client-side-buildpack-registry.md) established that two CLI commands would allow users to add/remove buildpacks to the registry, but the implementation of those commands was vague. In this document, we describe the details of how they will work.

# What it is
[what-it-is]: #what-it-is

## Registering a Buildpack with the Registry

When a buildpack author would like to register a version of a buildpack on the registry, they will use the `pack register-buildpack <image-name>` command. This command will create a Github Issue on the `https://github.com/buildpacks/registry-index` (or similarly named) Github repo requesting the addition the new buildpack version to the index.

## Yanking a Buildpack from the Registry

Sometimes a buildpack author may have pushed up a bad version that they wish to not be available in the index. In order to not break builds, it will not be possible to fully remove an entry from the index. Instead, the entry in the index will be marked as "yanked". This information can then be used when resolving which buildpacks to fetch.

The user will run the `pack yank-buildpack <namespace>/<name>@<version>` command to yank a buildpack. This command will create a Github Issue on the registry. If a buildpack author wants to undo the yank and make the buildpack version available in the index, they can run the same command and use the `--undo` flag.

# How it Works
[how-it-works]: #how-it-works

The implementation of adding and yanking buildpacks will require new configuration elements in Pack's config file, and two new commands in Pack.

## Configuration

A default registry will be configured in `.pack/config.toml` with the following schema.

##### Base Schema
```toml
default-registry="<string>"

[[registries]]
name="<string>"
type="<string>"
# <additional per "type" config entries>
```

The `default-registry` value must match one of the tables in the `[[registries]]` array with the same `name`. The `name` value can be any string.

The `type` key in the `[[registries]]` table can be set to one of two values, described below:

##### Type: GitHub Schema
```toml
[[registries]]
name="<string>"
type="github"
url="<url to git repo>"
issues-url="<url to issues for registering>" # optional, default: "<url>/issues"
```

##### Type: Git Schema
```toml
[[registries]]
name="<string>"
type="git"
url="<path to git repo>"
```

#### Default

The following will be the implied default when no registries are present, however, it can be overridden by defining a registry with the name "official".

```toml
default-registry="official"

[[registries]]
name="official"
type="github"
url="https://github.com/buildpacks/registry"
issues-url="https://github.com/buildpacks/registry/issues"
```

## Format

### Type: Git

A commit would be created with the following message:

```
[<ADD|YANK>] <namespace>/<name>@<version>

<user message (optional)>
```

##### Example

```
[YANK] buildpacks-io-samples/hello-universe@0.0.1

Major bug issues found. See https://github.com/buildpacks/samples/issues.
```

### Type: GitHub issue

An issue would be created with the following content:

- Title: `[<ADD|YANK>] <namespace>/<name>@<version>`
- Body:

        <user message (optional)>

        ### Data

        ```toml
        id = <ns/name (required)>
        version = <version (required)>
        addr = <address-to-image (only required for ADD)>
        digest = <digest-of-image (only required for ADD)>
        ```

##### Example

- Title: `[YANK] samples/hello-universe@0.0.1`
- Body:

        Major bug issues found. See https://github.com/buildpacks/samples/issues.

        ### Data

        ```toml
        id = samples/hello-universe
        version = 0.0.1
        ```

## `pack register-buildpack <url>`

Arguments:

* `image-name` - the location of a buildpackage _in a Docker registry_ to be released in the buildpack registry

Steps:

The following behavior will execute when the configured registry is of type `github`.

1. Fetches the image config blob for the buildpackage at `image-name`.
1. Reads the following information from the image config (if any of these are missing, the command fails):
    - `id` (must include a `namespace` and `name` in the form `<namespace>/<name>`)
    - `version`
1. Opens a link to a new Github Issue in the user's browser
    - The user must be logged into Github
    - The link will use [Github query parameters](https://help.github.com/en/github/managing-your-work-on-github/about-automation-for-issues-and-pull-requests-with-query-parameters) to pre-populate the title, body, and labels. It will use the `register-buildpack` label.
    - The issue will be opened against the `https://github.com/buildpacks/registry-index` repo.
    - The issue body will contain structured data that defines the buildpack id, version, digest, and url.
1. A Github action will detect the new issue and do the following:
    - If the issue is in an unexpected format, or if the digest does not match the image located at `image-name`, the bot will add a comment to the issue and close it.
    - If this is the first time the `namespace` is used, it will add the namespace to the `buildpacks/registry-owners` repo with the Github user who opened the issue as the owner. The `buildpacks/registry-owners` repo defines the [namespace ownership as described in RFC-0022](https://github.com/buildpacks/rfcs/blob/main/text/0022-client-side-buildpack-registry.md#namespace-ownership).
    - If this is *not* the first time the `namespace` is used, it will confirm that the Github user who opened the issue is an owner of the buildpack.
    - Create a commit against the master branch of the `https://github.com/buildpacks/registry-index` repo using a Gitub token (i.e. all commits in that repo will be made by the same "user"). The commit will add the buildpack version described in the issue.
    - Close the Github issue.

The following behavior will execute when the configured registry is of type `git`.

1. Pulls the image manifest for the buildpackage at `image-name` if it does not already exist locally.
1. Reads the following information from the image manifest (if any of these are missing, the command fails):
    - `id` (must include a `namespace` and `name` in the form `<namespace>/<name>`)
    - `version`
1. Creates a `local` branch on the local registry index cache
1. Makes a Git commit to the local registry index with a JSON payload represeting the buildpack version as defined in [RFC-0022](https://github.com/buildpacks/rfcs/blob/main/text/0022-client-side-buildpack-registry.md)
1. Uses Git to push the commit to the registry index's `origin`.
1. Updates the `master` branch of the local registry cache from `origin`.

Options:

* `--buildpack-registry, -R` - the id of a registry configured in `.pack/config.toml`

**NOTE:** Github Issues that are not recognized as a request to add/yank a buildpack version will be automatically closed. All PRs will also be automatically closed.

Example:

```
$ pack register-buildpack docker://docker.io/buildpacks/sample:latest
```

## `pack yank-buildpack <buildpack-id-and-version>`

Arguments:

* `buildpack-id-and-version` - a buildpack ID and version in the form `<id>@<version>`

Steps:

The following behavior will execute when the configured registry is of type `github`.

1. Opens a link to a new Github Issue in the user's browser
    - The user must be logged into Github
    - The link will use [Github query parameters](https://help.github.com/en/github/managing-your-work-on-github/about-automation-for-issues-and-pull-requests-with-query-parameters) to pre-populate the title, body, and labels.
    - The issue will be opened against the `https://github.com/buildpacks/registry-index` repo.
    - The issue body will contain structured data that defines the buildpack id and version to yank.
1. A Github action will detect the new issue and do the following:
    - If the issue is in an unexpected format, or if the digest does not match the image located at `image-name`, the bot will add a comment to the issue and close it.
    - Confirm that the Github user who opened the issue is an owner of the buildpack.
    - Create and merge a PR against the `https://github.com/buildpacks/registry-index` repo using a Gitub token (i.e. all commits in that repo will be made by the same "user"). The PR will set `yanked=true` for the buildpack version described in the issue.
    - Close the Github issue.

The following behavior will execute when the configured registry is of type `git`.

1. Creates a `local` branch on the local registry index cache
1. Makes a Git commit to the local registry index with an update setting `yank=true` in the JSON payload representing the buildpack version as defined in [RFC-0022](https://github.com/buildpacks/rfcs/blob/main/text/0022-client-side-buildpack-registry.md)
1. Uses Git to push the commit to the registry index's `origin`.
1. Updates the `master` branch of the local registry cache from `origin`.

Options:

* `--buildpack-registry, -R` - the id of a registry configured in `.pack/config.toml`
* `--undo` - this option will execute the same flow, but set `yanked=false`

Example:

```
$ pack yank-buildpack buildpacks/sample@0.0.1
```

## Future Work

Not included in this proposal, but intended for future RFCs are the following:

* `pack add-buildpack-registry` - a new command that will add to the `[[registries]]` config in `.pack/config.toml`.
* `pack set-buildpack-registry` - a new command that will mutate the `default-registry` config in `.pack/config.toml`.
* `pack publish-buildpack` - a new command that will perform both `package-buildpack` and `register-buildpack` in one step.
* *Headless release* - a new option on `register-buildpack` would allow for a non-interactive (i.e. no browser) registration
* *REST API* - as an alternative to `github` and `git` types of registries, we intend to support an `api` type that will use a registry service to broker registration requests (instead of using Github Issues).

# Drawbacks
[drawbacks]: #drawbacks

* `type` of registry isn't accounted for in the [Buildpack URI](https://github.com/buildpacks/rfcs/blob/main/text/0037-buildpack-uris.md) definition
* Github is a single-point-of-failure for the official registry
* The user must have a Github account to register with the official registry
* The user may only register with the official registry via a browser

# Alternatives
[alternatives]: #alternatives

## Infer registry type

Instead of configuring the registry `type`, Pack could infer the type from the URL. For example, any URL with the host `github.com` would be interpreted as type `github`. Any local file path would be interpreted as type `git`.

## Direct commits to the remote index

Instead of handling Github Issues on the `buildpacks/registry-index` repo, the `register-buildpack` command could open a PR against the `buildpacks/registry-index`. This has the following advantages:

* The operation could be performed headlessly without storing or transporting the user's Github token.

This also has the following drawbacks:

* The user *must* fork the `buildpacks/registry-index`
* The contents of a PR to the `buildpacks/registry-index` repo are not intended to be human readable, which would make it difficult for users to audit before submitting.
* This would result in commits against the index from the actual user, which requires that they DCO sign-off the commit (it's unclear if automating the sign-off is legally acceptable).
* This differs from [rust-lang/crates.io-index](https://github.com/rust-lang/crates.io-index), which only has commits from a single user.

## Create a `publish-buildpack` in addition to `register-buildpack`

The command to release a new version could be `pack publish-buildpack`, which would perform both `package-buildpack --publish` and `regsiter-buildpack`.

# Prior Art
[prior-art]: #prior-art

* [rust-lang/crates.io-index](https://github.com/rust-lang/crates.io-index)
* [CocoaPods Specs](https://github.com/CocoaPods/Specs)
* [brew taps](https://docs.brew.sh/Taps)
# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What other types of repository should we support?
    - API?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

None
