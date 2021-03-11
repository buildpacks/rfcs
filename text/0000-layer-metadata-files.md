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

All layer metadata files should be prefixed with the string `layer.`. For example, the current implementation expects layer specific metadata file for a layer `<layers>/example` to be located at `<layers>/example.toml`, we now propose that the associated layer metadata file be located at `<layers>/layer.example.toml`.

This RFC would also prohibit buildpack authors from putting any files in the `<layers>` directory that is not currently a recognized metadata file or begins with the `layer.` prefix. This is to allow the buildpack API to accommodate more of special metadata files like `build.toml` without breaking any backwards compatibility in an unambiguous fashion.

# How it Works
[how-it-works]: #how-it-works

The lifecycle would look for layer metadata files at `<layers>/layer.<layer>.toml` instead of `<layers>/<layer>.toml`.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

This will break backwards compatibility for numerous buildpacks that don't use a set of bindings like `libcnb`.

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?

We could have separate folders for layers and their metadata files and the application metadata files.

- Why is this proposal the best?

It seemed easier to add a prefix instead of creating a sub-folder in order to provide proper namespacing for layer metadata.

- What is the impact of not doing this?

We keep having this ambiguity and possible issues in the future when we want to add more of such special files.

# Prior Art
[prior-art]: #prior-art

- [RFC 0053](https://github.com/buildpacks/rfcs/blob/main/text/0053-decouple-buildpack-plan-and-bom.md)


# Unresolved Questions
[unresolved-questions]: #unresolved-questions

<!-- TODO -->

