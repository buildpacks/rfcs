# Meta 
[meta]: #meta
- Name: User-provided Environment Variable Whitelist
- Start Date: 2019-06-17
- CNB Pull Requests: (spec PR to follow)
- CNB Issues: (lifecycle issues to follow)


# Motivation
[motivation]: #motivation

This proposal makes it easier to write a simple buildpack that respects user-provided environment variables.

# What it is
[what-it-is]: #what-it-is

This RFC proposes a method for whitelisting user-provided environment variables that:
1. Is optional
2. Simplifies the interface for buildpack executables
3. Reduces the complexity of buildpacks written in various languages

# How it Works
[how-it-works]: #how-it-works

This proposes a simple interface to address the problem:

"How do you remove environment variables that you don't know about from the buildpack environment?"

To accomplish this, buildpack.toml gets an additional `env-accept` field formatted as such:

```
[[buildpacks]]
id = my.buildpack.id

[[buildpacks.env-accept]]
name = "MYVAR"
default = "some value"
``` 

If this whitelist is not specified, all user-provided environment variables are exported in the buildpack environment.

If this whitelist is specified, only the specified user-provided environment variables are exported in the buildpack environment.

If a whitelisted environment variable is unset and `default` is specified, its value is set to the value of `default`.

The `<platform>` directory is no longer provided as an argument to `/bin/build` and `/bin/detect`.

# Questions
[questions]: #questions

1. Does the environment variable whitelist need to be determined by the buildpack dynamically?

   No, whitelisted environment variables can be blacklisted individually by the buildpack when it executes.

2. How does this prevent user-provided environment variables from unintentionally affecting buildpack subprocesses?

   The buildpack is aware of explicitly whitelisted environment variables and can choose not to set them on subprocesses. 

# Drawbacks
[drawbacks]: #drawbacks

TDB

# Alternatives
[alternatives]: #alternatives

Keep current environment variable mechanism.
