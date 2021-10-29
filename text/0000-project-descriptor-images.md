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

Currently there is no support for specifying the output image in the `project.toml` although flags like `--tags` are already present.

# What it is
[what-it-is]: #what-it-is

buildpack user will be able to specify the resulting images name in the `project.toml`


# How it Works
[how-it-works]: #how-it-works

- Accepted project descriptor related RFCs
  - https://github.com/buildpacks/rfcs/blob/main/text/0019-project-descriptor.md
  - https://github.com/buildpacks/rfcs/blob/main/text/0054-project-descriptor-schema.md
  - https://github.com/buildpacks/rfcs/blob/main/text/0080-builder-key-in-project-descriptor.md (could serve as a role-model)
  - https://github.com/buildpacks/rfcs/blob/main/text/0084-project-descriptor-domains.md
  - Closed PR which includes some similar changes: https://github.com/buildpacks/rfcs/blob/project-descriptor-simple/text/0000-project-descriptor.md

```toml
[[images]]
name = "spring-petclinic"
registry = "gcr.io"
tags = ["latest", "v1"]

[[images]]
name = "spring-petclinic"
registry = "hub.docker.com"
tags = ["latest", "v1"]
```

- Tags:
  - Could be read from the `--tags` flag
  - Could be defaulted to `project.lversion` field of `project.toml`
- Name: Could just be taken from `project.name` (if present)

# Drawbacks
[drawbacks]: #drawbacks

TBD

# Alternatives
[alternatives]: #alternatives


- have `registries` as an array:

  ```toml
  [images]
  registries = ["gcr.io", "hub.docker.com"]
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
  registry = "hub.docker.com"
  name = "spring-petclinic"
  tag = "v1"

  # ...
  ```

- Simple array of strings containing all information i.e. `registry`, `name`, `tag`

  ```toml
  images = [
      "gcr.io/spring-petclinic:latest",
      "gcr.io/spring-petclinic:v1",
      "hub.docker.com/spring-petclinic:latest",
      "hub.docker.com/spring-petclinic:v1"
  ]
  ```

- Simple array of images containing all information with `name` being a placeholder

  ```toml
  name = "spring-petclinic"
  images = [
      "gcr.io/{name}:latest",
      "gcr.io/{name}:v1",
      "hub.docker.com/{name}:latest",
      "hub.docker.com/{name}:v1"
  ]
  ```

> Why is this proposal the best?

Is it? Lets discuss.

# Prior Art
[prior-art]: #prior-art

- [RFC 0019 Minimal Project Descriptor](./0019-project-descriptor.md)
- [Rejected RFC PR#16](https://github.com/buildpacks/rfcs/pull/16)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

Let us know.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

TBD
