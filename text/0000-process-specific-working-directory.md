# Meta
[meta]: #meta
- Name: Process Specific Working Directory
- Start Date: 2021-03-09
- Author(s): ForestEckhardt, ryanmoran
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

For any given process, the buildpack should be able to specify a working
directory that is not `CNB_APP_DIR`.

# Motivation
[motivation]: #motivation

Allowing a buildpack to specify a custom working directory would allow
buildpacks to write start commands that need to be invoked from a specfic
directory without needing to invoke a shell.

# What it is
[what-it-is]: #what-it-is

It is a common pattern in buildpacks to execute the process from a directory
that is not `CNB_APP_DIR`. In these cases, buildpack authors are required to
write a process command that includes a change into the directory that the
process should run from. This often looks like `cd $CNB_APP_DIR/sub-directory &&
./execute-process`. Unfortunately, this means that the command can only be run
on a stack that includes a shell. It also means that including additional flags
or arguments to the command at runtime is cumbersome.

As an alternative, the buildpack lifecycle could allow buildpacks to specify
the working directory of the process when it is invoked.

# How it Works
[how-it-works]: #how-it-works

A new field `directory` would be added the the `processes` in `launch.toml`.
```toml
[[processes]]
type = "<process type>"
command = "<command>"
args = ["<arguments>"]
direct = false
directory = "<working directory>"
```

If `directory` is not set the launcher will be invoked in `CNB_APP_DIR` as
normal. However, if given a relative path such as `src/app` the launcher should
be invoked from `$CNB_APP_DIR/src/app`. If given an absolute path such as
`/mounted/bin`, the launcher should invoke from `/mounted/bin`.

# Prior Art
[prior-art]: #prior-art

- Go's [`exec.Cmd`](https://golang.org/pkg/os/exec/#Cmd) accepts a directory
  which that command will be executed in.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

Add a new field `directory` field to `processes` in`launch.toml`
