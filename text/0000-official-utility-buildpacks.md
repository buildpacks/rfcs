# Meta
[meta]: #meta
- Name: Officially supported utility buildpacks
- Start Date: 2021-06-30
- Author(s): [@jkutner](https://github.com/jkutner)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This is a proposal to adopt utility buildpacks as officially supported components of the Cloud Native Buildpacks project.

# Definitions
[definitions]: #definitions

- **utility buildpack** - a buildpack that provides a generic capability that is useful across many vendors, platforms, and apps
- **officially supported** - supported and maintained by the the Cloud Native Buildpacks project and its members

# Motivation
[motivation]: #motivation

Many existing and proposed capabilities of the lifecycle and pack do not require a native implementation within these components. These capabilities can (and have been) implemented as buildpacks (ex. [inline-buildpack](https://registry.buildpacks.io/buildpacks/hone/inline)). In [PR #168](https://github.com/buildpacks/rfcs/pull/168) we assert that supporting these capabilities natively adds complexity to the implementation of lifecycle, which makes it difficult to innovate and improve.

However, defering to the community and vendors to implement these kinds of utility buildpacks has not necessarily had good results. For example, there are three implementations of the [Procfile buildpack](https://registry.buildpacks.io/buildpacks/paketo-buildpacks/procfile). None of these implementations add significant (if any) advantages over the other. Yet buildpack users are force to decide which one to select. This is an unneccessary burden for a capability that could be provided by a single canonical implementation.

We seek to reduce complexity in the lifecycle and provide well maintained utility buildpacks for users by supporting them as official components of the Cloud Native Buildpacks project. This also aligns with our "everything's a buildpack" mantra.

# What it is
[what-it-is]: #what-it-is

Reserve the `buildpacksio` namespace for officially supported buildpacks. Then, on a case by case basis, we adopt utility buildpacks under this

Examples of potential utility buildpacks include:

- `buildpacksio/profile` - Evaluating `.profile` scripts in the app repo during launch
- `buildpacksio/inline` - Executing [Inline buildpacks](https://github.com/buildpacks/rfcs/blob/main/text/0048-inline-buildpack.md)
- `buildpacksio/processes` - Setting app specific process types from a configuration file like `project.toml`
- `buildpacksio/env` - Setting customer environment variables defined in a configuration file like `project.toml`
- `buildpacksio/purge` - Purging files from the app repo before export (similar to [`.slugignore`](https://devcenter.heroku.com/articles/slug-compiler#ignoring-files-with-slugignore))

# How it Works
[how-it-works]: #how-it-works

The utility buildpacks will be owned, supported, and maintained by the [Implementation team](https://github.com/buildpacks/community/blob/main/TEAMS.md#implementation-team).

The criteria for accepting a utility buildpack into the project is as follows:
- The behavior provided by the buildpack MUST be defined in an API specification co-located with the buildpack
- The buildpack MUST support arbitrary stacks
- The buildpack MUST support the latest API version
- The buildpack MUST include detection logic so it can be disabled.
- The buildpack MUST NOT install any dependencies
- The buildapck MUST NOT be specific to a language/framework/ecosystem/toolchain
- The buildpack behavior MUST be well-documented on buildpacks.io
- The buidpack SHOULD only provide functionality that we would added to `pack` or the platform API absent the existence of utility buildpacks

# Drawbacks
[drawbacks]: #drawbacks

- Bubbling these capabilities up to the user layer (as buildpacks) may add cognitive burden for users and errode the DX. We can mitigate this with new features like "default buildpacks".
- New components to support
- We have to ensure that each utility buildpack is portable and works in conjunction with all stacks

# Alternatives
[alternatives]: #alternatives

- Do Nothing - leave the capabilities in the lifecycle, and continue to add more native capabilities

# Prior Art
[prior-art]: #prior-art

- [inline-buildpack](https://registry.buildpacks.io/buildpacks/hone/inline)
- [Procfile buildpack](https://registry.buildpacks.io/buildpacks/paketo-buildpacks/procfile)
- [Paketo Image Labels Buildpack](https://github.com/paketo-buildpacks/image-labels)
- [Paketo Environment Variables Buildpack](https://github.com/paketo-buildpacks/environment-variables)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- How do we implement "default buildpacks" (i.e. buildpacks that can be added to a builder and are invisible to the app developer)?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

This may eliminate chunks of the platform and buildpack specs.
