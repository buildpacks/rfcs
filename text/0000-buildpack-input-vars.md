# Meta
[meta]: #meta
- Name: Replace positional args to Buildpack executables with env vars
- Start Date: 2021-11-18
- Author(s): [jkutner](https://github.com/jkutner)
- Status: Draft Draft
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This is a proposal to replace the positional arguments of Buildpack executables with named environment variables.

# Definitions
[definitions]: #definitions

- *positional arguments* - values passed into an executable command such that they are accessible as `$1`, `$2`, etc

# Motivation
[motivation]: #motivation

Postional arguments to Buildpack executables have been the way for the buildpack execution engine to provide inputs for buildpacks since buildpacks v1 was created. However, positional arguments are limiting, and what they represent is not obvious without reading the spec.

In the spec today they are defined as:

* `/bin/detect <platform[AR]> <plan[E]>`
* `/bin/build <layers[EIC]> <platform[AR]> <plan[ER]>`

Using env vars helps make these inputs more easily accesible from language bindings like [libcnb.bash](https://github.com/jkutner/libcnb.bash).

# What it is
[what-it-is]: #what-it-is

We will deprecate the positional arguments to `bin/detect` and `bin/build` with the following environment variables:

### bin/detect

* `CNB_PLATFORM_DIR` - replaces the first positional argument to `bin/build`. Uses the same env var name as the Platform spec.
* `CNB_BUILD_PLAN_PATH` - replaces the second positional argument to `bin/build`. Uses the same env var name as the Platform spec.

### bin/build

* `CNB_BP_LAYERS_DIR` - replaces the first positional argument to `bin/build`. Uses `_BP_` to differentiate it from the `CNB_LAYERS_DIR` in the Plaform spec, which is a different value.
* `CNB_PLATFORM_DIR` - replaces the second positional argument to `bin/build`. Uses the same env var name as the Platform spec.
* `CNB_PLAN_PATH` - replaces the third positional argument to `bin/build`. Uses the same env var name as the Platform spec.

# How it Works
[how-it-works]: #how-it-works

Provide the environment variables with the same mechanism used to provide `CNB_BUILDPACK_DIR`. For example in [lifecycle's `build.go`](https://github.com/buildpacks/lifecycle/blob/880a801db2d4bfbb39671a66f7aadd96c0231e37/buildpack/build.go):

```go
cmd.Env = append(cmd.Env, EnvPlatformDir+"="+b.Dir)
```

The positional arguments will be deprecated, but no warnings will be emitted if they are consumed. The lifecycle will continue to provide them to buildpack executable indefinitely, with no plan to remove them.

# Drawbacks
[drawbacks]: #drawbacks

- People have been using positional arguments to buildpacks for literally a decade

# Alternatives
[alternatives]: #alternatives

- Do this but don't deprecate the positional arguments (support both)

# Prior Art
[prior-art]: #prior-art

- Buildpack v1, v2a, & v2b

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

N/A

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

In the Buildpack spec:

### Detection

Executable: `/bin/detect`, Working Dir: `<app[AR]>`

| Input                     | Attributes | Description
|---------------------------|------------|----------------------------------------------
| `$0`                      |            | Absolute path of `/bin/detect` executable
| `$CNB_PLAN_PATH`          | E          | Absolute path to the build plan
| `$CNB_PLATFORM_DIR`       | AR         | Absolute path to the platform directory
| `$CNB_PLATFORM_DIR/env/`  |            | User-provided environment variables for build
| `$CNB_PLATFORM_DIR/#`     |            | Platform-specific extensions

| Output             | Description
|--------------------|----------------------------------------------
| [exit status]      | Pass (0), fail (100), or error (1-99, 101+)
| Standard output    | Logs (info)
| Standard error     | Logs (warnings, errors)
| `$CNB_PLAN_PATH`   | Contributions to the the Build Plan (TOML)

###  Build

Executable: `/bin/build`, Working Dir: `<app[AI]>`

| Input                     | Attributes | Description
|---------------------------|------------|----------------------------------
| `$0`                      |            | Absolute path of `/bin/build` executable
| `$CNB_BP_LAYERS_DIR`      | EIC        | Absolute path to the buildpack layers directory
| `$CNB_PLAN_PATH`          | ER         | Relevant [Buildpack Plan entries](#buildpack-plan-toml) from detection (TOML)
| `$CNB_PLATFORM_DIR`       | AR         | Absolute path to the platform directory
| `$CNB_PLATFORM_DIR/env/`  |            | User-provided environment variables for build
| `$CNB_PLATFORM_DIR/#`     |            | Platform-specific extensions

| Output                                   | Description
|------------------------------------------|--------------------------------------
| [exit status]                            | Success (0) or failure (1+)
| Standard output                          | Logs (info)
| Standard error                           | Logs (warnings, errors)
| `$CNB_BP_LAYERS_DIR/launch.toml`                   | App metadata (see [launch.toml](#launchtoml-toml))
| `$CNB_BP_LAYERS_DIR/launch.sbom.<ext>`             | Launch Software Bill of Materials (see [Software-Bill-of-Materials](#bill-of-materials))
| `$CNB_BP_LAYERS_DIR/build.toml`                    | Build metadata (see [build.toml](#buildtoml-toml))
| `$CNB_BP_LAYERS_DIR/build.sbom.<ext>`              | Build Software Bill of Materials (see [Software-Bill-of-Materials](#bill-of-materials))
| `$CNB_BP_LAYERS_DIR/store.toml`                    | Persistent metadata (see [store.toml](#storetoml-toml))
| `$CNB_BP_LAYERS_DIR/<layer>.toml`                  | Layer metadata (see [Layer Content Metadata](#layer-content-metadata-toml))
| `$CNB_BP_LAYERS_DIR/<layer>.sbom.<ext>`            | Layer Software Bill of Materials (see [Software-Bill-of-Materials](#bill-of-materials))
| `$CNB_BP_LAYERS_DIR/<layer>/bin/`                  | Binaries for launch and/or subsequent buildpacks
| `$CNB_BP_LAYERS_DIR/<layer>/lib/`                  | Shared libraries for launch and/or subsequent buildpacks
| `$CNB_BP_LAYERS_DIR/<layer>/profile.d/`            | Scripts sourced by Bash before launch
| `$CNB_BP_LAYERS_DIR/<layer>/profile.d/<process>/`  | Scripts sourced by Bash before launch for a particular process type
| `$CNB_BP_LAYERS_DIR/<layer>/exec.d/`               | Executables that provide env vars via the [Exec.d Interface](#execd) before launch
| `$CNB_BP_LAYERS_DIR/<layer>/exec.d/<process>/`     | Executables that provide env vars for a particular process type via the [Exec.d Interface](#execd) before launch
| `$CNB_BP_LAYERS_DIR/<layer>/include/`              | C/C++ headers for subsequent buildpacks
| `$CNB_BP_LAYERS_DIR/<layer>/pkgconfig/`            | Search path for pkg-config for subsequent buildpacks
| `$CNB_BP_LAYERS_DIR/<layer>/env/`                  | Env vars for launch and/or subsequent buildpacks
| `$CNB_BP_LAYERS_DIR/<layer>/env.launch/`           | Env vars for launch (after `env`, before `profile.d`)
| `$CNB_BP_LAYERS_DIR/<layer>/env.launch/<process>/` | Env vars for launch (after `env`, before `profile.d`) for the launched process
| `$CNB_BP_LAYERS_DIR/<layer>/env.build/`            | Env vars for subsequent buildpacks (after `env`)
| `$CNB_BP_LAYERS_DIR/<layer>/*`                     | Other content for launch and/or subsequent buildpacks
