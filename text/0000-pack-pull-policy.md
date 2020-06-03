# Meta
[meta]: #meta
- Name: `pack` Image Pull Policy
- Start Date: 2020-05-21
- Author(s): [Javier Romero](https://github.com/jromero)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

Replace the flag `--no-pull` with `--pull-policy <option>` and default to `if-not-present`.

# Motivation
[motivation]: #motivation

#### Performance

By not having to check for the latest images on every build we improve [performance](https://github.com/buildpacks/pack/issues/632#issuecomment-629458867).

#### Uncommon

The docker CLI, docker compose, and k8s default to similar functionality as described by `if-not-present`.

# What it is
[what-it-is]: #what-it-is

A new flag `--pull-policy` that takes the following possible options:

- `if-not-present` - only attempt to pull the images if it's not present
- `always` - attempt to always pull images
- `never`- don't attempt to pull images

# How it Works
[how-it-works]: #how-it-works

In the following commands, the images listed will adhere to the mentioned Pull Policy.

### `pack build`

- Builder - Used as the build environment
- Buildpacks - When refered to in `--buildpacks` or `project.toml -> [[build.buildpacks]]`
- Run (for stack) - Used as the base for the built app image
- Lifecycle - Used in cases where Builder is not trusted

### `pack create-builder`
- Builder - Used as the build environment
- Buildpacks - When refered to in `builder.toml`

### `pack rebase`
- Run (for stack) - Used as the base for the built app image

### `pack package-buildpack`
- Buildpacks - When refered to in `package.toml`

# Drawbacks
[drawbacks]: #drawbacks

- Longer CLI arguments (`--no-pull` -> `--pull-policy never`)
    - This might be a superfluous mention but does impact UX.

# Alternatives
[alternatives]: #alternatives

### Boolean flags

Instead of a single flag `--pull-policy` with multiple options, we could add to our existing boolean flags such as:

- `--no-pull`: don't attempt to pull images
- `--pull-missing`: only attempt to pull the images if it's not present
- `--always-pull`: attempt to always pull images

##### Drawbacks

- Discovery: harder to discover related flags

# Prior Art
[prior-art]: #prior-art

- [Docker CLI](https://docs.docker.com/engine/reference/commandline/build/): `docker build` works as `if-not-present` with an additional flag that changes it to `always` (`docker build --pull`).
- [Docker Compose](https://docs.docker.com/compose/reference/build/): `docker-compose build` works as `if-not-present` with an additional flag that changes it to `always` (`docker-compose build --pull`).
- [Kubernetes](https://kubernetes.io/docs/concepts/containers/images/#updating-images):
    > The default pull policy is IfNotPresent which causes the Kubelet to skip pulling an image if it already exists

# Unresolved Questions
[unresolved-questions]: #unresolved-questions


# Spec. Changes
[spec-changes]: #spec-changes

None
