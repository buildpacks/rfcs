# Meta
[meta]: #meta
- Name: Decouple extend phase from kaniko
- Start Date: 2025-04-10
- Author(s): natalieparellano
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

The lifecycle currently uses [kaniko](https://github.com/GoogleContainerTools/kaniko) as a library to perform build- and run-image extension, but kaniko has fallen into [unmaintained](https://github.com/GoogleContainerTools/kaniko/issues/3348) status, making it impractical and undesirable to rely on this dependency. We should remove the kaniko dependency from the lifecycle.

We should do this by:
1. Separating the extender binary from the lifecycle
2. Providing an alternative implementation of the extender that uses a different "dockerfile applier" - e.g., buildah or buildkit
3. Removing kaniko-specific references from the platform spec, along with any other spec changes that are needed

# Definitions
[definitions]: #definitions

## Lifecycle delivery

The lifecycle is delivered as a tarball on the GitHub releases page, and as an image at `buildpacksio/lifecycle:<version>`. In both cases, the directory structure looks like the following:

```
Permission     UID:GID       Size  Filetree                                   
drwxr-xr-x         0:0      32 MB  └── cnb                                    
drwxr-xr-x         0:0      32 MB      ├── lifecycle                          
-rwxrwxrwx         0:0        0 B      │   ├── analyzer → lifecycle           
-rwxrwxrwx         0:0        0 B      │   ├── builder → lifecycle            
-rwxrwxrwx         0:0        0 B      │   ├── creator → lifecycle            
-rwxrwxrwx         0:0        0 B      │   ├── detector → lifecycle           
-rwxrwxrwx         0:0        0 B      │   ├── exporter → lifecycle           
-rwxrwxrwx         0:0        0 B      │   ├── extender → lifecycle           
-rwxr-xr-x         0:0     2.8 MB      │   ├── launcher                       
-rw-r--r--         0:0      10 kB      │   ├── launcher.sbom.cdx.json         
-rw-r--r--         0:0      16 kB      │   ├── launcher.sbom.spdx.json        
-rw-r--r--         0:0      15 kB      │   ├── launcher.sbom.syft.json        
-rwxr-xr-x         0:0      29 MB      │   ├── lifecycle                      
-rw-r--r--         0:0     121 kB      │   ├── lifecycle.sbom.cdx.json        
-rw-r--r--         0:0     187 kB      │   ├── lifecycle.sbom.spdx.json       
-rw-r--r--         0:0     126 kB      │   ├── lifecycle.sbom.syft.json       
-rwxrwxrwx         0:0        0 B      │   ├── rebaser → lifecycle            
-rwxrwxrwx         0:0        0 B      │   └── restorer → lifecycle           
-rw-r--r--         0:0      560 B      └── lifecycle.toml
```

Notice how the extender is just a symlink pointing back to the lifecycle.

## Kaniko-specific references in the platform spec

### restorer

* `<kaniko-dir>` is a required input when using image extensions
* `<kaniko-dir>/cache` is an output

Expected behavior:
- When `<build-image>` is provided (optional), the lifecycle:
    - MUST record the digest reference to the provided `<build-image>` in `<analyzed>`
    - MUST copy the OCI manifest and config file for `<build-image>` to `<kaniko-dir>/cache`
- The lifecycle:
    - **If** `<analyzed>` has `run-image.extend = true`, the lifecycle:
        - MUST download from the registry and save in OCI layout format the `run-image` in `<analyzed>` to `<kaniko-dir>/cache`

E.g., after the restorer has run, `<kaniko-dir>/cache/base/<run-image-identifier>/oci-layout` should exist. If we are not using kaniko then this may no longer be necessary!

### extender

* `<kaniko-dir>` is a required input
* `<kaniko-cache-ttl>` is an optional input
* `<kaniko-dir>/cache` is an output (the changes here are specific to kaniko)
* The ability to extend the build image in-container and drop down to the CNB user to run the build phase could potentially be a kaniko-specific behavior that we might not be able to replicate with an alternative implementation.

## Responsibilities of the extender

The extender, according to the [platform spec](https://github.com/buildpacks/spec/blob/main/platform.md#outputs-3):

- For each extension in `<group>` in order, if a Dockerfile exists in `<generated>/<buildpack-id>/<kind>.Dockerfile`, the lifecycle:
  - SHALL apply the Dockerfile to the environment according to the process outlined in the [Image Extension Specification](image-extension.md).
  - SHALL set the build context to the folder according to the process outlined in the [Image Extension Specification](image-extension.md).
- The extended image MUST be an extension of:
  - The `build-image` in `<analyzed>` when `<kind>` is `build`, or
  - The `run-image` in `<analyzed>` when `<kind>` is `run`
- When extending the build image, after all `build.Dockerfile`s are applied, the lifecycle:
  - SHALL proceed with the `build` phase using the provided `<gid>` and `<uid>`
- When extending the run image, after all `run.Dockerfile`s are applied, the lifecycle:
  - **If** any `run.Dockerfile` set the label `io.buildpacks.rebasable` to `false` or left the label unset:
    - SHALL set the label `io.buildpacks.rebasable` to `false` on the extended run image
  - **If** after the final `run.Dockerfile` the run image user is `root`,
    - SHALL fail
  - SHALL copy the manifest and config for the extended run image, along with any new layers, to `<extended>`/run

**Kaniko currently does this piece**: `SHALL apply the Dockerfile to the environment according to the process outlined in the Image Extension Specification`

Where the [image extension spec](https://github.com/buildpacks/spec/blob/main/image_extension.md#phase-extension) says:

- The lifecycle MUST provide each Dockerfile with:
- A `base_image` build arg
  - For the first Dockerfile, the value MUST be the original base image.
  - When there are multiple Dockerfiles, the value MUST be the intermediate image generated from the application of the previous Dockerfile.
- A `build_id` build arg
  - The value MUST be a UUID
- `user_id` and `group_id` build args
  - For the first Dockerfile, the values MUST be the original `uid` and `gid` from the `User` field of the config for the original base image.
  - When there are multiple Dockerfiles, the values MUST be the `uid` and `gid` from the `User` field of the config for the intermediate image generated from the application of the previous Dockerfile.

Additionally:

When extending the build image:

- In addition to the outputs enumerated below, outputs produced by `extender` include those produced by `builder` - as the lifecycle will run the `build` phase after extending the build image.
- Platforms MUST skip the `builder` and proceed to the `exporter`.

# Motivation
[motivation]: #motivation

- Why should we do this?
  - It is insecure to rely on an unsupported dependency
  - We're currently [blocked](https://github.com/buildpacks/imgutil/pull/287#issuecomment-2769797254) on upgrading the docker dependency in the lifecycle because of kaniko
- What use cases does it support?
  - More flexibility for platforms to "bring your own" extender
- What is the expected outcome?
  - It should still be possible to use image extensions by using CNB-provided tooling

# What it is
[what-it-is]: #what-it-is

- Target persona: platform operator, platform implementor, and/or project contributor.

## 1. Separating the extender binary from the lifecycle

* We should remove the extender from [cmd/lifecycle](https://github.com/buildpacks/lifecycle/tree/main/cmd/lifecycle)
  * We could create [cmd/extender](https://github.com/buildpacks/lifecycle/tree/main/cmd) with its own go.mod
  * This will allow us to upgrade the docker version used by the lifecycle
  * We'll have to update our `make` targets to build both binaries
  * The extender binary will still be included in the lifecycle tarball and image, but as a separate binary rather than a symlink
  * Optionally and in the future, we could publish a "slim" version of the lifecycle that excludes the extender binary, for platforms that don't need image extension support

## 2. Providing an alternative implementation of the extender

* We will need to explore alternatives to kaniko for Dockerfile application.
  * A spike using the Docker Daemon was already completed, see here: https://github.com/buildpacks/pack/pull/1791. We were able to get it working and saw improved performance when extending the build image, but in the end we felt that the additional complexity was too much to support.
    * Note that instead of extending the build image in-container and dropping down to the CNB user to run the build phase, we simply extended the build image and saved it back to the Docker Daemon with a new reference. We then provided the new reference as the builder to use going forward. We could have done something similar when extending the run image (i.e., updated the reference in analyzed.toml).
  * Other alternatives considered are buildah and buildkit.

## 3. Removing kaniko-specific references from the platform spec

* Once we have an alternative extender working, we can decide which spec changes (if any) are needed to make it work.
  * We might need to remove the stipulation that we extend the build image in-container and drop down to the CNB user to run the build phase if that is not technically feasible. This was always only an optimization, so we should be okay here.

* For cosmetic reasons, we should at least change:
  * `<kaniko-dir>` -> `<extend-dir>` 
  * `<kaniko-cache-ttl>` -> `<extend-cache-ttl>`

# How it Works
[how-it-works]: #how-it-works

Some code that will probably need to change:
* https://github.com/buildpacks/lifecycle/blob/main/.github/workflows/build.yml - we could templatize this file to build either a vanilla lifecycle or an extender
* https://github.com/buildpacks/lifecycle/blob/main/.github/workflows/post-release.yml - where we sign and promote the lifecycle image
* https://github.com/buildpacks/pack/blob/a1edf2e9e3837c2e9eeca019b97c28896b40f778/pkg/client/create_builder.go#L270 would also need to fetch an extender
* https://github.com/buildpacks/pack/blob/a1edf2e9e3837c2e9eeca019b97c28896b40f778/internal/builder/builder.go#L1029 would also need to embed an extender
* https://github.com/buildpacks/pack/blob/a1edf2e9e3837c2e9eeca019b97c28896b40f778/pkg/client/build.go#L662 would need to fetch the "lifecycle layer" from the extender image, not the lifecycle image
  * Currently, we support `pack build --lifecycle-image` to use the non-default one, perhaps we'd need to add `--extender-image` as well
  * https://github.com/buildpacks/pack/blob/a1edf2e9e3837c2e9eeca019b97c28896b40f778/internal/config/config.go#L152 - where we fall back to buildpacksio/lifecycle if the image is not explicitly provided
* https://github.com/buildpacks/lifecycle/blob/c895ed40025a70f3de5a197f111c7d27687e1d80/cmd/lifecycle/extender.go#L59 - if we're able to find a drop-in replacement for kaniko it would go here
* https://github.com/buildpacks/lifecycle/blob/c895ed40025a70f3de5a197f111c7d27687e1d80/phase/extender.go#L264 - the meat of extension logic is in this file; an alternative extender implementation would import or duplicate this logic - see for example https://github.com/buildpacks/pack/pull/1791/files#diff-3f80ad23f1b13e75bf22e1a8aaad7d86d57e41fb823cf6142e3588c67661d556R738

# Migration
[migration]: #migration

* There may be a Platform API version bump for spec changes.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?
* It's more work!
* The lifecycle image will still include the extender binary, which means it will still get flagged by vulnerability scanners until we implement an alternative to kaniko.

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?
  - We thought about moving the extender binary to a new image, but this would
    - Require significant changes from platforms that are performing run image extension
    - Though the lifecycle image might no longer get flagged by vulnerability scanners, if we're still packing the extender into builders, builders are still going to get flagged
  - We could fork kaniko and continue to use it as the dockerfile applier. Maybe it wouldn't be too hard to maintain, especially if we rip out the parts that we're not using
- Why is this proposal the best? Maybe it's not the best, I don't know! Let's discuss
- What is the impact of not doing this? Risk of the lifecycle becoming outdated & insecure

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?
- What parts of the design do you expect to be resolved through implementation of the feature?
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
Does this RFC entail any proposed changes to the core specifications or extensions? If so, please document changes here.
Examples of a spec. change might be new lifecycle flags, new `buildpack.toml` fields, new fields in the buildpackage label, etc.
This section is not intended to be binding, but as discussion of an RFC unfolds, if spec changes are necessary, they should be documented here.

# History
[history]: #history

<!--
## Amended
### Meta
[meta-1]: #meta-1
- Name: (fill in the amendment name: Variable Rename)
- Start Date: (fill in today's date: YYYY-MM-DD)
- Author(s): (Github usernames)
- Amendment Pull Request: (leave blank)

### Summary

A brief description of the changes.

### Motivation

Why was this amendment necessary?
--->