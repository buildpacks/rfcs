# Meta
[meta]: #meta
- Name: Support for env vars in creator
- Start Date: 2023-09-07
- Author(s): [kappratiksha](https://github.com/kappratiksha)
- Status: Draft
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

Add a flag for passing the build time env variables to buildpacks when invoking creator

# Definitions
[definitions]: #definitions

N/A

# Motivation
[motivation]: #motivation

When invoking the creator process, there is no way to pass build time environment variables to the buildpacks other than creating the files under /platform/env folder. This adds an extra step for the authors when implementing their buildpack. Adding a new flag to the creator process will simplify the process of setting the environment variables.

We already have something similar for the [pack cli tool](https://buildpacks.io/docs/tools/pack/cli/pack_build/) and it proves to be very convenient. Example:

```
pack build test_img --env VAR1=VALUE1
```

# What it is
[what-it-is]: #what-it-is

A flag that can be used by buildpack user to pass down the environment variables while invoking creator.

/cnb/lifecycle/creator -env stringArray 

A sample use case would look like:
```
/cnb/lifecycle/creator -env LANGUAGE=java -env VERSION=1.1
```

# How it Works
[how-it-works]: #how-it-works


Before calling the `bin\detect`, create environment variables passed down by the flag `--env` under /platform/env folder

# Migration
[migration]: #migration


# Drawbacks
[drawbacks]: #drawbacks


# Alternatives
[alternatives]: #alternatives


# Prior Art
[prior-art]: #prior-art


# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?
  This will improve the effeciency of using the build environment variables. Instead of users having to set the environment variables manually by creating the folders, they can now use the new flag.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
This change will involve some spec changes for the new flag.

# History
[history]: #history

<!--
## Amended
### Meta
[meta-1]: #meta-1
- Name: (fill in the amendment name: Variable Rename)
- Start Date: (fill in today's date: YYYY-MM-DD)
- Author(s): (Github usernames)
- Amendment Pull Request: (leave blank)

### Summary

A brief description of the changes.

### Motivation

Why was this amendment necessary?
--->