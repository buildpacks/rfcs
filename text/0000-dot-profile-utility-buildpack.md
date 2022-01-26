# Meta
[meta]: #meta
- Name: `.profile` Utility Buildpack
- Start Date: 2022-01-25
- Author(s): mboldt
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

As part of RFC 93, [`.profile` scripts will cease to be supported by the platform API](https://github.com/buildpacks/rfcs/blob/main/text/0093-remove-shell-processes.md#appprofile).
This RFC proposes developing a [utility buildpack](https://github.com/buildpacks/rfcs/blob/main/text/0097-official-utility-buildpacks.md) to support `.profile` scripts to prevent regressions after RFC 93 is implemented.

# Definitions
[definitions]: #definitions

*utility buildpack*: A buildpack officially supported by the Buildpack Authors' Tooling Team per [RFC 97](https://github.com/buildpacks/rfcs/blob/main/text/0097-official-utility-buildpacks.md).

# Motivation
[motivation]: #motivation

[RFC 93](https://github.com/buildpacks/rfcs/blob/main/text/0093-remove-shell-processes.md) resolves to remove shell-specific logic from the CNB Specification.
Part of this includes removing support for `.profile` script in a future version of the Platform API.
RFC 93 recommends supporting the `.profile` script functionality in a utility buildpack to avoid regressions.
This proposal is to develop and support the `.profile` utility buildpack, allowing RFC 93 to be implemented without regression.

# What it is
[what-it-is]: #what-it-is

The target persona is a platofrm operator or implementor who wants to update to the latest platform API, while maintaining the `.profile` functionality for application developers.

We propose developing and supporting a buildpack to provide an identical interface to the existing `.profile` functionality.
It will:

- Detect a `.profile` file in the app dir
- Wrap the `.profile` file so that it implements the `exec.d` interface
- Add the `exec.d` executable to the `<layer>/exec.d` directory so the launcher will apply it

## Example 1 (environment variables)

Here is an example of a `.profile` script, inspired by paketo-buidpacks/node-engine:

```
memory_in_bytes="$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes)"
MEMORY_AVAILABLE="$(( $memory_in_bytes / ( 1024 * 1024 ) ))"
export MEMORY_AVAILABLE
```

The wrapper should ensure that the `MEMORY_AVAILABLE` environment variable is set in the environment with the proper value.

## Example 2 (file system side effects)

With this contrived `.profile` script:

```
echo 'hello' >> "$HOME/hello"
```

The wrapper would not need to set any environment varibales, but should maintain the side effect of creating the `$HOME/hello` file.


# How it Works
[how-it-works]: #how-it-works

In short, the wrapper should do:

```
#!/bin/bash
set -eo
source .profile
env >&3
```

This will write the environment, including any variables set in `.profile`, to the [`exec.d` output TOML](https://github.com/buildpacks/spec/blob/main/buildpack.md#execd-output-toml).
Since it also executes the `.profile` script, any side effects will happen.
This will solve for both of the simple examples above.

On Windows, for `.profile.bat` scripts, we can take the same approach of wrapping the script like:

```
call .profile.bat
set >&%CNB_EXEC_D_HANDLE%
```

# Migration
[migration]: #migration

This buildpack is net new, so has no inherent migration considerations.

For the realted migration concerns for removing shell functionality in general, see the [Migration Path section of RFC 93](https://github.com/buildpacks/rfcs/blob/main/text/0093-remove-shell-processes.md#migration-path).

# Drawbacks
[drawbacks]: #drawbacks

This is a new component to maintain and support.
That being said, this will enable spec and lifecycle simplifications noted in [RFC 93](https://github.com/buildpacks/rfcs/blob/main/text/0093-remove-shell-processes.md) (where this approach was first suggested).
Also, [RFC 97](https://github.com/buildpacks/rfcs/blob/main/text/0097-official-utility-buildpacks.md) resolves to support and maintain utility buidpacks.

# Alternatives
[alternatives]: #alternatives

If we do nothing, we introduce a regression in functionality, and force application developers to rework their `.profile` scripts.

- What other designs have been considered?
- Why is this proposal the best?

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Are there things that `.profile` scripts do that will not be covered by the exec.d interface?
  For example, defining environment variables and side effects like writing files should be supported.
  But, something like defining a bash function will not be supported.

# Spec. Changes
[spec-changes]: #spec-changes

None.
