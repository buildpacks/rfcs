# Meta
[meta]: #meta
- Name: rename app.toml
- Start Date: 2019-05-29
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

Change `app.toml` filename to `project.toml`.

# Motivation
[motivation]: #motivation

In the spec as part of the [slices](https://github.com/buildpack/spec/pull/36) [change](https://github.com/buildpack/spec/commit/235ddfc87c9d2ecbff65f1a99d7f592e0a947037#diff-7f205a69e3c8a81e4eee0a39e84a9311), we changed `launch.toml` to `app.toml`. There's been two beta releases and we still haven't made the `app.toml` change. The spec should accurately reflect our intention, which is not to change it to `app.toml`. Though buildpacks have a history of being used for building "apps". Buildpacks can be used to build any project and not just "apps". The vocabular used by the project will influence people's perception of the intended use cases.

# What it is
[what-it-is]: #what-it-is

The `app.toml` currently stores two pieces of information:

* process types and commands
* slices for splitting the root project directory into different layers.

Both of these pieces of information are relevant for "launching". Despite this, the original intention of changing it to `app.toml` was that this file was place to store other generic "app" metadata. Slices are about splitting the "application" folder into individual layers than launching specifically.

This RFC proposes instead of `app.toml` to use `project.toml`.

# How it Works
[how-it-works]: #how-it-works

No functionality will change from the current `app.toml` defined in the spec.

# Drawbacks
[drawbacks]: #drawbacks

Like all naming things, this is a bike shed since none of the functionality will change.

# Alternatives
[alternatives]: #alternatives

- We can not do anything. The existing source code grouping construct is "app" in Heroku.
- Kubernetes uses "Services" to describe a set of pods.
- workspace is the name of the directory.
- Switch back to `launch.toml`.

# Prior Art
[prior-art]: #prior-art

N/A

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Is there a better name?
