# Meta
[meta]: #meta
- Name: Process Type Arguments
- Start Date: 2020-06-02
- Author(s): nebhale ekcasey
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

The lifecycle should add a new backwards-compatible command execution strategy for specifying command line arguments appended to an existing process type.

# Motivation
[motivation]: #motivation
This RFC attempts to solve two distinct but related problems with CNB process arguments:

## Problem 1: Arguments Supplied at Runtime

Currently the specification provides a way for buildpacks to declare a set of process types that applications can be started with.  The lifecycle has support for specifying the name of any one of these process types and executing it (`docker run -t my-image web`) as well as support for users passing a completely custom command to be executed (`docker run -it my-image /bin/bash`). There is a missing use case of utilizing one of the pre-defined process types, but adding arguments to the end of the command rather than replacing it.

This pattern is commonly used in what might be described as "task" context.  For example, a Spring Boot application utilitzing Spring Batch might always start `java -cp "${CLASSPATH}" ${JAVA_OPTS} org.springframework.boot.loader.JarLauncher`.  However at runtime this needs to be executed as `java -cp "${CLASSPATH}" ${JAVA_OPTS} org.springframework.boot.loader.JarLauncher --active.profile=green --partitions=21-45`.  The user shouldn't have to interrogate the image metadata to find out what the command would have been and synthesize their command from it.  In addition, if they choose to do this, as the command change during the evolution of the contributing buildpack or application, they'd need to make sure their command was kept in sync as well.

Instead, at execution time, the lifecycle should allow a user to specify the arguments to append to an existing process type.

Feedback from users in buildpacks slack and in issues, indicates that should in fact be the default behavior:
- https://github.com/buildpacks/lifecycle/issues/280
- https://github.com/buildpacks/pack/issues/468#issuecomment-593139689

## Problem 2: Arguments for Shell Processes
Currently, arguments to a shell process are treated as arguments to generated bash command.
Given a process
```
[[process]]
command = "<CMD>"
args = ["ARG1", "ARG2"]
```
we currently execute `bash -c "<CMD>" "ARG1" "ARG2"`. This makes it hard to use arguments intuitively in a shell process.
For example,
```
[[process]]
command = "echo"
args = ["hello", "world"]
```
does not print `hello world`. Instead users must construct a string command that includes arguments
```
[[process]]
command = "echo hello world"
args = []
```
This already causes confusion for users (https://github.com/buildpacks/lifecycle/issues/281). The problem is compounded if we allow users to supply additional arguments. We cannot append arguments to the command string in a reliable way and constructing a command that accepts args in the way they are provided is confusing and difficult (buildpack authors likely will not do this correctly).

The RFC proposes and changes to the launchers handling of args to make the execution of the following process
```
[[process]]
command = "<CMD>"
args = ["ARG1", "ARG2"]
```
produce results equivalent to the execution of `"<CMD>" "<ARG1>" "<ARG2>"` in a shell

# What it is
[what-it-is]: #what-it-is

## Terminology
* shell process - a process with `direct=false`

## Philosophy
The goal is to make the runtime usage of a CNB container as similar as possible to the runtime usage on a non-CNB container, without removing functionality or violating assumptions that have been firmly established in the buildpack community (e.g. defaulting to `web`).

Because the `launcher` must occupy the container entrypoint we will instead use `CNB_PROCESS_TYPE` as a CNB-specific analog to the entrypoint. Users can already set `CNB_PROCESS_TYPE` to toggle between processes. Setting `CNB_PROCESS_TYPE=override` will be analogous to clearing the entrypoint.

## Behavior
### Selecting a process type at runtime
Users will no longer be able to pass a process-type to the launcher, instead they must set `CNB_PROCESS_TYPE` in the running container to select a process type.
If `CNB_PROCESS_TYPE` is unset, it will continue to default to `web`.

This functionality has existed for a long time, but we will remove the second way to set toggle the same behavior, by passing a single argument containing a process-type to the launcher (i.e. `docker run <image> my-process-type` won't work anymore).

### Specifying a custom process at runtime
If users wish to provide a custom command instead of using one of the buildpack generated process types, they must set `CNB_PROCESS_TYPE=override` to explicitly indicate that they wish to override the entire command, rather than to append args.

Running `docker run --env CNB_PROCESS_TYPE=override <image> echo hello world`, will be equivalent to running a process type where `direct = false`, `command = "echo"` and `args = ["hello", "world"]`

Running `docker run --env CNB_PROCESS_TYPE=override <image> -- echo hello world`, will be equivalent to running a process type where `direct = true`, `command = "echo"` and `args = ["hello", "world"]`

### Providing additional arguments at runtime
Unless `CNB_PROCESS_TYPE` is set to `override` arguments provided to the launcher will be appended to the existing process arguments before executing.

For example, running process
```
[[process]]
type = "hi"
command = "echo"
args = ["hello"]
```
with `docker run --env CNB_PROCESS_TYPE=hi <image> world` will be equivalent to running process
 ```
[[process]]
type = "hi"
command = "echo"
args = ["hello", "world"]
 ```
without arguments: `docker run --env CNB_PROCESS_TYPE=hi <image>`.

Launcher args are appended to the `args` array by default for both `direct` and shell processes.

### Executing Shell Processes
When a shell process has arguments the launcher will execute a command that has behavior identical to that which would result from a user sourcing the profile script and then executing
`<CMD> <ARG1> <ARG2>...` in a shell inside the container.

###

# How it Works
[how-it-works]: #how-it-works

## Launcher Flow
The `launcher` currently has a three step command resolution flow:

1.  0 args: execute the default process type, where the default process type is `${CNB_PROCESS_TYPE:-web}`
1.  1 arg:  if `$1` matches a process type, execute that process type
1.  N args: execute `$1` as the command with `${@:2}` as the arguments appended to that command

This proposal is to augment that command resolution flow to:

1.  If `CNB_PROCESS_TYPE=override`
    1. 0 args: fail
    1. N args: execute `$1` as the command with `${@:2}` as the arguments
1.  Else
    1. 0 args: execute the process type `${CNB_PROCESS_TYPE:-web}`
    1. N args: Execute process type `${CNB_PROCESS_TYPE:-web}`, after appending `"$@"` to the arguments

### Executing Shell Processes
Ensuring all arguments are tokenized and parsed correctly requires some `bash` complexity. When `direct=false` the launcher will do some magic along the lines of:
```
/bin/bash -c \
'source <app-dir>/.profile
source <layers>/<bp.id>/profile.d/<profile-script>
...
exec bash -c '$(eval echo \"$0\") ...$(eval echo \"$n\")' "$@"' /cnb/lifecycle/launcher <cmd> <args>...
```
Ensuring that the original tokenization is preserved and variable references (e.g. an arg containing the string `$JAVA_OPTS`) are evaluated by bash after the profile scripts have been sourced (given that profile scripts may modify relevant variables).

Although the launcher must carry the burden of this complexity, user will get intuitive results, and should not need to understand the mechanism.

## Backwards Compatibility

### Buildpacks
To take advantage of user provided args buildpacks will need to migrate their commands from the current model to the new one to take advantage of user provided args.

To ease this transition we can preserve the existing behavior in the case where there are no arguments provided by either the buildpack process or the user. These processes will break if a user tries to supply additional arguments, but it is already true that users cannot supply additional arguments to these processes.

### Platforms
We can use `CNB_PLATFORM_API` (API "modes") to toggle between the current and new launcher process resolution flow. `CNB_PLATFORM_API` will be set in the exported image to the platform API provided at build time, but can be overrode explicitly at runtime.

process-types positional arguments to the `launcher` is currently unspecified and undocumented, current usage of this feature is hard to measure but anecdotally appears to be uncommon.

For the changes proposed in this RFC, changing the default interpretation of `launcher` arguments from a custom command to additional arguments, will likely have the biggest impact on platforms. Platforms will need to make changes to runtime logic and/or documentation before enabling the platform API containing this change.

# Drawbacks
[drawbacks]: #drawbacks

* Breaking changes!
* Some functionality is only accessible by setting environment variables, when previously all functionality was available with launcher arguments.
* Increased complexity of launcher shell logic.

# Alternatives
[alternatives]: #alternatives

Previously in Cloud Foundry which did not support a system like this, the solution that was chosen was to use an environment variable to represent arguments:

```
java -cp "${CLASSPATH}" ${JAVA_OPTS} org.springframework.boot.loader.JarLauncher "${ARGUMENTS}"
```

This led to lots of brittleness and confusion around the parsing of arguments as they passed through various parts the platform and was never widely adopted.  This proposal is vastly superior as it creates a direct connection between user input and the delimited arguments passed to the command that is eventually executed without the indirection and requirement of a shell to process them.

The previous version of this RFC provides an alternative method of discerning args from commands using a path lookup. This launcher flow could be used instead of the current proposal with or without shell process launch changes.

# Prior Art
[prior-art]: #prior-art

See [Alternatives](#alternatives).

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

* Can we release these changes in minor API versions or should we hold it until `1.0`?
* Should a different syntax be used for the same effect (e.g. `docker run -t my-image web -- --active.profile=green --partitions=21-45`)?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

There will be changes to the platform specification to match the result of this RFC.
