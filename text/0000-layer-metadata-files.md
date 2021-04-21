# Meta
[meta]: #meta
- Name: Disambiguate layer metadata files from Application metadata files
- Start Date: 2021-03-11
- Author(s): [samj1912](https://github.com/samj1912)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This is a proposal to change the location of layer specific TOML metadata files from application specific TOML metadata files like `launch.toml` or `build.toml` in order to disambiguate special metadata files from layer metadata files that can have similar names.

# Motivation
[motivation]: #motivation

Currently all the metadata files live under the `<layers>` folder. This means that application metadata files like `launch.toml`, `build.toml` or `store.toml` share the same directory as layer metadata files. Since the layers could possibly be named `launch`, `build` or `store` this leads to ambiguity, conflicts and/or restrictions on layer names and their associated metadata files that should not exist. This also prevents us from possibly adding new metadata files in the future without breaking backwards compatibility with buildpacks who may have been creating layers with the same name. This proposal seeks to disambiguate special metadata files from free-form layer metadata files.


# What it is
[what-it-is]: #what-it-is

The proposal is as follows - 

The current structure of the `<layers>` folder is -

```
`/layers` (configurable with `CNB_LAYERS_DIR` or -layers) 
├── group.toml
├── plan.toml
├── <escaped_buildpack_id> (buildpack arg `$1` )
│   ├── build.toml
│   ├── launch.toml
│   ├── store.toml
│   ├── <layer>.toml
│   └── <layer>
└── config
    └── metadata.toml
```


The proposal is to change this structure to - 


```
`/output` (configurable with `CNB_OUTPUT_DIR` or -output-dir) 
├── group.toml
├── plan.toml
├── layers
│   └── <escaped_buildpack_id> (`CNB_BP_LAYERS_DIR` )
│       ├── <layer>.toml
│       └── <layer>
└── config
    ├── metadata.toml
    └── <escaped_buildpack_id> (`CNB_BP_CONFIG_DIR`  )
        ├── build.toml
        ├── launch.toml
        └── store.toml
```

The top level `<output-dir>` would be the mounted volume that contains the output from buildpacks. The `<layers>` sub-directory would contains the layer contributions by each buildpack under an `<escaped-buildpack-id>` directory. This directory would be passed to the buildpack via the environment variable `CNB_BP_LAYERS_DIR`. Similarly any config files would reside in the `<config>`, under a sub-directory for each buildpack. This directory would be passed to the buildpack via the environment variable `CNB_BP_CONFIG_DIR`.

# How it Works
[how-it-works]: #how-it-works

The lifecycle phases that reference the `<layers>` directory would now take in `<output-dir>` directory instead. The behavior with respect to the various metadata files and the lifecycle would remain the same, however the `analysis`, `restore`, `build` and `export` phases would have to be updated to look for the various layer directories inside the `layers` and `config` sub-folder in the `<output-dir>`.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

This will break backwards compatibility for numerous buildpacks that don't use a set of bindings like `libcnb`. This would also result in a one-time loss of layer caches for app images. It would also result in longer path names. We would also have to re-work the export logic to account for the export of the various files which are partially present in the `config` sub-directory and the `layers` sub-directory.

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?

## Alternative 1

We could add a prefix to each of the layer metadata files like `layer.`. This would allow us to re-use the cached layers but may lead to awkwardness around naming the layer metadata files - for eg. if a layer is called `layer.build` the metadata file would end up being `layer.layer.build.toml`

```
`/layers` (configurable with `CNB_LAYERS_DIR` or -layers) 
├── group.toml
├── plan.toml
├── <escaped_buildpack_id> (buildpack arg `$1` )
│   ├── build.toml
│   ├── launch.toml
│   ├── store.toml
│   ├── layer.<layer>.toml
│   └── <layer>
└── config
    └── metadata.toml
```

## Alternative 2

We could add a prefix for each of the special metadata files and reserve it for CNB usage. For eg. `launch.toml` could be renamed to `cnb.launch.toml`. This way, we will only be prohibiting layers that have a prefix `cnb.` or a layer named `cnb`. The downsides to this alternative are the fact that the metadata files would not be usable across builds and we would still be prohibiting a class of layer names that may be valid.

```
`/layers` (configurable with `CNB_LAYERS_DIR` or -layers) 
├── group.toml
├── plan.toml
├── <escaped_buildpack_id> (buildpack arg `$1` )
│   ├── cnb.build.toml
│   ├── cnb.launch.toml
│   ├── cnb.store.toml
│   ├── <layer>.toml
│   └── <layer>
└── config
    └── metadata.toml
```


## Alternative 3

The top level `<buildpack-workspace>` would house any files and folder that are applicable at a `buildpack` level. Any layer specific files and directory structure would be moved to the `layers` sub-directory inside the `<buildpack-workspace>`.

```
`/layers` (configurable with `CNB_LAYERS_DIR` or -layers) 
├── group.toml
├── plan.toml
├── <escaped_buildpack_id> (buildpack arg `$1` )
│   ├── build.toml
│   ├── launch.toml
│   ├── store.toml
│   └── layers
│       ├── <layer>.toml
│       └── <layer>
└── config
    └── metadata.toml
```


## Alternative 4

```
`/layers` (configurable with `CNB_LAYERS_DIR` or -layers-dir) 
├── group.toml
├── plan.toml
├── <escaped_buildpack_id> (`CNB_BP_LAYERS_DIR`)
│   ├── <layer>.toml
│   └── <layer>
└── config
    ├── metadata.toml
    └── <escaped_buildpack_id> (`CNB_BP_CONFIG_DIR`  )
        ├── build.toml
        ├── launch.toml
        └── store.toml
```

This structure doesn't break layer re-use and has the same length for path names but the top level directory is called `layers` when it houses more than just layers. And also the `config` directory may clash with the `escaped_buildpack_id`.

## Why is this proposal the best?

Although this is a drastic change, this also open up possibilities in the future to introduce other top level concepts inside the `CNB_BP_CONFIG_DIR` apart from the current ones while still allowing layer names to be free-form and without any restrictions.

## What is the impact of not doing this?

We keep having this ambiguity and possible issues in the future when we want to add more of such special files.


# Prior Art
[prior-art]: #prior-art

- [RFC 0053](https://github.com/buildpacks/rfcs/blob/main/text/0053-decouple-buildpack-plan-and-bom.md)


# Unresolved Questions
[unresolved-questions]: #unresolved-questions

<!-- TODO -->
