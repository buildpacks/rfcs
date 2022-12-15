# Meta
[meta]: #meta
- Name: Override Env Vars by Default
- Start Date: 2020-07-26
- Author(s): @sclevine
- Status: Implemented
- RFC Pull Request: [rfcs#98](https://github.com/buildpacks/rfcs/pull/98)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This RFC proposes that we change the behavior of `/env/`, `/env.build/`, and `/env.launch/` directories such that the default, suffix-less behavior is equivalent to `VAR.override` instead of `VAR.append`+`VAR.delim=:`.

# Motivation
[motivation]: #motivation

The current behavior is surprising, especially because adding `.append` silently removes the delimiter. Changing to `.override` and requiring a `.delim` file to add a delimiter would be more clear.

Additionally:

- Not all environment variables are paths, so assuming `:` may also surprise users when two unrelated buildpacks set the same env var without an extension.
- Even when an environment variable contains a path that needs to be joined, there is no guarantee that `.append` is the correct choice over `.prepend`. Making one the default hides the need to think about what is the most appropriate choice, results in asymmetrical syntax for the two use-cases, and means buildpack authors need to remember which of them is actually the default.

# What it is
[what-it-is]: #what-it-is

Buildpack authors can create environment variable files as `<layer>/env(.launch|.build|)/NAME` such the an environment variable with name `NAME` is exported into the runtime, build-time (for subsequent buildpacks), or both environments. The contents of the file are set as the value.

These environment variable files are applied dynamically, either before subsequent buildpacks or when the app container starts. Their application may be modulated by file extensions such as `.append`, `.prepend`, `.default`, and `.override`. For `.append` and `.prepend`, a special `NAME.delim` file may be used to specify the delimiter.

The current behavior is to assume `.append` and `.delim` (with contents `:`) when no extension is specified. This is confusing (for reasons stated above) and does not match the behavior of `NAME=value` when environment variables are set in other contexts. This RFC proposes we change the behavior to be identical to `.override`, which overrides all previous values (such that the last buildpack "wins").

# Drawbacks
[drawbacks]: #drawbacks

- It's a breaking change that may not be immediately detectable.
- It gives later buildpacks higher precedence compared to earlier buildpacks.
- Many environment variables contain paths, and the current default is easier than creating multiple files.

# Alternatives
[alternatives]: #alternatives

- Leave the current behavior.
- Make `.default` the default (so that user-provided env vars or first-buildpack env vars win instead).
- Make `.append` / `.prepend` the default, but without a delimiter.

# Prior Art
[prior-art]: #prior-art

Every shell or tool for setting env vars that I'm aware of.

# Spec. Changes
[spec-changes]: #spec-changes

This is a breaking change to the Buildpack API spec.
