# Meta
[meta]: #meta
- Name: Multi-arch support for builders and buildpack packages
- Start Date: 2023-09-14
- Author(s): @jjbustamante
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

The problem for adding support for multi-arch buildpacks can be divided into three parts:
1. Support buildpack authors to **migrate their existing buildpacks** to support multi-arch.
2. Support buildpack authors to **create new buildpacks and builders** that handle multi-arch from the beginning.
3. Support application developers to **create application images** using multi-arch buildpacks and builders.

The purpose of this RFC is to solve the statement 2, adding the capability to the commands:

- `pack buildpack package`
- `pack builder create`

to create individuals OCI images artifacts per each os and arch (builders and buildpack packages) and handle the creation for the  [image index,](https://github.com/opencontainers/image-spec/blob/master/image-index.md)
that combines them into one single consumable tag for end-users.

# Definitions
[definitions]: #definitions

- Buildpack: A buildpack is a set of executables that inspects your app source code and creates a plan to build and run your application.
- Builder: A builder is an image that contains all the components necessary to execute a build. A builder image is created by taking a build image and adding a lifecycle, buildpacks, and files that configure aspects of the build including the buildpack detection order and the location(s) of the run image
- Image Manifest: The image manifest provides a configuration and set of layers for a single container image for a specific architecture and operating system. See [spec](https://github.com/opencontainers/image-spec/blob/main/manifest.md)
- Image Index: The image index is a higher-level manifest which points to specific image manifests, ideal for one or more platforms. See [spec](https://github.com/opencontainers/image-spec/blob/main/image-index.md)

# Motivation
[motivation]: #motivation

- Why should we do this?

The uses of ARM architecture in the cloud and edge computing has been growing rapidly. The CNCF community has been also growing in the last years, and there is a need to support multi-arch for all the projects. The buildpacks community is not an exception, issues like:
- [It would be nice to support easily creating a manifest list packages and builders](https://github.com/buildpacks/pack/issues/1460)
- [Provide a way to specify desired platform when creating packages and builders](https://github.com/buildpacks/pack/issues/1459)
- [Multi arch image build support](https://github.com/buildpacks/pack/issues/1570)

Or the conversations around this topic in our [slack channel](https://cloud-native.slack.com/archives/C032LNSMY0P), even the [talk at Kubecon NA 2022](https://www.youtube.com/watch?v=Sdr5axlOnDI&list=PLj6h78yzYM2O5aNpRM71NQyx3WUe1xpTn&index=76) demonstrate the interest from the community in this feature.

- What use cases does it support?

Currently, buildpack authors can build and package their buildpacks for different OS and Architectures, but when they distribute them the URI for a buildpack can’t disambiguate, 
they need to use different tags to differentiate between them. Tools like `docker buildx imagetools create` helps to create an [image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md) to combine them but increasing their build pipelines complexity. 
For example, take a look at this recent blog [post](https://deploy-preview-53--elegant-borg-5bd068.netlify.app/blog/steps-we-took-for-a-basic-arm64-support-in-buildpacks) or the [instructions](https://github.com/dmikusa/paketo-arm64/) created from @dmikusa to build an ARM64 builder.

For those buildpack authors that are using `cross-compile` languages like [go](https://go.dev/) or [rust](https://www.rust-lang.org/) or maybe bash scripts, adding the capability to `pack buildpack package` and `pack builder create` to create multi-arch images 
and also handle the creation of an [image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md) will simplify their CI/CD pipelines and make the experience more suitable.

- What is the expected outcome?

`pack buildpack package` and `pack builder create` commands will be updated in a way that they will handle the creation of multi-arch OCI images

# What it is
[what-it-is]: #what-it-is

The end-users for this proposal are **Buildpack authors**, we expect to improve their user experience when creating multi-architecture buildpacks and builders as follows

## Multi-arch example

Let's suppose a **Buildpack author** has a `buildpack.toml` created with a content similar to this one:

```toml
# Buildpack API version
api = "0.12"

# Buildpack ID and metadata
[buildpack]
  id = "examples/my-multiarch-buildpack"
  version = "0.0.1"

# List of targets operating systems, architectures and versions

[[targets]]
os = "linux"
arch = "amd64"

[[targets]]
os = "linux"
arch = "arm64"

[[targets]]
os = "windows"
arch = "amd64"

[[targets.distributions]]
name = "windows"
versions = ["10.0.20348.1970"]
```

And organizes the binaries according to their os/arch with a structure similar to this one:

```bash
my-multiarch-buildpack
├── buildpack.toml
├── linux-amd64
│         └── bin
│             ├── build
│             └── detect
├── linux-arm64
│         └── bin
│             ├── build
│             └── detect
└── windows-amd64
    └── 10.0.20348.1970
        └── bin
            ├── build.bat
            └── detect.bat
```

Now `pack` will be able to package them separately for each os/arch family, following our [guide](https://buildpacks.io/docs/buildpack-author-guide/package-a-buildpack/) 
we will need to create a `package.toml` file.

The `package.toml` file will be similar to the one describe in our documentation:

```toml
[buildpack]
uri = "examples/my-multiarch-buildpack"
# OR a .tgz with the previous folder structure
uri = "my-multiarch-buildpack.tgz"
```

But in this case, we actually **remove** the [platform](https://buildpacks.io/docs/reference/config/package-config/) section because it will be taken from the `buildpack.toml`.

Packaging a multi-arch buildpack will require the output to be **publish** to a registry or **saved on disk** in OCI layout format.

```bash
pack buildpack package my-buildpack --config ./package.toml --publish --multi-arch
# Or
pack buildpack package my-buildpack.cnb --config ./package.toml --format file --multi-arch
```

In these cases each `target` entry corresponds to a different buildpack image that is exported into an [image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md)

### Package a multi-arch Builder

In case of packing a **Builder**, we assume the following premises: 

1. Buildpack authors migrated their `builder.toml` and [remove the stack](https://github.com/buildpacks/pack/issues/1303) concept.
2. Multi-architecture `build`, `run` images and `buildpacks` are available for baking into the **Builder**.

A sample `builder.toml` file looks like:

```toml
# Buildpacks to include in builder, these buildpacks MUST be multi-arch and point to Image Index
[[buildpacks]]
uri = "<some uri>"

[run]
# Runtime images - in case of multi-arch images it must point to Image Index
[[run.images]]
image = "index.docker.io/paketobuildpacks/run-jammy-tiny:latest"

[build]
# This image is used at build-time, in case of multi-arch images it must point to Image Index
image = "docker.io/paketobuildpacks/build-jammy-tiny:0.2.3"

[[targets]]
os = "linux"
arch = "amd64"

[[targets]]
os = "linux"
arch = "arm64"
```

As we can see, the proposal is based on the assumption that the `run-image`, `build-image` and `buildpacks` to include 
in the builder are **multi-arch artifacts**, and we can reach them by reading an 
[image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md)

```bash
pack builder create my-jammy-builder --config ./builder.toml \ 
      --multi-arch \ 
      --publish
```

In this case, because `targets` are specified and `--multi-arch` is being used `pack` will follow the builder creation process for **each provided platform**, 
pulling the correct (based on os/arch) buildpacks, build and run images and creating different builders images that are 
exported and combined into an [image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md)

# How it Works
[how-it-works]: #how-it-works

## Buildpack Package

As a quick summary, our current process to create a buildpack package involves:

- The end-users defined `os` for the OCI image using the [package.toml](https://buildpacks.io/docs/reference/config/package-config/) when they want to export a buildpack package.
- The only values allowed are `linux` and `windows` and by default when is not present, `linux` is being used.
- When exporting to daemon, the `docker.OSType` must be equal to `platform.os`

### To keep compatibility 

We propose:
- Deprecate the `platform.os` field from [package.toml](https://buildpacks.io/docs/reference/config/package-config/). It will be removed after two pack releases with the new feature
- When `platform.os` is present in [package.toml](https://buildpacks.io/docs/reference/config/package-config/), throw a warning messages indicating the field will be removed 
and `--platform` flag must be used
- When `platform.os` is not present [package.toml](https://buildpacks.io/docs/reference/config/package-config/) and `--platform` flag is not used, throw a warning messages indicating 
a new `--platform` flag is available
- Keep doing our current process to package a buildpack

### To improve user experience

We propose:
- Add a new `--platform` flag with format `[os][/arch][/variant]:[name@version]` to build for a particular target, once the `platform.os` field is removed, 
this will be the way for end-users to specify the platform for which they want to create single OCI artifact.
> **Note**
> We want to avoid duplicated information, we expect to have `targets` with all the platform supported by a buildpack

- Add a new boolean `--multi-arch` flag to indicate pack it must create multiples OCI artifacts and combine them with an [image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md), 
this flag must be used in conjunction with `--publish` or `--format file` flags and error out when `daemon` is selected.
> **Note**
> I got feedback to avoid creating an Image Index if users are not expecting that, the flag is an acknowledgment for creating the index 

- A new folder structure to organize the buildpacks binaries for multi-arch images
```bash
.
├── buildpack.toml
└── {os}-{arch}             // optional
    └── {variant}           // optional
        ├── {version-1}     // optional
        │   └── bin
        │       ├── build
        │       └── detect
        └── {version-2}     // optional
            └── bin
                ├── build
                └── detect
```
> **Note** 
> For cross-compile buildpacks like Paketo, it looks easy to add a step to their Makefile to compile and separate the binaries following this structure.

Based on the [RFC-0096](https://github.com/buildpacks/rfcs/blob/main/text/0096-remove-stacks-mixins.md) we replaced the concept of `stacks` in `buildpack.toml` by a `target` which looks like:

```toml
[[targets]]
os = "<operating system>"
arch = "<system architecture>"
variant = "<architecture variant>"
[[targets.distributions]]
name = "<distribution ID>"
versions = ["<distribution version>"]
```
- When `--multi-arch` is enabled
  - When `--publish` or `--format file` is specified
    - `pack` will read `targets` from `buildpack.toml` 
    - For each `target` an OCI image will be created, following our current process
      - `pack` will try to infer a folder structure similar to the one show above, and if it is found, those are the binaries to include in the OCI image
    - If more than 1 OCI image was created, an [image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md) will be created to combine them

### Examples

Let's use some examples to explain the expected behavior in different use cases

#### Buildpacks authors do not use targets

##### `platform.os` is not present at `package.toml`

This seems to be the case for [Paketo Buildpacks](https://github.com/paketo-buildpacks/java/blob/main/package.toml) 
or [Heroku](https://github.com/heroku/buildpacks-jvm/blob/main/meta-buildpacks/java/package.toml). A simplified version of their folder structures is:

```bash
├── bin
│ ├── build
│ └── detect
├── buildpack.toml
└── package.toml
```

In these cases, the expected output will be similar to:

```bash
pack buildpack package <buildpack> --config ./package.toml --publish 
Warning: A new '--platform' flag is available to set the target platform for the buildpack package, using 'linux' as default
Successfully published package <buildpack> and saved to registry

# Or
pack buildpack package  <buildpack> --config ./package.toml --format file 
Warning: A new '--platform' flag is available to set the target platform for the buildpack package, using 'linux' as default
Successfully created package <buildpack> and saved to file
```

We will keep `linux` as the default platform, and we don't expect end-users to change anything else on their side.

In case, Buildpack authors tries to use the new folder structure like:

```bash
├── buildpack.toml
├── linux-amd64
│ └── bin
│     ├── build
│     └── detect
├── linux-arm64
│ └── bin
│     ├── build
│     └── detect
└── package.toml
```

The current `pack` version creates an OCI artifact copying all the files on it. 

![](https://hackmd.io/_uploads/BkGkZ_mla.png)

But I think this buildpack can't be executed because `./bin/build` or `./bin/detect` can't be found. We could add some validations and throw an error,  
but I do not see any value on doing that. 

> **Important**
> New folder structure is not useful if Buildpack Authors don't remove stacks and migrate to use targets
> 

Trying to use the new flags

```bash
pack buildpack package <buildpack> --config ./package.toml --publish --multi-arch
Error: 'targets' or 'platforms' must be defined when creating a multi-architecture buildpack

# Or
pack buildpack package  <buildpack> --config ./package.toml --format file --multi-arch
Error: 'targets' or 'platforms' must be defined when creating a multi-architecture buildpack
```

In these cases, we don't have enough information to create a multi-arch buildpack, and pack must fail its execution. 

A valid way to re-write the command could be:

```bash
pack buildpack package <buildpack> --config ./package.toml --publish --platform linux/arm64 --platform linux/amd64 --multi-arch
A multi-arch buildpack package will be created for platforms: 'linux/amd64', 'linux/arm64'
Successfully published package <buildpack> and saved to registry

# Or
pack buildpack package  <buildpack> --config ./package.toml --format file --platform linux/arm64 --platform linux/amd64  --multi-arch
A multi-arch buildpack package will be created for platforms: 'linux/amd64', 'linux/arm64'
Successfully created package <buildpack> and saved to file
```

In these cases, two OCI images, with the same binaries, will be created and pushed into the registry, for each image the configuration file will be
created with the correct `os` and `architecture` and  an [image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md) will be created to combine them

what about creating a single image for a new platform?

```bash
pack buildpack package <buildpack> --config ./package.toml --publish --platform linux/arm64
Successfully published package <buildpack> and saved to registry

# Or
pack buildpack package  <buildpack> --config ./package.toml --format file --platform linux/arm64
Successfully created package <buildpack> and saved to file
```

In these cases, pack will create buildpack package image with the provided binaries and a [configuration](https://github.com/opencontainers/image-spec/blob/main/config.md#properties) 
with the following platform:

```json
{
  "architecture": "arm64",
  "os": "linux"
}
```

##### `platform.os` is present at `package.toml`

These cases are similar to the previous one, but we can change the warning message.

```bash
pack buildpack package <buildpack> --config ./package.toml --publish 
Warning: 'platform.os' field in package.toml will be deprecated, use new '--platform' flag to set target platform 
Successfully published package <buildpack> and saved to registry

# Or
pack buildpack package  <buildpack> --config ./package.toml --format file 
Warning: 'platform.os' field in package.toml will be deprecated, use new '--platform' flag to set target platform 
Successfully created package <buildpack> and saved to file
```

#### Buildpacks authors use targets

We can divide the problem in two main scenarios: Buildpack authors use or not use the new folder structure.

Let's start with the first one, which is the natural path for Buildpack Authors to migrate from `stacks` to `targets`. Let's suppose a buildpack folder structure like:

```bash
├── bin
│ ├── build
│ └── detect
├── buildpack.toml
└── package.toml
```

And a `buildpack.toml` with `targets` defined as:

```toml
[[targets]]
os = "linux"
arch = "amd64"

[[targets]]
os = "linux"
arch = "arm64"
```

How could Buildpack Authors set which `os/arch` to use?, currently `pack` doesn't care about `targets` and 
it sets `linux` as the `os` in the final OCI image. We can keep this behavior, and show warning messages to end-users, 
this will avoid breaking the current behavior.

```bash
pack buildpack package <buildpack> --config ./package.toml --publish 
Warning: Multiple targets 'linux/amd64', 'linux/arm64' are present at 'buildpack.toml' 
Warning: A new '--platform' flag is available to set the target platform for the buildpack package, using 'linux' as default
Successfully published package <buildpack> and saved to registry

# Or
pack buildpack package <buildpack> --config ./package.toml --format file 
Warning: Multiple targets 'linux/amd64', 'linux/arm64' are present at 'buildpack.toml' 
Warning: A new '--platform' flag is available to set the target platform for the buildpack package, using 'linux' as default
Successfully created package <buildpack> and saved to file

# Or
pack buildpack package <buildpack> --config ./package.toml 
Warning: Multiple targets 'linux/amd64', 'linux/arm64' are present at 'buildpack.toml' 
Warning: A new '--platform' flag is available to set the target platform for the buildpack package, using 'linux' as default
Successfully created package <buildpack> and saved to docker daemon
```

The OCI Image [configuration](https://github.com/opencontainers/image-spec/blob/main/config.md#properties) file will have: 

```json
{
  "architecture": "",
  "os": "linux"
}
```

On the other hand, when end-users use the new `platform` flag

```bash
pack buildpack package <buildpack> --config ./package.toml --publish --platform linux/arm64
Successfully published package <buildpack> and saved to registry
```

The OCI Image [configuration](https://github.com/opencontainers/image-spec/blob/main/config.md#properties) file will have:

```json
{
  "architecture": "amd64",
  "os": "linux"
}
```

Trying to create a buildpack package for an unsupported platform should throw an error

```bash
pack buildpack package <buildpack> --config ./package.toml --publish --platform windows/arm64
Error: platform 'windows/arm64' is not supported in buildpack targets, check your 'buildpack.toml'
```

Let's go one more step further, and check what will happen if Buildpack Authors use the new `--multi-arch` flag

```bash
pack buildpack package <buildpack> --config ./package.toml --publish --multi-arch
Info: A multi-arch buildpack package will be created for platforms: 'linux/amd64', 'linux/arm64'
Successfully published package <buildpack> and saved to registry
```

In this case, two OCI images will be created and pushed into the registry, for each image the configuration file will be 
created with the correct `os` and `architecture` and 
an [image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md) will be created to combine them,
with a content similar to:

```json

{
  "manifests": [
    {
      "digest": "sha256:b492494d8e0113c4ad3fe4528a4b5ff89faa5331f7d52c5c138196f69ce176a6",
      "mediaType": "application/vnd.oci.image.manifest.v1+json",
      "platform": {
        "architecture": "amd64",
        "os": "linux"
      },
      "size": 424
    },
    {
      "digest": "sha256:2589fe6bcf90466564741ae0d8309d1323f33b6ec8a5d401a62d0b256bcc3c37",
      "mediaType": "application/vnd.oci.image.manifest.v1+json",
      "platform": {
        "architecture": "arm",
        "os": "linux"
      },
      "size": 424
    }
  ],
  "mediaType": "application/vnd.oci.image.index.v1+json",
  "schemaVersion": 2
}
```
> **Important**
> In this case, the layer blob for the OCI image will have the same bin/build and bin/detect binaries. This could be helpful 
> for bash buildpacks for example. 

There is a downside for this case, how can we do it if we have windows and linux scripts?
One way to do it could be just copying the .bat scripts along with the linux scripts, something like:

```bash
├── bin
│ ├── build
│ ├── build.bat
│ ├── detect
│ └── detect.bat
├── buildpack.toml
└── package.toml
```

But we will end up distributing windows and linux scripts together. 

Finally, let's check some examples for the second scenario, when Buildpack Authors migrated from `stacks` to `targets` and 
they want to take advantage of the new multi-architecture capabilities, let's use our original folder structure:

```bash
├── buildpack.toml
├── linux-amd64
│         └── bin
│             ├── build
│             └── detect
├── linux-arm64
│         └── bin
│             ├── build
│             └── detect
└── windows-amd64
    └── 10.0.20348.1970
        └── bin
            ├── build.bat
            └── detect.bat
```

And a `buildpack.toml` with the following `targets` defined:

```toml
[[targets]]
os = "linux"
arch = "amd64"

[[targets]]
os = "linux"
arch = "arm64"

[[targets]]
os = "windows"
arch = "amd64"

[[targets.distributions]]
name = "windows"
versions = ["10.0.20348.1970"]
```

If the Buildpack Author wants to create a single buildpack package they will use the `platform` flag

```bash
pack buildpack package <buildpack> --config ./package.toml --publish --platform linux/arm64
Successfully published package <buildpack> and saved to registry
```

In this case, `pack` will determine the folder `linux-arm64` exists, and that must be the root folder for the buildpack.  
`pack` will copy `buildpack.toml` from the root and include it, something like:

```bash
linux-arm64
├── bin
│ ├── build
│ └── detect
└── buildpack.toml  // Must be copy on the fly
```

Similar to previous cases, the OCI Image [configuration](https://github.com/opencontainers/image-spec/blob/main/config.md#properties) file will have:

```json
{
  "architecture": "arm64",
  "os": "linux"
}
```

A fully multi-arch buildpack could be created as follows:

```bash
pack buildpack package <buildpack> --config ./package.toml --publish --multi-arch
Info: A multi-arch buildpack package will be created for platforms: 'linux/amd64', 'linux/arm64', 'windows/amd64'
Successfully published package <buildpack> and saved to registry
```

In this case, three OCI images will be created and pushed into the registry, for each image the configuration file will be
created with the correct platform: `os` and `architecture`,
an [image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md) will be created to combine them,
with a content similar to:

```json

{
  "manifests": [
    {
      "digest": "sha256:b492494d8e0113c4ad3fe4528a4b5ff89faa5331f7d52c5c138196f69ce176a6",
      "mediaType": "application/vnd.oci.image.manifest.v1+json",
      "platform": {
        "architecture": "amd64",
        "os": "linux"
      },
      "size": 424
    },
    {
      "digest": "sha256:2589fe6bcf90466564741ae0d8309d1323f33b6ec8a5d401a62d0b256bcc3c37",
      "mediaType": "application/vnd.oci.image.manifest.v1+json",
      "platform": {
        "architecture": "arm",
        "os": "linux"
      },
      "size": 424
    },
    {
      "digest": "sha256:ed1a67bb47f3c35d782293229127ac1f8d64873a131186c49fe079dada0fa7e0",
      "mediaType": "application/vnd.oci.image.manifest.v1+json",
      "platform": {
        "architecture": "amd64",
        "os": "windows",
        "os.version": "10.0.20348.1970"
      },
      "size": 424
    }
  ],
  "mediaType": "application/vnd.oci.image.index.v1+json",
  "schemaVersion": 2
}
```

> **Important**
> In this case, each image has different binaries according to the platform and the new folder structure
 
## Builder

Similar to how we did it for the `buildpack package`, lets summaries, our current process to create a **Builder**:

- We read the `builder.toml` and fetch the `run.image`, currently we didn't specify the `platform`, **host** `os` is being used.
- We read the `builder.toml` and fetch the `build.image`, currently we didn't specify the `platform`, **host** `os` is being used.
- We create a **base builder** from the `build.image`.
- We read the `os` and `architecture` from the **base builder**, fetch a `lifecycle` image that matches the platform (Note: lifecycle is already publish behind an [image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md))
- We add `Buildpacks` and `Extensions` to the **base builder**, because we don't define `architecture` for them, we fetch matching the **base builder** `os`
- More logic and finally the **Builder** image is created

### To keep compatibility

We propose:

- When `stacks` is present in [builder.toml](https://buildpacks.io/docs/reference/config/builder-config/), throw a warning message indicating the field is deprecated and
it will be removed
- When `targets` is not present in [builder.toml](https://buildpacks.io/docs/reference/config/builder-config/), throw a warning messages indicating
  a new `--platform` flag is available
- Keep doing our current process to create a builder

### To improve user experience

We propose:

- Add `targets` section to the `builder.toml` schema, this will keep consistency for end-users to understand how to define multi-architecture. The new schema will be
similar to:
```toml
# Buildpacks to include in builder, 
# MUST point to an Image Index that matches targets
[[buildpacks]]
uri = "<some uri>"

[run]
# Runtime images 
# MUST point to an Image Index that matches targets
[[run.images]]
image = "<run image reference>"

[build]
# This image is used at build-time
# MUST point to an Image Index that matches targets
image = "<build image reference>"

# Platforms to support with the Builder
[[targets]]
os = "<operating system>"
arch = "<system architecture>"
variant = "<architecture variant>"
[[targets.distributions]]
name = "<distribution ID>"
versions = ["<distribution version>"]
```
- Add a new `--platform` optional flag with format `[os][/arch][/variant]:[name@version]` to create a builder for a particular target, this will help end-users to specify the platform for which they want to create single OCI artifact.
- Add a new boolean `--multi-arch` flag to indicate pack it must create multiples OCI artifacts and combine them with an [image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md),
  this flag must be used in conjunction with `--publish` or `--format file` flags and error out when `daemon` is selected.

### Examples

Let's use some examples to explain the expected behavior in different use cases

#### `Targets` are not present in `builder.toml`

This is probably the case for most of the Buildpack Authors, for example [Paketo](https://github.com/paketo-buildpacks/builder-jammy-tiny/blob/main/builder.toml), lets suppose a 
`buildpack.toml` like:

```toml
# Buildpacks to include in builder
[[buildpacks]]
uri = "<some buildpacks>"

# Order used for detection
[[order]]
[[order.group]]
id = "<some order>"
version = "<some version>"

[stack]
id = "io.buildpacks.samples.stacks.jammy"
build-image = "cnbs/sample-base-build:jammy"
run-image = "cnbs/sample-base-run:jammy"
```
Or we include `build` and `run` images

```toml
# Base images used to create the builder
[build]
image = "cnbs/sample-base-build:jammy"
[run]
[[run.images]]
image = "cnbs/sample-base-run:jammy"
```

In these cases, the expected output will be similar to:

```bash
pack builder create <builder> --config ./builder.toml 
Warning: "stack" has been deprecated, prefer "targets" instead: https://github.com/buildpacks/rfcs/blob/main/text/0096-remove-stacks-mixins.md
Warning: A new '--platform' flag is available to set the target platform for the builder, using 'linux/amd64' as default
Successfully created builder image <builder>
Tip: Run pack build <image-name> --builder <builder> to use this builder
```
We expect the command to keep working as today, the builder image will be created but some **warning** messages will be 
printed to help end-users to check for new updates, maybe link to a migration guide?

Trying to use the new flags:

```bash
pack builder create <builder> --config ./builder.toml --platform linux/arm64
Warning: "stack" has been deprecated, prefer "targets" instead: https://github.com/buildpacks/rfcs/blob/main/text/0096-remove-stacks-mixins.md
Warning: creating a builder for platform "linux/arm64" but "targets" is not defined, update your "builder.toml" to include "targets"
Successfully created builder image <builder>
Tip: Run pack build <image-name> --builder <builder> to use this builder
```

Pulling operations will be configured to use `linux/arm64` as platform, 
the OCI Image [configuration](https://github.com/opencontainers/image-spec/blob/main/config.md#properties) file will have:

```json
{
  "architecture": "arm64",
  "os": "linux"
}
```

What about multi-architecture builders?

```bash
pack builder create <builder> --config ./builder.toml --multi-arch --publish 
Error: 'targets' or 'platforms' must be defined when creating a multi-architecture builder
```

In this case, pack doesn't have enough information to create a multi-arch builder and fail its execution. 

Using `platform` flag:

```bash
pack builder create <builder> --config ./builder.toml  \ 
           --multi-arch \ 
           --plaform linux/amd64 \ 
           --platform linux/arm64 \ 
           --publish 
Successfully created builder image <builder>
Tip: Run pack build <image-name> --builder <builder> to use this builder
```

In this case, two OCI images will be created and pushed into the registry, for each image the configuration file will be
created with the correct platform: `os` and `architecture`,
an [image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md) will be created to combine them

#### `Targets` are present in `builder.toml`

Let's suppose a `builder.toml` similar to this one:

```toml
[[buildpacks]]
id = "samples/java-maven"
version = "0.0.1"
uri = "<some uri>"

[[order]]
[[order.group]]
id = "samples/java-maven"
version = "0.0.1"

[build]
image = "cnbs/sample-base-build:jammy"
[run]
[[run.images]]
image = "cnbs/sample-base-run:jammy"

[[targets]]
os = "linux"
arch = "amd64"

[[targets]]
os = "linux"
arch = "arm64"
```

Let's suppose we execute the command in a host "linux/amd64" machine

```bash
pack builder create <builder> --config ./builder.toml 
Info: creating a builder for platform "linux/amd64" 
Successfully created builder image <builder>
Tip: Run pack build <image-name> --builder <builder> to use this builder
```

`platform` flag is not defined, we keep our current behavior and detect the host `os` and `architecture`. Because a 
`target` matches the host `platform` it is used to create the builder.

Trying to use the new flags:

```bash
pack builder create <builder> --config ./builder.toml --platform linux/arm64
Info: creating a builder for platform "linux/arm64" 
Successfully created builder image <builder>
Tip: Run pack build <image-name> --builder <builder> to use this builder
```

Pulling operations will be configured to use `linux/arm64` as platform,
the OCI Image [configuration](https://github.com/opencontainers/image-spec/blob/main/config.md#properties) file will have:

```json
{
  "architecture": "arm64",
  "os": "linux"
}
```

What about multi-architecture builders?

```bash
pack builder create <builder> --config ./builder.toml --multi-arch --publish 
Info: A multi-arch builder will be created for platforms: 'linux/amd64', 'linux/arm64'
Successfully created builder image <builder>
Tip: Run pack build <image-name> --builder <builder> to use this builder
```


Using `platform` flag:

```bash
pack builder create <builder> --config ./builder.toml  \ 
           --multi-arch \ 
           --plaform linux/amd64 \ 
           --platform linux/arm64 \ 
           --publish
Info: A multi-arch builder will be created for platforms: 'linux/amd64', 'linux/arm64'
Successfully created builder image <builder>
Tip: Run pack build <image-name> --builder <builder> to use this builder
```

In this case, two OCI images will be created and pushed into the registry, for each image the configuration file will be
created with the correct platform: `os` and `architecture`,
an [image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md) will be created to combine them


# Migration
[migration]: #migration

1. Align with the Stack removal [plan](https://docs.google.com/document/d/1bExpr31U5R5yQ6fncpl5YcdosWVwYcXgkt12vE-lpvU/edit)
2. Deprecate the `platform.os` field from [package.toml](https://buildpacks.io/docs/reference/config/package-config/)
    - We don't want to break current behavior, but we do want community migrate to the new approach
3. Update docs to explain the new functionality, blog posts or any other useful media communicate the message
4. Remove `platform.os` support on `pack`

# Drawbacks
[drawbacks]: #drawbacks

- New complexity will be added into `pack`

# Alternatives
[alternatives]: #alternatives

- Do nothing, Buildpack Authors can keep using other tools like`docker buildx imagetools create` or `crane` to update the `architecture` in their Manifest files or 
create [image indexes](https://github.com/opencontainers/image-spec/blob/master/image-index.md).
- Do not deprecate `platform.os` field from [package.toml](https://buildpacks.io/docs/reference/config/package-config/) and add more fields to get the same result, instead of flags
  - I didn't explore this idea

# Prior Art
[prior-art]: #prior-art

- Stack Removal [RFC #096](https://github.com/buildpacks/rfcs/blob/jjbustamante/feature/multi-arch-phase-2/text/0096-remove-stacks-mixins.md)
- This RFC is a continuation of the work started with the proposal to add commands to handle manifest list in pack, see the [RFC](https://github.com/buildpacks/rfcs/pull/283)
- Paketo [RFC #288](https://github.com/paketo-buildpacks/rfcs/pull/288) to publish multi-arch buildpacks

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- If I already have an [image indexe](https://github.com/opencontainers/image-spec/blob/master/image-index.md) created and I want to add support for new plaform, how do I do it?
- What are the intermediate images for each platform named/called?
- What happen if I want to exclude some buildpack for a particular target?
- What happen if I want to include the same file or folder for every image, do I have to copy then inside the {os}-{arch} folder?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

NA

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
