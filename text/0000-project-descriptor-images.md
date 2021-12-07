# Meta
[meta]: #meta
- Name: Support specifying images in project descriptor
- Start Date: 2021-10-26
- Author(s): [@phil9909](https://github.com/phil9909), [@modulo11](https://github.com/modulo11), [@pbusko](https://github.com/pbusko), [@jkutner](https://github.com/jkutner)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

Add a new array of tables `[[images]]` to the `project.toml` file.

# Definitions
[definitions]: #definitions

* **project descriptor**: The `project.toml` file that describes a project.
* **image**: the output of a running a buildpack(s) against a project
* **image name**: Global Unique Name (GUN) of an OCI image in the form `[REGISTRY_HOST[:REGISTRY_PORT]/]REPOSITORY[:TAG]`.

# Motivation
[motivation]: #motivation

Currently, there is no support for specifying an output image in the `project.toml` although flags like `--tag` are already present.

# What it is
[what-it-is]: #what-it-is

Buildpack user will be able to specify the resulting images in the `project.toml`:

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
registry = "gcr.io"
repository = "spring-petclinic"
tags = ["latest", "v1"]

[[images]]
repository = "spring-petclinic"
tags = ["latest", "v1"]

[[images]]
registry = "private.registry.corp:8443"
repository = "spring-petclinic"
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
  repository = "spring-petclinic"
  tags = ["latest", "v1"]
  ```

- have `tag` as a string instead of `tags` array:

  ```toml
  [[images]]
  registry = "gcr.io"
  repository = "spring-petclinic"
  tag = "latest"

  [[images]]
  registry = "docker.io"
  repository = "spring-petclinic"
  tag = "v1"

  # ...
  ```

- Simple array of strings containing all information i.e. `registry`, `repository`, `tag`

  ```toml
  images = [
      "gcr.io/spring-petclinic:latest",
      "gcr.io/spring-petclinic:v1",
      "docker.io/spring-petclinic:latest",
      "docker.io/spring-petclinic:v1"
  ]
  ```

- Simple array of images containing all information with `repository` being a placeholder

  ```toml
  repository = "spring-petclinic"
  images = [
      "gcr.io/{repository}:latest",
      "gcr.io/{repository}:v1",
      "docker.io/{repository}:latest",
      "docker.io/{repository}:v1"
  ]
  ```

# Prior Art
[prior-art]: #prior-art

- [RFC 0019 Minimal Project Descriptor](./0019-project-descriptor.md)
- [Rejected RFC PR#16](https://github.com/buildpacks/rfcs/pull/16)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Naming (`images` / `targets` / other)?
- Should `project.version` as the default value for `images.tags`?

# Spec. Changes
[spec-changes]: #spec-changes

The following will be added to the [Project Descriptor Extension Spec](https://github.com/buildpacks/spec/blob/extensions/project-descriptor%2F0.2/extensions/project-descriptor.md):

### `io.buildpacks.images` (optional)

This table MAY contain an array of image repository label definitions. The schema for this table is:

```
[[io.buildpacks.images]]
registry = "<string (optional default=docker.io)"
repository = "<string (optional, default=io.buildpacks.name)>"
tags = ["<string (optional, default=latest)>"]
```

- `registry` - a `REGISTRY_HOST[:REGISTRY_PORT]` component of the image name.
- `repository` - a `REPOSITORY` component of the image name.
- `tags` - a list of tags used as the `TAG` component of the image name.

If no `registry` is provided, the default value MUST be `"docker.io"`.

If no `repository` component is provided, the default value MUST be derived from the `io.buildpacks.name` field.

If no `tags` are provided, the default value MUST be `"latest"`.

ALL of these values MAY be overridden by a platform (ex. `pack` may allow a `--tag` flag to overwrite the specified `images` value).

Multiple `[[io.buildpacks.images]]` entries MUST result in the creation of multiple Docker image repositories. All images will have the same digest irrespective of the different names, tags, and registries that are provided.
