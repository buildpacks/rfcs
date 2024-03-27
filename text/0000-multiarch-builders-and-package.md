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
1. Support buildpack authors to **migrate their existing buildpacks** to support multiple operating systems, architectures, variants and distros.
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
- Buildpack root folder: is the top-most directory where a `buildpack.toml` can be found
- Platform root folder: Based on our new folder structure, the **platform root folder** is the top-most directory that identifies a target in **buildpack root folder**
  For example:
    - given a target `linux/amd64` the **platform root folder** will be `<buildpack root folder>/linux/amd64`
    - given a target `windows/amd64:windows@10.0.20348.1970` the **platform root folder** will be `<buildpack root folder>/windows/amd64/windows@10.0.20348.1970`

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

Let's suppose a **Buildpack author** has a `buildpack.toml` updated to include `targets` as follows:

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

# Stacks (deprecated) the buildpack will work with
[[stacks]]
id = "*"
```

And organizes the binaries according to their os/arch with a structure similar to this one:

```bash
my-multiarch-buildpack
.
├── buildpack.toml
├── linux
│ ├── amd64
│ │ └── bin
│ │     ├── build
│ │     └── detect
│ └── arm64
│     └── bin
│         ├── build
│         └── detect
└── windows
    └── amd64
        └── windows@10.0.20348.1970
            └── bin
                ├── build.bat
                └── detect.bat
```

Now `pack` will be able to package them separately for each os/arch family. 

Following our [guide](https://buildpacks.io/docs/buildpack-author-guide/package-a-buildpack/) we will need to create a 
`package.toml` let's suppose it looks like this:

```toml
[buildpack]
uri = "examples/my-multiarch-buildpack"
# OR a .tgz with the previous folder structure
uri = "my-multiarch-buildpack.tgz"
```

In this case we **remove** the [platform](https://buildpacks.io/docs/reference/config/package-config/) section because it will be taken from the `buildpack.toml`.

Packaging a multi-arch buildpack will require the output to be **publish** to a registry or **saved on disk** in OCI layout format.

```bash
pack buildpack package my-buildpack --config ./package.toml --publish
# Or
pack buildpack package my-buildpack.cnb --config ./package.toml --format file
```

> **Important**
> pack will determine a multi-arch buildpack package is being created because there are more than one target defined.  

Each `target` entry corresponds to a different buildpack image that is exported into an [image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md)

### Package a multi-arch Builder

In case of packing a **Builder**, we assume the following premises: 

1. Buildpack authors updated their `builder.toml` to include the new `targets` fields defined in this [RFC](https://github.com/buildpacks/rfcs/blob/main/text/0096-remove-stacks-mixins.md). 
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

# Stack (deprecated) 
[stack]
id = "io.buildpacks.stacks.jammy.tiny"
# This image is used at build-time
build-image = "docker.io/paketobuildpacks/build-jammy-tiny:0.2.3"
# This image is used at runtime
run-image = "index.docker.io/paketobuildpacks/run-jammy-tiny:latest"
```

As we can see, the proposal is based on the assumption that the `run-image`, `build-image` and `buildpacks` to include 
in the builder are **multi-arch artifacts**, and we can reach them by reading an 
[image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md)

Packaging a multi-arch builder will require the output to be **publish** to a registry.

```bash
pack builder create my-jammy-builder --config ./builder.toml --publish
```
> **Important**
> Similar to the `buildpack package,` pack will determine a multi-arch builder must be created based on the multiple targets defined.

In this case `pack` will follow the builder creation process for **each provided target**, 
pulling the correct (based on os/arch) buildpacks, build and run images and creating different builders images that are 
exported and combined into an [image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md)

# How it Works
[how-it-works]: #how-it-works

## Buildpack Package

As a quick summary, our current process to create a buildpack package involves:

- The end-users defined `os` for the OCI image using the [package.toml](https://buildpacks.io/docs/reference/config/package-config/).
- The only values allowed are `linux` and `windows` and by default when is not present, `linux` is being used.
- When exporting to daemon, the `docker.OSType` must be equal to `platform.os`
- When building a single buildpack package, `package.toml` is optional

### To keep compatibility 

We propose:
- Deprecate the `platform.os` field from [package.toml](https://buildpacks.io/docs/reference/config/package-config/). It will be removed after two pack releases with the new feature
- When `platform.os` is present in [package.toml](https://buildpacks.io/docs/reference/config/package-config/), throw a warning messages indicating the field will be removed 
and `--target` flag must be used
- When `platform.os` is not present in [package.toml](https://buildpacks.io/docs/reference/config/package-config/) and `--target` flag is not used, throw a warning messages indicating 
a new `--target` flag is available and how to use it, or some helpful information on how to add `targets` to the `buildpack.toml`
- Keep doing our current process to package a buildpack

### To improve user experience

We propose:
- Add a new `--target` flag using the format `[os][/arch][/variant]:[name@version]` to build for a particular target, once the `platform.os` field is removed, 
this will be the way for end-users to specify the platform for which they want to create single OCI artifact.

- Add `targets` section to `buildpack.toml` to help Buildpack Authors to include support for new platforms without having to update their `pack buildpack package` command in their CI/CD pipelines

- A new folder structure to organize the buildpacks binaries for multi-arch images, similar to this one:
```bash
# Option 1 - no variant is required
.
├── buildpack.toml                 // mandatory
└── {os}                           // optional
    └── {arch}                     // optional (becomes the platform root folder)
        └── bin
            ├── build              // platform dependent binary (mandatory)
            └── detect             // platform dependent binary (mandatory)

# Option 2 - variant is required
.
├── buildpack.toml                  // mandatory
└── {os}                            // optional
    └── {arch}                      // optional
        └── {variant}               // optional
            ├── {name@version-1}    // optional  (becomes the platform root folder)
            │   └── bin
            │       ├── build       // platform dependent binary (mandatory)
            │       └── detect      // platform dependent binary (mandatory)
            └── {name@version-2}    // optional (becomes the platform root folder)
                └── bin
                    ├── build       // platform dependent binary (mandatory)
                    └── detect      // platform dependent binary (mandatory)
```
- `buildpack.toml` file MUST be present in the **buildpack root folder**
- For each platform, Buildpack Authors are responsible for copying or creating symlink or hard link for files into each **platform root folder** 

> **Note**
> For cross-compile buildpacks like Paketo, it looks easy to add a step to their Makefile to compile and separate the binaries following this structure. It is important to mention
> that the final buildpack image will not change, this will only change the buildpack structure from `pack` perspective

In case this folder structure is not suitable for Buildpack Authors, **we propose** a new `path` attribute to be included 
in the `targets` section of the `buildpack.toml`, to specify where the **buildpack root directory** is located in the filesystem.

Based on the [RFC-0096](https://github.com/buildpacks/rfcs/blob/main/text/0096-remove-stacks-mixins.md) the new `buildpack.toml` schema will look like this:

```toml
[[targets]]
os = "<operating system>"
arch = "<system architecture>"
variant = "<architecture variant>"
# optional
path = "<path to look for the binaries if the folder structure convention is not followed>" 

[[targets.distributions]]
name = "<distribution ID>"
versions = ["<distribution version>"]
```
- When `more than 1 target is defined`
  - When `--publish` is specified
    - For each `target` an OCI image will be created, following these rules
      - `pack` will determine the **platform root folder**, this is the specific root folder for a given `target` (based on the `targets.path` in the buildpack.toml or inferring it from a folder structure similar to the one show above)
      - `pack` will execute the current process to create a buildpack package using the **platform root folder** and the `target` values  
    - If more than 1 OCI image was created, an [image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md) will be created to combine them
  - When `--format file` is specified AND `<file-name>` is the expected name for the `.cnb` file
    - For each `target` an OCI layout file will be created, following these rules
      - `pack` will determine the **platform root folder**, this is the specific root folder for a given `target` (based on the `targets.path` in the buildpack.toml or inferring it from a folder structure similar to the one show above)
      - `pack` will execute the current process to create a buildpack package (.cnb file) using the **platform root folder** and the `target` values
      - `pack` will saved on disk the `.cnb` file with a name `<file-name>-[os][-arch][-variant]-[name@version].cnb`
  - When `--daemon` is specified
    - `pack` can keep using `docker.OSType` to determine the target `os` and probably can do some validations it the `os` is valid target

### Examples

Let's use some examples to explain the expected behavior in different use cases

#### How to determine the platform root folder

Let's suppose the Buildpack Author creates a multi-arch folder structure and wants to create multiple buildpack packages

```bash
.
├── buildpack.toml   
└── linux
   ├── amd64
   │   └── bin
   │      ├── build
   │      ├── detect
   │      └── foo
   └── arm64
       ├── foo
       └── bin
          ├── build
          ├── detect
          └── bar
```

- When `linux/amd64` the **platform root folder** determined is `<buildpack root folder>/linux/amd64`, and the expected
folder structure in the OCI image for each buildpack package will be:

```bash

.
└── cnb
    └── buildpacks
        └── {ID}
            └── {version}
                ├── bin
                │    ├── build
                │    ├── detect
                │    └── foo         // specific platform binary
                └── buildpack.toml
```

On the other hand, When target is `linux/arm64`, the **platform root folder** determined is `<buildpack root folder>/linux/arm64`
and the output OCI image folder structure looks like:
```bash
.
└── cnb
    └── buildpacks
        └── {ID}
            └── {version}
                ├── bin
                │    ├── bar        // specific platform binary
                │    ├── build
                │    └── detect
                ├── buildpack.toml
                └── foo
```

#### Buildpacks authors do not use targets or the new folder structure

This seems to be the case for [Paketo Buildpacks](https://github.com/paketo-buildpacks/maven) 
or [Heroku](https://github.com/heroku/buildpacks-jvm/tree/main/buildpacks/maven), and it represents how `pack` 
will work for most the users when new behavior is implemented

A simplified version of Buildpack Authors folder structures is:

```bash
├── bin
│ ├── build
│ └── detect
├── buildpack.toml
└── package.toml
```

In these cases: We expect `pack` to keep doing what is doing today, but with the warning messages we mentioned above to 
let end users know things are changing. 

```bash
pack buildpack package <buildpack> --config ./package.toml --publish 
Warning: A new '--target' flag is available to set the platform for the buildpack package, using 'linux' as default
Successfully published package <buildpack> and saved to registry

# Or
pack buildpack package  <buildpack> --config ./package.toml --format file 
Warning: A new '--target' flag is available to set the platform for the buildpack package, using 'linux' as default
Successfully created package <buildpack> and saved to file
 ```
**Output**: pack will create a buildpack package image (as it is doing it today) with the provided binaries and a 
[configuration](https://github.com/opencontainers/image-spec/blob/main/config.md#properties) with the following target 
platform:

```json
{
  "architecture": "",
  "os": "linux"
}
```

After checking the **warning** messages, some end users must feel curious, and the try to use the new `--target` flag.

```bash
pack buildpack package <buildpack> --config ./package.toml --publish --target linux/arm64
Successfully published package <buildpack> and saved to registry

# Or
pack buildpack package  <buildpack> --config ./package.toml --format file --target linux/arm64
Successfully created package <buildpack> and saved to file
```

**Output**: In these cases, pack will create buildpack a package image with the provided binaries and a 
[configuration](https://github.com/opencontainers/image-spec/blob/main/config.md#properties) with the following target 
platform:

```json
{
  "architecture": "arm64",
  "os": "linux"
}
```

> **Important**
> Pack will assume the binaries are appropriate for the given target platform, what the flag is doing is expose a mechanism
> to update the metadata present in the OCI config file

what about creating a multi-platform image for several targets?

```bash
pack buildpack package <buildpack> --config ./package.toml --publish --target linux/arm64 --target linux/amd64
A multi-arch buildpack package will be created for target platforms: 'linux/amd64', 'linux/arm64'
Successfully published package <buildpack> and saved to registry

# Or
pack buildpack package <buildpack> --config ./package.toml --format file --target linux/arm64 --target linux/amd64
A multi-arch buildpack package will be created for target platforms: 'linux/amd64', 'linux/arm64'
Successfully created package <buildpack> and saved to file
```

**Output**: two OCI images, with the same binaries, will be created and pushed into the registry, for each image the 
configuration file will be created with the correct `os` and `architecture` and an 
[image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md) will be created to combine them
using the `<buildpack>` name provided. The content of the [image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md) 
will be similar to:

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
        "architecture": "arm64",
        "os": "linux"
      },
      "size": 424
    }
  ],
  "mediaType": "application/vnd.oci.image.index.v1+json",
  "schemaVersion": 2
}
```

#### Buildpacks authors do not use targets AND `platform.os` is present at `package.toml`

Let's suppose the `package.toml` has the following:

```toml
[buildpack]
uri = "<A URL or path to an archive, or a path to a directory>"

[platform]
os = "linux"
```
These cases are similar to the previous one, but the warning message will be changed.

```bash
pack buildpack package <buildpack> --config ./package.toml --publish 
Warning: 'platform.os' field in package.toml will be deprecated, use new '--target' flag or `targets` field in buildpack.toml to set the platform.
Successfully published package <buildpack> and saved to registry

# Or
pack buildpack package  <buildpack> --config ./package.toml --format file 
Warning: 'platform.os' field in package.toml will be deprecated, use new '--target' flag or `targets` field in buildpack.toml to set the platform.
Successfully created package <buildpack> and saved to file
```
**Output**: The OCI Image [configuration](https://github.com/opencontainers/image-spec/blob/main/config.md#properties) file will have:

```json
{
  "architecture": "",
  "os": "linux"
}
```

Trying to use `--target` flag with `platform.os` field at the same time should throw an error, in this way, the end-user will need to update
their `package.toml`

```bash
pack buildpack package <buildpack> --config ./package.toml --publish  --target linux/arm64
# Or
pack buildpack package  <buildpack> --config ./package.toml --format file  --target linux/arm64

Error: 'platform.os' and '--target' flag can not be used in conjunction, please remove 'platform.os' from package.toml, use new '--target' flag 
       or `targets` field in buildpack.toml to set the platform
```

#### Buildpacks authors use targets

> **Important**
> `pack` considers the use of `targets` as an acknowledgement of expecting a multi-arch images as output. Also, we expect
> `platform.os` do not be present in `buildpack.toml`

We can divide the problem in two main scenarios: Buildpack authors use or not use the new folder structure.

##### New folder structure is not use

Let's start with the first one, which is the natural path for Buildpack Authors that are using `bash` buildpacks. 
Let's suppose a buildpack folder structure like:

```bash
├── bin
│ ├── build
│ └── detect
└── buildpack.toml
```

And a `buildpack.toml` with `targets` defined as:

```toml
[[targets]]
os = "linux"
arch = "amd64"

[[targets]]
os = "linux"
arch = "arm64"

# Stacks (deprecated) the buildpack will work with
[[stacks]]
id = "*"
```

```bash
pack buildpack package <buildpack> --config ./package.toml --publish 
A multi-arch buildpack package will be created for target platforms: 'linux/amd64', 'linux/arm64'
Successfully published package <buildpack> and saved to registry

# Or
pack buildpack package <buildpack> --config ./package.toml --format file 
A multi-arch buildpack package will be created for target platforms: 'linux/amd64', 'linux/arm64'
Successfully created package <buildpack> and saved to file
```

**Output**: In this case, two OCI images will be created and pushed into the registry, for each image the configuration file will be
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

On the other hand, when end-users use the new `--target` flag, they can create a single OCI artifact

```bash
pack buildpack package <buildpack> --config ./package.toml --publish --target linux/arm64
Successfully published package <buildpack> and saved to registry
```

**Output**: The OCI Image [configuration](https://github.com/opencontainers/image-spec/blob/main/config.md#properties) file will have:

```json
{
  "architecture": "amd64",
  "os": "linux"
}
```

In case of targeting the daemon, pack will match **daemon os/arch** with the **targets os/arch**, for example when running
on a `linux/arm64` machine.

```bash
pack buildpack package <buildpack> --config ./package.toml 
Successfully created package <buildpack> and saved to docker daemon 
```

**Output**: pack will create a buildpack package image with the provided binaries and a
[configuration](https://github.com/opencontainers/image-spec/blob/main/config.md#properties) with the following target
platform:

```json
{
  "architecture": "arm64",
  "os": "linux"
}
```

But, if we execute the same command on a **windows/amd64** machine, the `buildpack.toml` doesn't contain any `target` that 
matches the **daemon os/arch**, an error must be thrown
```bash
pack buildpack package <buildpack> --config ./package.toml 
Error: daemon platform 'windows/amd64' does not match target platforms: 'linux/amd64', 'linux/arm64'
```

##### New folder structure is use

Finally, let's check some examples for the second scenario, when Buildpack Authors want to take advantage of the new 
multi-architecture capabilities, let's use our original folder structure:

```bash
.
├── buildpack.toml
├── linux
│ ├── amd64
│ │ └── bin
│ │     ├── build
│ │     └── detect
│ └── arm64
│     └── bin
│         ├── build
│         └── detect
└── windows
    └── amd64
        └── windows@10.0.20348.1970
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

# Stacks (deprecated) the buildpack will work with
[[stacks]]
id = "*"
```

When Buildpack Authors want to create a multi-arch images, they can execute the following command:
```bash
pack buildpack package <buildpack> --config ./package.toml --publish
Info: A multi-arch buildpack package will be created for target platforms: 'linux/amd64', 'linux/arm64', 'windows/amd64'
Successfully published package <buildpack> and saved to registry
```
A fully multi-arch buildpack will be created automatically, because we have more than one target defined
in the `buildpack.toml`

**Output**: In this case, three OCI images will be created and pushed into the registry, for each image the configuration file will be
created with the correct target: `os` and `architecture`,
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

If the Buildpack Author wants to create a single buildpack package they will use the `target` flag, similar to our previous 
examples.

## Composite Buildpack Package

When packaging a composite buildpack we need a `package.toml` to declare the dependencies, this could be improved and there is an [issue](https://github.com/buildpacks/pack/issues/1082) for it 
but today the `package.toml` is mandatory on `pack`. Also, it's important to remember that **we can't** use `targets` in the `buildpack.toml` when we also need to declare an `order` so this open
the question: 

**Where do we define targets for composite buildpacks?**
The natural answer will be `package.toml`, as it already defines the dependencies, it seems very straight forward to include this section for this particular case. The new schema will look like:

```toml
[buildpack]
uri = "<A URL or path to an archive, or a path to a directory. If path is relative, it must be relative to the package.toml>" 

[[targets]]
os = "<operating system>"
arch = "<system architecture>"
variant = "<architecture variant>"

[[targets.distributions]]
name = "<distribution ID>"
versions = ["<distribution version>"]

[[dependencies]]
uri = "<A URL or path to an archive, a packaged buildpack (saved as a .cnb file), or a directory. If path is relative, it must be relative to the package.toml>"

# Deprecated
[platform]
os = "<The operating system type that the buildpackage will run on. Only linux or windows is supported. If omitted, linux will be the default.>"
```

This information will help `pack` to determine a multi-arch composite buildpack is expected, but there is another 
problem to solve, currently, the dependencies can be located in several places:
 - OCI Registry
 - Local file in the filesystem (.cnb) file
 - Local folder in the filesystem
 - A .tar.gz file in a remote S3 bucket accessible through HTTPS

**How will pack find the correct artifact for each target?**

For the OCI registry case, we'd expect Buildpack Authors to release multi-arch single buildpacks behind an 
[image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md) and pulling these dependencies 
will be a natural process, this will be the **only valid** locator in the `dependencies.uri` in cases where a multi-arch
composite buildpack is expected to be built.

## Builder

Similar to how we did it for the `buildpack package`, lets summaries, our current process to create a **Builder**:

- We read the `builder.toml` and fetch the `build.image`, currently we didn't specify the `platform`, **daemon** `os/arch` is being used.
- We create a **base builder** from the `build.image`.
- We read the `os` and `architecture` from the **base builder**
  - Fetch the `run.image`, matching the `os/arch` with the values from the **base builder**
  - Fetch the `lifecycle` image that matches the platform (Note: lifecycle is already publish behind an [image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md))
  - We add `Buildpacks` and `Extensions` to the **base builder** trying to match the **base builder** `os/arch`, in case the `architecture` doesn't match, we fall back to match the **base builder** `os`
- More logic and finally the **Builder** image is created

### To keep compatibility

We propose:

- When `stacks` is present in [builder.toml](https://buildpacks.io/docs/reference/config/builder-config/), throw a warning message indicating the field is deprecated and
it will be removed
- When `targets` is not present in [builder.toml](https://buildpacks.io/docs/reference/config/builder-config/), throw a warning messages indicating
  a new `--target` flag is available
- Keep doing our current process to create a builder

### To improve user experience

We propose:

- Add `targets` section to the `builder.toml` schema, this will keep consistency for end-users to understand how to 
define multi-architecture. Adding more than one target to the `builder.toml` will be considered by `pack` as an 
acknowledgement of the desire to generate [Builders](https://buildpacks.io/docs/concepts/components/builder/) with multiple platform targets.  

The new schema will be
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

# Target platforms to support with the Builder
[[targets]]
os = "<operating system>"
arch = "<system architecture>"
variant = "<architecture variant>"
[[targets.distributions]]
name = "<distribution ID>"
versions = ["<distribution version>"]
```
- Add a new `--target` optional flag with format `[os][/arch][/variant]:[name@version]` to create a builder for a 
particular target, this will help end-users to specify the platform for which they want to create single OCI artifact.

### Examples

Let's use some examples to explain the expected behavior in different use cases

#### `Targets` are not present in `builder.toml`

This is probably the case for most of the Buildpack Authors, for example 
[Paketo](https://github.com/paketo-buildpacks/builder-jammy-tiny/blob/main/builder.toml), lets suppose a`buildpack.toml` 
like:

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
Warning: A new '--target' flag is available to set the target platform for the builder, using 'linux/amd64' as default
Successfully created builder image <builder>
Tip: Run pack build <image-name> --builder <builder> to use this builder
```
We expect the command to keep working as today, the builder image will be created but some **warning** messages will be 
printed to help end-users to check for new updates, maybe link to a migration guide?

Trying to use the new flags:

```bash
pack builder create <builder> --config ./builder.toml --target linux/arm64
Warning: "stack" has been deprecated, prefer "targets" instead: https://github.com/buildpacks/rfcs/blob/main/text/0096-remove-stacks-mixins.md
Warning: creating a builder for platform "linux/arm64" but "targets" is not defined, update your "builder.toml" to include "targets"
Successfully created builder image <builder>
Tip: Run pack build <image-name> --builder <builder> to use this builder
```

**Output**: Pulling operations will be configured to use `linux/arm64` as target platform, 
the OCI Image [configuration](https://github.com/opencontainers/image-spec/blob/main/config.md#properties) file will have:

```json
{
  "architecture": "arm64",
  "os": "linux"
}
```

What about multi-architecture builders?

Using `target` flag:

```bash
pack builder create <builder> --config ./builder.toml  \ 
           --target linux/amd64 \ 
           --target linux/arm64 \ 
           --publish 
Successfully created builder image <builder>
Tip: Run pack build <image-name> --builder <builder> to use this builder
```

**Output**: two OCI images will be created and pushed into the registry, for each image the configuration file will be
created with the correct target: `os` and `architecture`, an 
[image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md) will be created to combine them

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

Let's suppose we execute the command against a daemon running in a `linux/amd64` machine

```bash
pack builder create <builder> --config ./builder.toml 
Info: creating a builder for target "linux/amd64" 
Successfully created builder image <builder>
Tip: Run pack build <image-name> --builder <builder> to use this builder
```

**Output**: We keep our current behavior and detect the `os` and `architecture` from the daemon. Because there is `target` 
that matches the daemon `os/arch` the builder is being built.

<!--  
```bash
pack builder create <builder> --config ./builder.toml --target linux/arm64
Info: creating a builder for target "linux/arm64"
Warning: 
Successfully created builder image <builder>
Tip: Run pack build <image-name> --builder <builder> to use this builder
```

Pulling operations will be configured to use `linux/arm64` as target platform,
the OCI Image [configuration](https://github.com/opencontainers/image-spec/blob/main/config.md#properties) file will have:

```json
{
  "architecture": "arm64",
  "os": "linux"
}
```
--> 

What about multi-architecture builders?

```bash
pack builder create <builder> --config ./builder.toml --publish 
Info: A multi-arch builder will be created for targets platform: 'linux/amd64', 'linux/arm64'
Successfully created builder image <builder>
Tip: Run pack build <image-name> --builder <builder> to use this builder
```

Using `target` flag:

```bash
pack builder create <builder> --config ./builder.toml  \ 
           --target linux/amd64 \ 
           --target linux/arm64 \ 
           --publish
Info: A multi-arch builder will be created for targets platform: 'linux/amd64', 'linux/arm64'
Successfully created builder image <builder>
Tip: Run pack build <image-name> --builder <builder> to use this builder
```

**Output** In both cases, two OCI images will be created and pushed into the registry, for each image the configuration file will be
created with the correct target platform: `os` and `architecture`,
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

- How would I add support for a new platform to an existing [image index](https://github.com/opencontainers/image-spec/blob/master/image-index.md)?
- What are the intermediate images for each target named/called?
- What happen if I want to exclude some buildpack for a particular target?
- What happen if I want to include the same file or folder for every image, do I have to copy then inside the {os}-{arch} folder?
- Initially we proposed a shared file strategy but, we decided to leave that complexity out of the scope of this RFC and can be 
revisited later if it required

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
