# Meta
[meta]: #meta
- Name: Support for pull images from or push images to insecure image registries.
- Start Date: 2022-08-17
- Author(s): wanjunlei
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This RFC describes how to pull images from or push images to insecure image registries when building images using buildpacks.

# Definitions
[definitions]: #definitions

Insecure image registry - The insecure image registry mentioned in this RFC refers to the image registry using the http protocol, and with a non-internal ip or a domain name. Because currently buildpacks can access insecure image registries using internal ip.

# Motivation
[motivation]: #motivation

To fix issue [Support insecure registries in non-daemon case](https://github.com/buildpacks/lifecycle/issues/524).

To pull images from insecure image registries when building images using buildpacks, and push target images to insecure image registries after the build is complete.

# What it is
[what-it-is]: #what-it-is

With this RFC, user can use images in insecure image registries to build image, and push the compiled image to the insecure image registries like this.

```shell
creator --run-image=develoment-registry.com/run-java:v16 --insecure-registry=develoment-registry.com --insecure-registry=testing-registry.com testing-registry.com/java-sample:latest
```

The flag `--insecure-registry` will add to analyzer, export, restor, rebaser and image tool too.

# How it Works
[how-it-works]: #how-it-works

With this [PR](https://github.com/buildpacks/imgutil/pull/154), the component that buildpacks used to operate images, already supports pulling images from or pushing images to insecure registries.
We should create a image with insecure registry by calling [NewImage](https://github.com/buildpacks/imgutil/blob/main/remote/remote.go#L119) like this

```shell
remote.NewImage(imageName, authn.DefaultKeychain, withRegistrySetting("mydomain.registry.com:1080", true, false)
```
> The second parameter specify whether the registry is insecure.
> The third parameter can be always false.

It is necessary to judge whether the registry where this image is located is insecure. If so, it needs to set the insecure registry through `WithRegistrySetting`.

The `NewImage` can set base image and prev image using `FromBaseImage` and `WithPreviousImage`, so it may need to call `WithRegistrySetting` multiple times to set up multiple insecure registries.

# Drawbacks
[drawbacks]: #drawbacks

N/A

# Alternatives
[alternatives]: #alternatives

N/A

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

N/A

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

A new flag `--insecure-registry` will add to analyzer, creator, export, restor, rebaser and image tool.