# Meta
[meta]: #meta
- Name: Shell-free Profile.d
- Start Date: 2020-07-26
- Author(s): @sclevine
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

Currently, `<layer>/profile.d/` scripts must be text files containing Bash 3+ scripts. This RFC proposes that we support arbitrary executables in `<layer>/profile.d/` that do not depend on a shell, but can still modify the environment of the app process.

# Motivation
[motivation]: #motivation

Currently, stacks must have Bash 3+ to support fully-dynamic modification of the environment at launch (via profile.d scripts).
This means makes it difficult to modify the environment of app images that use minimal run base images.

# What it is
[what-it-is]: #what-it-is

- Executable files in `<layer>/profile.d/` should be executed directly instead of sourced by Bash 3+.
- Executable files must only output an environment variable set to `stdout` in the form:
  ```
  KEY1=VALUE1
  KEY2=VALUE2
  ```
- The launcher will manually add those key/value pairs to the environment of the chosen process type.


# Drawbacks
[drawbacks]: #drawbacks

- Might encourage adding additional large binaries to app images
- Doubles-down on the launcher being a necessary component of CNB images
- Some existing profile scripts will break if they are currently made executable by mistake


# Alternatives
[alternatives]: #alternatives

- Keep Bash 3+ requirement as-is
- Allow stacks to configure the shell (wouldn't solve shell-less case though)


# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- If a text file in `<layer>/profile.d/` is executable but doesn't have a shebang, should we still attempt to execute it directly? Some existing profile scripts (that are executable by mistake) will break if we do that. (Even if we detect this case, some existing profile scripts likely have a shebang by mistake.)
- Should we use a named file instead of `stdout` for environment variable sets?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

This will require changes to the Buildpack API spec.
