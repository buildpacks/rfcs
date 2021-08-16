# Meta
[meta]: #meta
- Name: Combine and organize metadata file locations across lifecycle
- Start Date: 2021-03-11
- Author(s): [jabrown85](https://github.com/jabrown85) [samj1912](https://github.com/samj1912)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This is a proposal to change the default locations of several files and directories. Part of the reasoning behind this is to disambiguate metadata files from application or layer files and avoid naming collisions.

# Motivation
[motivation]: #motivation

Currently all the metadata files live under the `<layers>` folder. This means that application metadata files like `launch.toml`, `build.toml` or `store.toml` share the same directory as layer metadata files. Since the layers could possibly be named `launch`, `build` or `store` this leads to ambiguity, conflicts and/or restrictions on layer names and their associated metadata files that should not exist. This also prevents us from possibly adding new metadata files in the future without breaking backwards compatibility with buildpacks who may have been creating layers with the same name. This proposal seeks to disambiguate special metadata files from free-form layer metadata files.


# What it is
[what-it-is]: #what-it-is

The proposal is as follows -

The current folder structure is -

```
/cnb (provided by builder image)
├── buildpacks
│   └── <buildpacks>
├── lifecycle
│   └── <creator/builder/etc>
├── order.toml
└── stack.toml
/platform (configurable with `CNB_PLATFORM_DIR`)
├── env 
└   └── <env>
/layers (configurable with `CNB_LAYERS_DIR` or -layers)
├── analyzed.toml
├── group.toml
├── plan.toml
├── order.toml (written by a platform, optionally - prior to `lifecycle` execution)
├── project-metadata.toml (written by a platform, optionally - prior to `lifecycle` execution, configurable with `CNB_PROJECT_METADATA_PATH`)
├── report.toml
├── <escaped_buildpack_id> (buildpack arg `$1`)
│   ├── build.toml
│   ├── launch.toml
│   ├── store.toml
│   ├── <layer>.toml
│   └── <layer>
└── config
    └── metadata.toml
/workspace (configurable with `CNB_APP_DIR ` or -app)
└── <app source code to transform>
```

This proposal is to change this folder structure to -

```
/cnb (provided by builder image)
├── buildpacks
│   └── <buildpacks>
├── lifecycle
│   └── <creator/builder/etc>
├── order.toml
└── stack.toml
/platform (configurable with `CNB_PLATFORM_DIR`)
├── env 
└   └── <env>
/workspace (configurable with `CNB_WORKSPACE_DIR`)
├── app (configurable with `CNB_APP_DIR ` or -app)
│    └── <app source code to transform>
├── layers (configurable with `CNB_LAYERS_DIR` or -layers)
│   └── new-buildpack (`CNB_BUILDPACK_LAYERS_DIR`)
│       ├── <layer>.toml
│       └── <layer>
│   └── old-buildpack (buildpack arg `$1`)
│       ├── build.toml
│       ├── launch.toml
│       ├── store.toml
│       ├── <layer>.toml
│       └── <layer>
├── config
│   └── layers (configurable with `CNB_LAYERS_CONFIG_DIR`)
│       ├── metadata.toml
│       └── new-buildpack (`CNB_BUILDPACK_CONFIG_DIR`)
│        ├── build.toml
│        ├── launch.toml
│        └── store.toml
│   └── lifecycle (configurable with `CNB_LIFECYCLE_CONFIG_DIR`)
│       ├── analyzed.toml
│       ├── group.toml
│       ├── plan.toml
│       └── report.toml
│   └── platform (configurable with `CNB_PLATFORM_CONFIG_DIR`)
│       ├── order.toml (written by a platform, optionally - prior to `lifecycle` execution)
└       └── project-metadata.toml (written by a platform, optionally - prior to `lifecycle` execution, configurable with `CNB_PROJECT_METADATA_PATH`)
```

# How it Works
[how-it-works]: #how-it-works

The top-level `cnb` remains unchanged. The new `/workspace` purpose is a directory that holds all the files during a build. This directory is likely to be a volume mount on a platform. The platform may choose to use multiple mounts at any of the levels under `/workspace`. By locating files that are not layer specific in new sub-directories, we will gain the ability to add new directories and files to `/workspace` without name collisions.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

The complexity introduced into lifecycle to keep the compatibility between versions is not to be disregarded. It would also result in longer path names. We would also have to re-work the export logic to account for the export of the various files which are partially present in the `config` sub-directory and the `layers` sub-directory.

Platform maintainers will have to update their mounts and configuration to update to the platform API that implements this.

An example migration that wishes to use the new defaults may look like this

Before:
```
	appMount := corev1.VolumeMount{
		Name:      appVolume,
		MountPath: "/workspace",
	}

	layersMount := corev1.VolumeMount{
		Name:      layersVolume,
		MountPath: "/layers",
	}
```

After:
```
	workspaceMount := corev1.VolumeMount{
		Name:      workspaceVolume,
		MountPath: "/workspace",
	}
```

If the platform wishes to keep the app source code on it's own volume for any reason, it would look more like this:
```
	workspaceMount := corev1.VolumeMount{
		Name:      workspaceVolume,
		MountPath: "/workspace",
	}

	appMount := corev1.VolumeMount{
		Name:      appVolume,
		MountPath: "/workspace/app",
	}
```

If a platform wants to keep the changes to an absolute minimum they could do so by setting the configuration to something like this:
```
CNB_APP_DIR=/workspace
CNB_LAYERS_DIR=/layers
CNB_PLATFORM_CONFIG_DIR=/layers
CNB_LIFECYCLE_CONFIG_DIR=/layers
CNB_LAYERS_CONFIG_DIR=/layers/config
CNB_WORKSPACE_DIR=/layers
```

This would allow for everything to be stored in the already configured `/layers` volume and use the existing `/workspace` for the app source code. Future upgrades with this configuration could lead to name collisions between layers and new CNB directories.

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?

## `/cnb` being the root for everything

`/cnb` being the entire root was considered but is less desirable due to conflicting specifications (distribution). If buildpacks are located in `/cnb/buildpacks` on a builder - this makes it impossible for a single mount of `/cnb` for a platform. Platforms would have to juggle multiple mounts.

## `/cnb/workspace` being the root for build-specific files

This makes the path deeper than we want. `/layers` would turn into `/cnb/workspace/layers` by default.

## Why is this proposal the best?

Although this is a drastic change, this also open up possibilities in the future to introduce other top level concepts inside the `CNB_WORKSPACE_DIR` apart from the current ones while still allowing layer names to be free-form and without any restrictions.

## What is the impact of not doing this?

We keep having this ambiguity and possible issues in the future when we want to add more of such special files.


# Prior Art
[prior-art]: #prior-art

- [RFC 0053](https://github.com/buildpacks/rfcs/blob/main/text/0053-decouple-buildpack-plan-and-bom.md)


# Unresolved Questions
[unresolved-questions]: #unresolved-questions

<!-- TODO -->
