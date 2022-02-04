# Meta
[meta]: #meta
- Name: Isolate Registry Credentials from Builder Images
- Start Date: 2020-01-14
- Status: Approved
- CNB Pull Request: [rfcs#43](https://github.com/buildpacks/rfcs/pull/43)
- CNB Issue:
- Supersedes: N/A

# Summary
[summary]: #summary

`pack build` will run `analyze` `restore` and `export` phases in containers built from trusted images rather than the builder image.

# Motivation
[motivation]: #motivation

Users of `pack` must select a builder image during `pack build`. The builder image is currently used to create all lifecycle phase containers.

When `pack build` is run with the `--publish` flag, the user's registry credentials are injected into the `analyze` and `export` containers as environment variables.
This means that users must place a high level of trust in their selected builder image.

Users may not realize that credentials are given to builder images and experiment with builders from untrusted vendors.

# What it is
[what-it-is]: #what-it-is

### Ephemeral Lifecycle Images

When `pack build` executes and is provided the `--publish` flag, it will generate an ephemeral "lifecycle image" on the fly, by adding a single layer container the correct lifecycle to a scratch image. `pack` will then use this image to created the `analyze`, `restore`, and `export` containers. `pack` will clean up the image when the build completes.

When generating lifecycle images `pack` will read the lifecycle version from the builder metadata and fetch the matching lifecycle version from the lifecycle github release assets.

If the lifecycle version specified in a builder image does not match any known lifecycle release, `pack build` will fail with a helpful message.

### `--trust-builder` Flag
If `pack build` is run with the `--publish` and `--trust-builder` flag, then all lifecycle steps will be run in a single container.
The registry credentials will be provided only to `analyzer` and `exporter` processes.

Users can run `pack trust-builder <build-image>` to permanently trust a builder.

### The Daemon Image Exception

When `pack build` is run without the `--publish` flag, registry credentials are not necessary.
Therefore, `pack` will treat every builder as a "trusted builder" to [potentially optimize performance](https://github.com/buildpacks/rfcs/pull/46).

# Drawbacks
[drawbacks]: #drawbacks

* This change prevents us from reducing the number of containers to improve performance in all cases
(this can still be accomplished in the "trusted builder" case)

# Alternatives
[alternatives]: #alternatives

- Keep trusting builders but plaster warnings everywhere

# Prior Art
[prior-art]: #prior-art

Creating ephemeral lifecycle images is similar to work `pack build` already does when it creates ephemeral builder images (e.g when it adds another layer because of the `--buildpack`).

# Unresolved Questions
[unresolved-questions]: #unresolved-questions
- Registry credential isolation in irrelevant when `--publish` is not supplied, should we prioritize performance or consistency in this case?
- Is there is simpler way to acheive the same level of credential isolation?
