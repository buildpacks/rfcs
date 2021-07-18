# Meta
[meta]: #meta
- Name: Support Dockerfiles
- Start Date: 2021-06-30
- Author(s): sclevine
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: [RFC0069](https://github.com/buildpacks/rfcs/blob/main/text/0069-stack-buildpacks.md), [RFC#167](https://github.com/buildpacks/rfcs/pull/167)
- Depends on: [RFC#172](https://github.com/buildpacks/rfcs/pull/172)

# Summary
[summary]: #summary

This RFC introduces functionality for customizing base images, as an alternative to stackpacks.

# Motivation
[motivation]: #motivation

Relying on Dockerfiles for base image generation and manipulation allows us to apply buildpacks only to the problem that they solve best: managing application runtimes and dependencies.

# What it is
[what-it-is]: #what-it-is

This RFC proposes that we replace stackpacks with multi-purpose build-time and runtime Dockerfiles.

# How it Works
[how-it-works]: #how-it-works

Note: kaniko, buildah, BuildKit, or the original Docker daemon may be used to apply Dockerfiles at the platform's discretion. 

### Builder-specified Dockerfiles

A builder image may include any number of "hook" files in `/cnb/hooks.d/`.
The `pack create-builder` command is used to copy hooks into the builder image via `builder.toml`. E.g.,
```toml
[[hooks]]
name = "app-hook"
path = "./myhook"
```
(Note: this format should not be considered final. Additional fields will be required to mark the format, target, etc. of the hook. These may be defined in subsequent spec PRs / sub-team RFCs.)

Each hook file path must be in the format `/cnb/hooks.d/<name>.(build.|run.|)<format>(.out|)`, where:

1. `build`, `run`, or empty specify the build-time base image, runtime base image, or both bash images, respectively.
2. The only valid format is `Dockerfile`, although support for, e.g. LLB JSON, could be added in the future.
3. If the `.out` suffix is present and the file is executable, the hook is executed in the context of the app directory, and its output must match `<format>`.
4. If the `.out` suffix is not present, the contents of the file must match `<format>`.

Hook files are evaluated (either read or executed) and the resulting Dockerfiles are applied to the build-time and runtime base images in lexographical order by `<name>`.
Executable hook files must not modify the app directory when executed and may be executed in parallel.
However, the resulting Dockerfiles must not be applied in parallel.
A Dockerfile intended for the runtime base image is applied after the detection phase.
A Dockerfile intended for the build-time base image is applied before the detection phase.

If an executable hook exits with a non-zero status value, the build fails.
If a executable hook exits with a zero status value and no output, the hook is ignored. 
Directories are ignored.
Files at the top-level of `/cnb/hooks.d/` that do not match the specified file name format result in a build failure.

Both Dockerfiles must accept `base_image` and `build_id` args.
The `base_image` arg allows the lifecycle to specify the original base image.
The `build_id` arg allows the app developer to bust the cache after a certain layer and must be defaulted to `0`. When the `$build_id` arg is referenced in a `RUN` instruction, all subsequent layerrs will be rebuilt on the next build (as the value will change).

A runtime base image may indicate that it preserves ABI compatibility by adding the label `io.buildpacks.rebasable=true`. In the case of builder-specified Dockerfiles, `io.buildpacks.rebasable=false` is set automatically before a runtime Dockerfile is applied and must be explicitly set to `true` if desired. Rebasing an app without this label set to `true` requires passing a new `--force` flag to `pack rebase`.


#### Example: App-specified Dockerfile Hook

This example hook would allow an app to provide runtime and build-time base image extensions as "run.Dockerfile" and "build.Dockerfile."
The app developer can decide whether the extensions are rebasable.

##### `/cnb/hooks.d/app.build.Dockerfile.out`
```
#!/bin/sh
cat build.Dockerfile
```
##### `/cnb/hooks.d/app.run.Dockerfile.out`
```
#!/bin/sh
cat run.Dockerfile
```

#### Example: RPM Dockerfile Hook

This example hook would allow a builder to install RPMs for each language runtime.

Note: The Dockerfiles referenced must disable rebasing, and build times will be slower compared to buildpack-provided runtimes.

##### `/cnb/hooks.d/app.Dockerfile.out`
```
#!/bin/sh
[[ -f Gemfile.lock ]] && cat /cnb/hooks.d/app.Dockerfile.d/Dockerfile-ruby
[[ -f package.json ]] && cat /cnb/hooks.d/app.Dockerfile.d/Dockerfile-node
```

### Platform-specified Dockerfiles

The same Dockerfile format may be used to create new base images or modify existing base images outside of the app build process. Any specified labels override existing values.

Dockerfiles that are used to create a base image must create a `/cnb/image/genpkgs` executable that outputs a [CycloneDX](https://cyclonedx.org)-formatted list of packages in the image with PURL IDs when invoked. This executable is executed after all Dockerfiles are applied, and the output replaces the label `io.buildpacks.sbom`. This label doubles as a Software Bill-of-Materials for the base image. In the future, this label will serve as a starting point for the application SBoM.

### Example Dockerfiles

Dockerfile used to create a runtime base image:

```
ARG base_image
FROM ${base_image}
ARG build_id=0

LABEL io.buildpacks.image.distro=ubuntu
LABEL io.buildpacks.image.version=18.04
LABEL io.buildpacks.rebasable=true

ENV CNB_USER_ID=1234
ENV CNB_GROUP_ID=1235

RUN groupadd cnb --gid ${CNB_GROUP_ID} && \
  useradd --uid ${CNB_USER_ID} --gid ${CNB_GROUP_ID} -m -s /bin/bash cnb

USER ${CNB_USER_ID}:${CNB_GROUP_ID}

COPY genpkgs /cnb/image/genpkgs
```

`run.Dockerfile` for use with the example `app.run.Dockerfile.out` hook that always installs the latest version of curl:
```
ARG base_image
FROM ${base_image}
ARG build_id=0

RUN echo ${build_id}

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
```
(note: this Dockerfile disables rebasing, as OS package installation is not rebasable)

`run.Dockerfile` for use with the example `app.run.Dockerfile.out` hook that installs a special package to /opt:
```
ARG base_image
FROM ${base_image}
ARG build_id=0

LABEL io.buildpacks.rebasable=true

RUN curl -L https://example.com/mypkg-install | sh # installs to /opt
```
(note: rebasing is explicitly allowed because only a single directory in /opt is created)


# Drawbacks
[drawbacks]: #drawbacks

- Involves breaking changes.

# Alternatives
[alternatives]: #alternatives

- Stackpacks

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should `genpkgs` be part of this proposal? Opinion: Yes, otherwise it's difficult to maintain a valid SBoM.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

This RFC requires extensive changes to all specifications.
