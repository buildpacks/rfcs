# Meta
[meta]: #meta
- Name: Add extension layer to exchange data
- Start Date: 2023-10-09
- Author(s): [c0d1ngm0nk3y](https://github.com/c0d1ngm0nk3y), [pbusko](https://github.com/pbusko)
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
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

This follows up on RFC-0105 and proposes that during the execution of the extension's `./bin/generate`, an extension is allowed to write arbitrary data to the `context` folder within its exclusive layer. This data then becomes accessible during the execution of the `extend` phase via Kaniko build context. The content of these extension-specific layers is ignored at build and launch time, it serves only the extension phase.

# How it Works
[how-it-works]: #how-it-works

- New root directory `/layers-ext` is introduced which contains extension layers.
- Before execution of the `./bin/generate`, the lifecycle will create a distinct writable layer `/layers-ext/<extension-id>` for each extension which passed detection.
- The `/layers-ext/<extension-id>` is provided to the `./bin/generate` as `<output>` directory.
- In addition to the files specified in [RFC#0105](https://github.com/buildpacks/rfcs/blob/main/text/0105-dockerfiles.md), the extension may create the `<output>/context` folder with an arbitrary content.
- If the folder `<output>/context` is present it will be set as Kaniko build context during the `extend` phase instead of the `<app>` directory.
- If the folder `<output>/context` is not present, Kaniko build context defaults to the `<app>` folder.
 
The `/layers-ext` will not be included in the final image by the lifecycle.

### Example: Extend distroless run image with Debian packages.

This example extension would allow to install `tar` package on the run image without package manager (distroless image). The extension contains `./bin/generate` and `./bin/custom-installer` file, which installs `.deb` files.

##### `./bin/generate`

```bash
#!/bin/sh

mkdir -p ${CNB_OUTPUT_DIR}/context

cp ${CNB_EXTENSION_DIR}/bin/custom-installer ${CNB_OUTPUT_DIR}/context/
curl -o ${CNB_OUTPUT_DIR}/context/tar.deb http://security.ubuntu.com/ubuntu/pool/main/t/tar/tar_1.34+dfsg-1ubuntu0.1.22.04.1_amd64.deb

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

- allow optional folder `<output>/context` with an arbitrary content to be provided by extension.
- if the `<output>/context` is present, kaniko context should be set to this folder instead of the `<app>`.

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