# Meta
[meta]: #meta
- Name: Support specifying images in project descriptor
- Start Date: 2021-10-26
- Author(s): tbd
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

Add a new `images` key in the `project.toml` file.

# Definitions
[definitions]: #definitions

* **project descriptor**: The `project.toml` file that describes a project.
* **image**: the output of a running a buildpack(s) against a project
* **image name**: fully qualified name of an OCI image in the form `<registry>/<name>:<tag>`.

# Motivation
[motivation]: #motivation

Currently, there is no support for specifying an output image in the `project.toml` although flags like `--tag` are already present.

# What it is
[what-it-is]: #what-it-is

We propose the following changes, so that buildpack user will be able to specify the resulting images in the `project.toml`:

- Add an optional top level array of tables `[[images]]`, that describes resulting images.

```toml
[[images]]
name = "<string>"
registry = "<string>"
tags = ["string"]
```

- `images.name`: mandatory.
- `images.tags`: optional, defaults to `latest`.
- `images.registry`: optional, defaults to `docker.io`.

`pack`'s flag `--tag` should take precedence over `images` blocks specified in a `project.toml`.

# How it Works
[how-it-works]: #how-it-works

- Accepted project descriptor related RFCs
  - https://github.com/buildpacks/rfcs/blob/main/text/0019-project-descriptor.md
  - https://github.com/buildpacks/rfcs/blob/main/text/0054-project-descriptor-schema.md
  - https://github.com/buildpacks/rfcs/blob/main/text/0080-builder-key-in-project-descriptor.md (could serve as a role-model)
  - https://github.com/buildpacks/rfcs/blob/main/text/0084-project-descriptor-domains.md
  - Closed PR which includes some similar changes: https://github.com/buildpacks/rfcs/blob/project-descriptor-simple/text/0000-project-descriptor.md

Example:

```toml
[[images]]
name = "spring-petclinic"
registry = "gcr.io"
tags = ["latest", "v1"]

[[images]]
name = "spring-petclinic"
tags = ["latest", "v1"]

[[images]]
name = "spring-petclinic"
registry = ["private.registry.corp:8443"]
```

This example will produce the following images:

- `gcr.io/spring-petclinic:latest`
- `gcr.io/spring-petclinic:v1`
- `docker.io/spring-petclinic:latest`
- `docker.io/spring-petclinic:v1`
- `private.registry.corp:8443/spring-petclinic:latest`

# Alternatives
[alternatives]: #alternatives

- have `registries` as an array:

  ```toml
  [images]
  registries = ["gcr.io", "docker.io"]
  name = "spring-petclinic"
  tags = ["latest", "v1"]
  ```

- have `tag` as a string instead of `tags` array:

  ```toml
  [[images]]
  registry = "gcr.io"
  name = "spring-petclinic"
  tag = "latest"

  [[images]]
  registry = "docker.io"
  name = "spring-petclinic"
  tag = "v1"

  # ...
  ```

- Simple array of strings containing all information i.e. `registry`, `name`, `tag`

  ```toml
  images = [
      "gcr.io/spring-petclinic:latest",
      "gcr.io/spring-petclinic:v1",
      "docker.io/spring-petclinic:latest",
      "docker.io/spring-petclinic:v1"
  ]
  ```

- Simple array of images containing all information with `name` being a placeholder

  ```toml
  name = "spring-petclinic"
  images = [
      "gcr.io/{name}:latest",
      "gcr.io/{name}:v1",
      "docker.io/{name}:latest",
      "docker.io/{name}:v1"
  ]
  ```

# Prior Art
[prior-art]: #prior-art

- [RFC 0019 Minimal Project Descriptor](./0019-project-descriptor.md)
- [Rejected RFC PR#16](https://github.com/buildpacks/rfcs/pull/16)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Naming (`images` / `targets` / other)?
- Should `project.name` be used instead of `images.name`?
- Should `project.version` be used instead of `images.tags`?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

The following will be added to the [Project Descriptor Extension Spec](https://github.com/buildpacks/spec/blob/extensions/project-descriptor%2F0.2/extensions/project-descriptor.md):

### `io.buildpacks.images` (optional)

This table MAY contain an array of image repository label definitions. The schema for this table is:

```
[[io.buildpacks.images]]
name = "<string (optional, default=io.buildpacks.name)>"
tags = ["<string (optional, default=latest)>"]
registry = "<string (optional default=docker.io)"
```

* `name` - the name component of an image repository
* `tags` - a list of tags used as the tag component of images in an image repository
* `registry` - a registry server containing the image repository

If no `name` component is provided, the default value MUST be derived from the `io.buildpacks.name` field.

If no `tags` are provided, the default value MUST be `"latest"`.

If no `registry` is provided, the default value MUST be `"docker.io"`.

ALl of these values MAY be overridden by a platform (ex. `pack` may allow a `--tag` flag to overridden the provided `tag` value).

Multiple `[[io.buildpacks.images]]` entries MUST result in the creation of multiple Docker image repositories. All images will have the same digest irrespective of the different names, tags, and registries that are provided.
