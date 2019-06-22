# Meta 
[meta]: #meta
- Name: Auto-load User-provided Environment Variables
- Start Date: 2019-06-17
- CNB Pull Requests: (spec PR to follow)
- CNB Issues: (lifecycle issues to follow)


# Motivation
[motivation]: #motivation

This proposal makes it easier to write a simple buildpack that respects user-provided environment variables.

# What it is
[what-it-is]: #what-it-is

This RFC proposes that user-provided environment variable be loaded by default. This should make it easier to write a simple buildpack that passes along arbitrary build-time environment variables.

# How it Works
[how-it-works]: #how-it-works

User-provided build-time environment variables are loaded in the detection and build environment automatically unless `secure-env = true` is specified in the buildpack's entry in `buildpack.toml`. In both cases, the environment variables continue to be available in `<platform>/env/`.

# Questions
[questions]: #questions

N/A

# Drawbacks
[drawbacks]: #drawbacks

The `<platform>` directory argument feels unnecessary in the default case.

# Alternatives
[alternatives]: #alternatives

Keep current environment variable behavior.
