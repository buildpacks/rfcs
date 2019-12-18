# Meta
[meta]: #meta
- Name: Defining Mixins for io.buildpacks.stacks.bionic
- Start Date: 2019-12-05
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

The Buildpack API Specification allows stack maintainers to define stack mixins for a given stack.
The Cloud Native Buildpacks project informally defines stack build and run images with ID `io.buildpacks.stacks.bionic` as containing exactly the set of Ubuntu packages in the `ubuntu:bionic` image on Docker Hub.
This RFC proposes that we formalize the existing definition of `io.buildpacks.stacks.bionic` and define mixins on that stack to be Ubuntu 18.04 LTS package names (without version or architecture info) from official package mirrors. 

In general, a stack is a contract that should be more like "Ubuntu Bionic" and less like "Platform XYZ's Re-distribution of Ubuntu Binoic."
Stack images can still be provided by platforms/vendors, but they should use the standard CNB stack contracts where applicable.

# Motivation
[motivation]: #motivation

This will allow:
1. Buildpack authors to publish buildpacks that are compatible with more stack images without requiring those authors to explicitly specify vendor-specific stack IDs.
2. Vendor-specific buildpacks to work together in the same build, as long as those buildpacks support `io.buildpacks.stacks.bionic`.
3. App developers to create custom stack images that are compatible with any set of buildpacks that support `io.buildpacks.stacks.bionic`.

# Example
[example]: #example

Say `org.cloudfoundry.stacks.cfbionicstack` is `ubuntu:bionic`, but with `build-essentials` in the build image and `git` in both build and run images.

We would change the image metadata from:
```
run stackID: "org.cloudfoundry.stacks.cfbionicstack"
run mixins: []
build stackID: "org.cloudfoundry.stacks.cfbionicstack"
build mixins: []
```
To:
```
run stackID: "io.buildpacks.stacks.bionic"
run mixins: ["git"]
build stackID: "io.buildpacks.stacks.bionic"
build mixins: ["build:build-essentials", "git"]
```

And buildpack authors would update their `buildpack.toml` files from:
```toml
[[stacks]]
id = "org.cloudfoundry.stacks.cfbionicstack"
```
To:
```toml
[[stacks]]
id = "io.buildpacks.stacks.bionic"
mixins = ["build:build-essentials", "git"] # NOTE: only need to list mixins they actually require!
```

# Drawbacks
[drawbacks]: #drawbacks

- This could encourage buildpack authors and app developers to create a large number of unmaintained stack images that have different sets of Ubuntu packages.
- Breaking change for buildpack authors once old stack images are removed.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Neither the spec nor this RFC suggest whether or not stack authors or app developers are allowed to make additional changes to stack images without using mixin metadata.
- This RFC doesn't propose a way for the project to describe changes to `ubuntu:bionic` that are not official LTS Ubuntu 18.04 packages.
- When package groups (like `build-essential`) or dependent packages are installed, must stack images always specify all the packages added? Or is it only necessary when stack image authors want buildpacks to be able to depend on the dependent packages?

# Alternatives
[alternatives]: #alternatives

- Continue to maintain separate vendor-specific stack IDs.
