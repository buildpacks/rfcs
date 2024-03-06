# Meta
[meta]: #meta
- Name: Add extension layer to exchange data
- Start Date: 2023-10-09
- Author(s): [c0d1ngm0nk3y](https://github.com/c0d1ngm0nk3y), [pbusko](https://github.com/pbusko)
- Status: Approved
- RFC Pull Request:
- CNB Pull Request:
- CNB Issue:
- Related: [RFC#0105 Support Dockerfiles](https://github.com/buildpacks/rfcs/blob/main/text/0105-dockerfiles.md)
- Supersedes: N/A

# Summary
[summary]: #summary

This RFC introduces support for Extension configurable context to allow data transfer between the build environment and the Kaniko execution.

# Motivation
[motivation]: #motivation

This change allows extensions to create their own context for the extend phase during the generation phase. Additionally, it ensures that extension output does not inadvertently interfere with other extension or buildpack layers during the build, and it does not unintentionally become part of the final application image.

This would allow distroless run images to be extended.

# What it is
[what-it-is]: #what-it-is

This follows up on RFC-0105 and proposes that during the execution of the extension's `./bin/generate`, an extension is allowed to write arbitrary data to the `context` folder within its exclusive output directory. This data then becomes accessible during the execution of the `extend` phase via Kaniko build context. The content of these extension-specific context is ignored at build and launch time, it serves only the extension phase.

# How it Works
[how-it-works]: #how-it-works

- Before execution of the `./bin/generate`, the lifecycle will create a distinct writable layer `$CNB_GENERATED_DIR/<extension-id>` for each extension which passed detection.
- The `$CNB_GENERATED_DIR/<extension-id>` is provided to the `./bin/generate` as `<output>` (`$CNB_OUTPUT_DIR`) directory.
- In addition to the files specified in [RFC#0105](https://github.com/buildpacks/rfcs/blob/main/text/0105-dockerfiles.md), the extension may create the following folders with an arbitrary content:

    either:

    - `<output>/context`

    or the image-specific folders:

    - `<output>/context.run`
    - `<output>/context.build`
  
  If the `<output>/context` is provided together with any of the image-specific folders the detection phase must fail.
- If the folder `<output>/context` is present it will be set as Kaniko build context during the `extend` phase of the build and run images.
- If the folder `<output>/context.run` is present it will be set as Kaniko build context during the `extend` phase of the run image only.
- If the folder `<output>/context.build` is present it will be set as Kaniko build context during the `extend` phase of the build image only.
- If none of these folders is not present, Kaniko build context defaults to the `<app>` folder.
 
The `$CNB_GENERATED_DIR/<extension-id>` folders will not be included in the final image by the lifecycle.

### Example: Extend distroless run image with Debian packages.

This example extension would allow to install `tar` package on the run image without package manager (distroless image). The extension contains `./bin/generate` and `./bin/custom-installer` file, which installs `.deb` files.

##### `./bin/generate`

```bash
#!/bin/sh

mkdir -p ${CNB_OUTPUT_DIR}/context.run

cp ${CNB_EXTENSION_DIR}/bin/custom-installer ${CNB_OUTPUT_DIR}/context.run/
curl -o ${CNB_OUTPUT_DIR}/context.run/tar.deb http://security.ubuntu.com/ubuntu/pool/main/t/tar/tar_1.34+dfsg-1ubuntu0.1.22.04.1_amd64.deb

cat >> "${CNB_OUTPUT_DIR}/run.Dockerfile" <<EOL
ARG base_image
FROM \${base_image}
ARG build_id=0

ADD custom-installer .
ADD tar.deb .
RUN ./custom-installer -p ./tar.deb
EOL
```

# Migration
[migration]: #migration

- No breaking changes were identified

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

N/A

# Alternatives
[alternatives]: #alternatives

- Allow multi-stage Dockerfiles

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should the `./bin/generate` be executed during the `extend` phase instead of the `detect` phase?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

This RFC requires changes to the layers metadata and the `extend` phase:

- the `$CNB_OUTPUT_DIR` must point to the `$CNB_GENERATED_DIR/<extension-id>` folder instead of a temporary directory.
- allow optional folders `$CNB_GENERATED_DIR/<extension-id>/context`, `$CNB_GENERATED_DIR/<extension-id>/context.run` and `$CNB_GENERATED_DIR/<extension-id>/context.build` with an arbitrary content to be provided by extension.
- if the context folders are present, kaniko context should be set to the corresponding folder instead of the `<app>` (following the rules defined in [#how-it-works](#how-it-works)).

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