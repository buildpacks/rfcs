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
<layers>
├── launch.toml
├── build.toml
├── store.toml
├── layer-x.toml
├── layer-x
│   └── ...
```

The proposal is to change this structure to - 


```
<buildpack-workspace>
├── launch.toml
├── build.toml
├── store.toml
├── layers
│   ├── layer-x.toml
│   ├── layer-x
│   └── ...
└── ...
```

The top level `<buildpack-workspace>` would house any files and folder that are applicable at a `buildpack` level. Any layer specific files and directory structure would be moved to the `layers` sub-directory inside the `<buildpack-workspace>`.

# How it Works
[how-it-works]: #how-it-works

The lifecycle would stages the reference `<layers>` directory would now take in `<buildpack-workspace>` directory instead. The behavior with respect to the various metadata files and the lifecycle would remain the same, however the `analysis`, `restore`, `build` and `export` phases would have to be updated to look for the various layer directories inside the `layers` sub-folder in the `buildpack-workspace`.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

This will break backwards compatibility for numerous buildpacks that don't use a set of bindings like `libcnb`. This would also result in a one-time loss of layer caches for app images.

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?

We could add a prefix to each of the layer metadata files like `layer.`. This would allow us to re-use the cached layers but may lead to awkwardness around naming the layer metadata files.

- Why is this proposal the best?

Although this is a drastic change, this also open up possibilities in the future to introduce other top level concepts inside the `<buildpacks-workspace>` apart from just `layers`.

- What is the impact of not doing this?

We keep having this ambiguity and possible issues in the future when we want to add more of such special files.

# Prior Art
[prior-art]: #prior-art

- [RFC 0053](https://github.com/buildpacks/rfcs/blob/main/text/0053-decouple-buildpack-plan-and-bom.md)


# Unresolved Questions
[unresolved-questions]: #unresolved-questions

<!-- TODO -->

