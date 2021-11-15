# Meta
[meta]: #meta
- Name: Process Specific Working Directory
- Start Date: 2021-03-09
- Author(s): ForestEckhardt, ryanmoran, fg-j
- Status: Approved
- RFC Pull Request: [rfcs#144](https://github.com/buildpacks/rfcs/pull/144)
- CNB Pull Request: (leave blank)
- CNB Issue: [buildpacks/spec#212](https://github.com/buildpacks/spec/issues/212), [buildpacks/spec#216](https://github.com/buildpacks/spec/issues/216)
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

Here are some examples of where buildpacks have had to work around this issue:
* [Google Dotnet Publish](https://github.com/GoogleCloudPlatform/buildpacks/commit/a8d662f20cd3c304f0db4a82259400103e358429#diff-a56496a4700b75d6512c25eba9da9635ef937b1b38f50d6ce844275a77b09ac7R167)
* [Paketo NPM Start](https://github.com/paketo-buildpacks/npm-start/blob/d0e3f0a9375948c75dd663b56c95a0ee7b86556e/build.go#L41-L47)
* [Paketo Yarn Start](https://github.com/paketo-buildpacks/yarn-start/blob/d826b85e81df90f6d83e7bce1b581ba6bb79e6e7/build.go#L57)

As an alternative, the buildpack lifecycle could allow buildpacks to specify
the working directory of the process when it is invoked.

# How it Works
[how-it-works]: #how-it-works

A new field `working-directory` would be added the the `processes` in `launch.toml`.
```toml
[[processes]]
type = "<process type>"
command = "<command>"
args = ["<arguments>"]
direct = false
working-directory = "<working directory>"
```

If `working-directory` is not set the process will be invoked in `CNB_APP_DIR`
as normal. However, if given a relative path such as `src/app` the process
should be invoked from `$CNB_APP_DIR/src/app`. If given an absolute path such
as `/mounted/bin`, the process should invoke from `/mounted/bin`.

The `working-directory` specified for the process **should not** affect the working
directory for either `profile.d` or `exec.d` scripts.

The process specific `working-directory` **should not** affect the OCI image
metadata `WorkingDir` field.

# Prior Art
[prior-art]: #prior-art

- Go's [`exec.Cmd`](https://golang.org/pkg/os/exec/#Cmd) accepts a directory
  which that command will be executed in.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

Add a new field `working-directory` field to `processes` in`launch.toml`
