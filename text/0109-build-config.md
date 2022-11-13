# Meta
[meta]: #meta
- Name: Build config
- Start Date: 2022-08-29
- Author(s): [samj1912](https://github.com/samj1912)
- Status: Approved
- RFC Pull Request: [rfcs#230](https://github.com/buildpacks/rfcs/pull/230)
- CNB Pull Request: (leave blank)
- CNB Issue: [buildpacks/lifecycle#956](https://github.com/buildpacks/lifecycle/issues/956), [buildpacks/spec#330](https://github.com/buildpacks/lifecycle/issues/330), [buildpacks/docs#531](https://github.com/buildpacks/lifecycle/issues/531)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This RFC proposes an easy way to configure build images to allow specifying a `/cnb/config/env.build` CNB environment directory that allows updating the Buildpack `detect` and `build` environment based on the directory.


# Definitions
[definitions]: #definitions

- CNB environment directory: A directory that follows the conventions as defined [here](https://github.com/buildpacks/spec/blob/main/buildpack.md#provided-by-the-buildpacks)
- Operator: Owner of builders and stacks. See [CNB Operator guide](https://buildpacks.io/docs/operator-guide/).


# Motivation
[motivation]: #motivation

Often times, especially in enterprise settings, organizations often have to update the buildpacks to use internal mirrors, proxies and other settings which can be configured easily with environment variables.

Some examples include -
- `GOPROXY`
- `PIP_INDEX_URL`
- `npm_config_registry`
- `BUNDLE_MIRROR__URL`

The buildpack logic in the Buildpacks largely remains the same, except these environment variables might need to be injected during the `build` and `detect` phases.

The environment variables may ideally also take precendence over any user provided values to ensure that the operators have full control over their builders.

# What it is
[what-it-is]: #what-it-is

The RFC proposes the introduction of the following directory `/cnb/config/env.build` in build images. The directory follows the same convention as a `CNB environment directory`. The notable difference is that the environment variables sourced from this directory are applied **AFTER** processing the user-provided platform environment variables i.e. they should have the highest precedence. These variables should be available during both `detect` and `build` phases (and the `generate` phase in the future).


The operator can define this directory in the build image under `/cnb/config` or `CNB_CONFIG_DIR` if defined.

# How it Works
[how-it-works]: #how-it-works

Reference implementation available at https://github.com/buildpacks/lifecycle/pull/899/files

Examples - 

Buildpack value: `FOO=test`
Build config: `FOO.default=another-value`
Final value: `FOO=test`


Buildpack value: `FOO=test`
Build config: `FOO.append=another-value, FOO.delim="`
Final value: `FOO=test:another-value`

Buildpack value: `FOO=test`
Build config: `FOO.override=another-value`
Final value: `FOO=another-value`

Buildpack value: `FOO=test`
Platform Enviroment varaible: `FOO=value`
Build config: `FOO=another-value`
Final value: `FOO=value`

Platform Enviroment varaible: `FOO=value`
Build config: `FOO.override=another-value`
Final value: `FOO=another-value`

Platform Enviroment varaible: `FOO=value`
Build config: `FOO.prepend=another-value, FOO.delim=:`
Final value: `FOO=another-value:value`

Platform Enviroment varaible: `FOO=value`
Build config: `FOO.append=another-value, FOO.delim=:`
Final value: `FOO=value:another-value`

In case a buildpack uses `clear-env=true` then it is up to the buildpack will not see user provided platform values unless it looks in the platform directory and resolve the user provided platform values against the values set by previous buildpacks and the build config.

# Migration
[migration]: #migration

N/A

# Drawbacks
[drawbacks]: #drawbacks

- Increased complexity in sourcing of environment variables.

# Alternatives
[alternatives]: #alternatives


## Implementing at a Buildpack level

See https://github.com/paketo-buildpacks/rfcs/pull/241

# Prior Art
[prior-art]: #prior-art

- See https://github.com/paketo-buildpacks/rfcs/pull/241 and 
- See the CNB BAT meeting. https://youtu.be/e8FgLwVN5VQ?t=1153

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

N/A

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

Addition of the definition of the above directory in the Platform specification i.e. - 

- `CNB_CONFIG_DIR`
- `/cnb/config/env.build`
