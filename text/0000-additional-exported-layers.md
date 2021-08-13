# Meta
[meta]: #meta
- Name: Additional exportable layers
- Start Date: 2021-08-13
- Author(s): [@samj1912](https://github.com/samj1912)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

Allow users to provide additional paths that can be exported similar to the application directory and allow easy configuration of the application directory. These paths are defined via the [`VOLUME`](https://docs.docker.com/engine/reference/builder/#volume) directive in `Dockerfile` and stored in the [`Volumes` object](https://github.com/opencontainers/image-spec/blob/main/config.md#properties) in the image config.

# Definitions
[definitions]: #definitions

- `Workspace`: The default application directory where the application source code is mounted and final build outputs are written. This directory is exported.
- `Volume`: A set of directories describing where the buildpack process is likely to write data specific and should be exported alongside the application workspace. 
- `WorkingDir`: The default working directory for a container.

# Motivation
[motivation]: #motivation

The main motivation behind this RFC is to unlock exporting application images that require libraries or software to be installed in certain directories apart from the default application directory and these installations are rebase safe and self-contained. This unlocks use cases where buildpacks may install software in `/opt` directories (for AWS Lambda extensions or other common standalone software) for example or preserve some settings in a `/home/$USER/.config` for the output application. This provides a rebase safe extension point without major changes to the buildpacks API.

# What it is
[what-it-is]: #what-it-is

Users would be able to define stack images with `VOLUME` directives in Dockerfiles.


For example a build/run base image may look like - 

```Dockerfile
# Set a common base
FROM ubuntu:bionic as base

# Set required CNB information
ENV CNB_USER_ID=1000
ENV CNB_GROUP_ID=1000
ENV CNB_STACK_ID="io.buildpacks.samples.stacks.bionic"
LABEL io.buildpacks.stack.id="io.buildpacks.samples.stacks.bionic"

# Create the user
RUN groupadd cnb --gid ${CNB_GROUP_ID} && \
  useradd --uid ${CNB_USER_ID} --gid ${CNB_GROUP_ID} -m -s /bin/bash cnb

# Start a new run stage
FROM base as run

# Volume instructions to identify paths that the lifecycle
# may safely overlay on the run image.
# This would ensure that these paths are rebase safe as
# docker currently discards any changes made to directories
# declared as volumes. See https://docs.docker.com/engine/reference/builder/#notes-about-specifying-volumes
VOLUME ["/app", "/opt/extensions", "/home/cnb/.config"]

# Set user and group (as declared in base image)
USER ${CNB_USER_ID}:${CNB_GROUP_ID}

# Start a new build stage
FROM base as build

# Volume instruction in the build image that the lifecycle
# will export out. This must match the volumes declared in the run image.
VOLUME ["/app", "/opt/extensions", "/home/cnb/.config"]

# Optionally users can override the default application workspace
# by specifying it through the WORKDIR directive in the build
# and run images.
WORKDIR /app

# Set user and group (as declared in base image)
USER ${CNB_USER_ID}:${CNB_GROUP_ID}
```

Buildpacks will be passed a list of volumes through the `CNB_EXPORT_VOLUMES` variable and this variable would be a JSON list. Buildpacks may read this environment variable during `detect` or `build`.

# How it Works
[how-it-works]: #how-it-works

This RFC would require changes to the lifecycle and platform API.

The platform would be responsible for mounting appropriate volumes based on the `Volumes` key in the OCI image config. For a platform like `pack` which relies on a daemon this should be fairly straight-forward to achieve since `docker run` automatically mounts appropriate volumes. For other platforms like `kpack` this would involve inspecting the builder image beforehand and modifying the build pod spec to accommodate the specified volumes.

The lifecycle changes would involve exporting the files present in the above locations which should be similar to the logic that currently exists for exporting application workspace. Buildpacks could also take advantage of `slices` to specify paths in these additional directories that should exist as separate layers.

Changes to the Buildpack API would be minimal and would mostly involve the Buildpacks being passed the additional `CNB_EXPORT_VOLUMES` variable for detection and build logic.

# Drawbacks
[drawbacks]: #drawbacks

N/A.

# Alternatives
[alternatives]: #alternatives

This proposal is useful as it relies of existing OCI image/Docker conventions to add a much needed extension point to the API.

# Prior Art
[prior-art]: #prior-art

- [RFC 72](https://github.com/buildpacks/rfcs/blob/main/text/0072-image-workdir.md)
- [RFC PR #172](https://github.com/buildpacks/rfcs/pull/172)
- [RFC PR #173](https://github.com/buildpacks/rfcs/pull/173)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

None.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

As noted above.