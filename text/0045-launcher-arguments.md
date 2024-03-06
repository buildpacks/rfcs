# Meta
[meta]: #meta
- Name: Launcher Arguments
- Start Date: 2020-06-02
- Author(s): nebhale ekcasey
- Status: Superseded
- RFC Pull Request: [rfcs#84](https://github.com/buildpacks/rfcs/pull/84)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

The lifecycle should allow users to appended arguments to an existing process type.

# Motivation
[motivation]: #motivation
This RFC attempts to solve two distinct but related problems with CNB process arguments:

## Problem 1: Arguments Supplied at Runtime

Currently the specification provides a way for buildpacks to declare a set of process types that applications can be started with.  The lifecycle currently has support for specifying the name of any one of these process types and executing it (`docker run -t my-image web`) as well as support for users passing a completely custom command to be executed (`docker run -it my-image /bin/bash`). There is a missing use case of utilizing one of the pre-defined process types, but adding arguments to the end of the command rather than replacing it.

This pattern is commonly used in what might be described as "task" context.  For example, a Spring Boot application utilitzing Spring Batch might always start `java -cp "${CLASSPATH}" ${JAVA_OPTS} org.springframework.boot.loader.JarLauncher`.  However, at runtime this needs to be executed as `java -cp "${CLASSPATH}" ${JAVA_OPTS} org.springframework.boot.loader.JarLauncher --active.profile=green --partitions=21-45`.  The user shouldn't have to interrogate the image metadata to find out what the command would have been and synthesize their command from it.  In addition, if they choose to do this, as the command changes during the evolution of the contributing buildpack or application, they need to make sure their command is kept in sync.

Instead, at execution time, the lifecycle should allow a user to specify the arguments to append to an existing process type.

Feedback from users in buildpacks slack and in issues, indicates that should in fact be the default behavior:
- https://github.com/buildpacks/lifecycle/issues/280
- https://github.com/buildpacks/pack/issues/468#issuecomment-593139689

## Problem 2: Arguments for Shell Processes
Currently, arguments defined in a shell process are treated as arguments to bash, rather than as arguments to the command.
Given a process:
```
[[process]]
command = "<CMD>"
args = ["ARG1", "ARG2"]
```
the `launcher` currently executes `bash -c "<CMD>" "ARG1" "ARG2"`. This makes it hard to use arguments intuitively in a shell process.
For example, the following does not print `hello world`.
```
[[process]]
command = "echo"
args = ["hello", "world"]
```
Instead, users must construct a string command that includes arguments
```
[[process]]
command = "echo hello world"
args = []
```
This already causes confusion for users (https://github.com/buildpacks/lifecycle/issues/281). The problem is compounded if we allow users to supply additional arguments. We cannot reliably append arguments to the `command` string without introducing tokenization or shell parsing errors. Constructing a `command` that accepts args in the way they are currently provided to `bash` is confusing and difficult (buildpack authors likely will not do this correctly).

This RFC proposes changes to the `launcher`'s handling of args to make the execution of the following process
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

Because the `launcher` must occupy the container `entrypoint`, we will make the `launcher` a multicall binary that derives the intended process-type, or lack there of, from `argv0`. This allows for intuitive use of both `entrypoint` and `cmd`: `entrypoint` will be used to select a process and `cmd` will be used to supply additional argument to that process.

## Behavior

### Exporter
When `exporter` creates an app image it will create one symlink per buildpack-contributed process type. The symlink files will be named `/cnb/process/<process-type>` and will point at the launcher.

The `exporter` will prepend `/cnb/process` to the image `PATH`.
The `exporter` will prepend `/cnb/lifecycle` to the image `PATH`.
The `exporter` will set the app image `entrypoint` to the symlink matching the default process.

Currently, it is possible to set the default process-type to a non-existent process-type. This will no longer be allowed. If the default process does not exist, the `exporter` will warn and set the entrypoint to `/cnb/lifecycle/launcher`.

### Launcher
The `launcher` will remove `/cnb/process` and `/cnb/lifecycle` from the PATH before launching a process in order to preclude any conflicts between process types and normal executables.

#### Selecting a process type at runtime
Users will no longer be able to pass a process-type to the launcher as a positional argument or with the `CNB_PROCESS_TYPE` environment variable. Instead, they must set the `entrypoint` in the running container to select a process type other than the default.

For Example:
`docker run --entrypoint web <image>`
`docker run --entrypoint /cnb/process/web <image>`
Will both launch the process with `type` `web`

Buildpack-contributed processes will be forbidden from having `type` equal to `"launcher"`.
If the platform configures the default process to `launcher` or `/cnb/lifecycle/launcher` during export the resulting image will not have a default process-type and instead will accept a [custom command](#specifying-a-custom-process-at-runtime) by default.

#### Specifying a custom process at runtime
If a user wishes to provide a custom command instead of using one of the buildpack provided process types, they must set the `entrypoint` to the vanilla `launcher`, rather than to process-type symlink. 

If the final path element of `$0` does not match any buildpack-provided process-type `launcher` will construct a process from the positional arguments it receives. If the first argument is `--` this will continue to signify a `direct` process. The first (when it is anything other than `--`) or second (if the first is `--`) argument provided to the `launcher`  will become the `command` of the resultant process. Any subsequent arguments to the launcher will become `args` of the resultant process.

Example:

Running `docker run --entrypoint launcher <image> echo hello world`, will be equivalent to running a process type where `direct = false`, `command = "echo"` and `args = ["hello", "world"]`

Running `docker run --entrypoint /cnb/lifecycle/launcher <image> -- echo hello world`, will be equivalent to running a process type where `direct = true`, `command = "echo"` and `args = ["hello", "world"]`

#### Providing additional arguments at runtime
If `entrypoint` is set to a process-type symlink, a buildpack-provided process will be selected by `type` and any arguments provided to the `launcher` will be appended to the process's predefined `args` array, before execution.

For example, given an image `<image>` containing the following buildpack-defined process
```
[[process]]
type = "hi"
command = "echo"
args = ["hello"]
```
if a user selects that process and passes an argument `world`
```
docker run --entrypoint hi <image> world
 ```
this will be functionally equivalent to running process the following process.
```
[[process]]
type = "hi"
command = "echo"
args = ["hello", "world"]
 ```

Launcher args are appended to the `args` array by default for both `direct` and shell processes.

#### Executing Shell Processes
When a shell process has arguments the launcher will produce behavior identical to that which would result from a user sourcing the profile scripts and then executing
`<CMD> <ARG1> <ARG2>...` in a shell inside the container.

#### Examples

> Aside: The following examples reference an image built to provide a proof of concept of the new launcher behavior. The POC is a work in progress and `ekcasey/petclinic:launcher-poc` may be updated over time as this RFC evolves or may be removed entirely. This document is the source of truth, rather than the image.

Case 1: Default process-type
```bash
docker run ekcasey/petclinic:launcher-poc
```
Case 2: Default process-type with additional args
```bash
docker run ekcasey/petclinic:launcher-poc --spring.profiles.active=mysql
```
Case 3: Non-default process-type
```bash
docker run --entrypoint executable-jar ekcasey/petclinic:launcher-poc
```
Case 4: Non-default process-type with additional args
```bash
docker run --entrypoint executable-jar ekcasey/petclinic:launcher-poc --spring.profiles.active=mysql
docker run --entrypoint executable-jar ekcasey/petclinic:launcher-poc --spring.profiles.active=$PROFILE # $PROFILE is evaluated on the host machine
docker run --entrypoint executable-jar ekcasey/petclinic:launcher-poc '--spring.profiles.active=$PROFILE' # $PROFILE is evaluated in the container after profile scripts are sourced
```
Case 5: User-provided shell process
```bash
docker run --entrypoint launcher -it ekcasey/petclinic:launcher-poc bash # profile scripts have been sourced and buildpack-provided env vars are set in this shell
docker run --entrypoint launcher ekcasey/petclinic:launcher-poc echo hello "$WORLD" # $WORLD is evaluated on the host machine
docker run --entrypoint launcher ekcasey/petclinic:launcher-poc echo hello '$WORLD' # $WORLD is evaluated in the container after profile scripts are sourced
```
Case 6: User-provided shell process with bash **script**
```bash
docker run --entrypoint launcher ekcasey/petclinic:launcher-poc 'for opt in $JAVA_OPTS; do echo $opt; done' # An entire script may be provided as a single argument
```
Case 7: User-provided **direct** process
```bash
docker run --entrypoint launcher ekcasey/petclinic:launcher-poc -- env # output will include buildpack-provided env vars
docker run --entrypoint launcher ekcasey/petclinic:launcher-poc -- echo hello "$WORLD" # $WORLD is evaluated on the host machine
docker run --entrypoint launcher ekcasey/petclinic:launcher-poc -- echo hello '$WORLD' # $WORLD is not evaluated, output will include string literal `$WORLD`
```
Case 8: No `launcher`
```bash
docker run --entrypoint bash -it ekcasey/petclinic:launcher-poc # profile scripts have NOT been sourced and buildpack-provided env vars are NOT set in this shell
```

# How it Works
[how-it-works]: #how-it-works

## Launcher Flow
The `launcher` currently has a three step command resolution flow:

1.  0 args: execute the default process type, where the default process type is `${CNB_PROCESS_TYPE:-web}`
1.  1 arg:  if `$1` matches a process type, execute that process type
1.  N args if `$1` is `--`: directly execute `$2` as the command with `${@:3}` as the arguments appended to that command
1.  N args: execute `$1` as the command with `${@:2}` as the arguments appended to that command in a `bash` shell

This proposal changes the command resolution flow to:

1.  If the last path element in `$0` matches a process-type
    1. 0 args: execute the matching process-type
    1. N args: Execute the matching process-type after appending `$@` (all positional arguments) to the process arguments
1.  Else
    1. 0 args: fail
    1.  N args if `$1` is `--`: directly execute `$2` as the command with `${@:3}` as the arguments appended to that command
    1.  N args: execute `$1` as the command with `${@:2}` as the arguments appended to that command in a `bash` shell

### Executing Shell Processes
Ensuring all arguments are tokenized and parsed correctly requires some `bash` complexity. When `direct=false` the launcher will do some magic along the lines of:
```
/bin/bash -c \
'source <app-dir>/.profile
source <layers>/<bp.id>/profile.d/<profile-script>
...
exec bash -c '$(eval echo \"$0\") ...$(eval echo \"$n\")' "$@"' /cnb/lifecycle/launcher <cmd> <args>...
```
This preserves the original tokenization and ensures variable references and other bash expressions (e.g. an arg containing the string `$JAVA_OPTS`) are evaluated by `bash` after the profile scripts have been sourced (given that profile scripts may modify relevant variables).

Although the launcher must carry the burden of this complexity, user will get intuitive results, and should not need to understand the mechanism.

## Backwards Compatibility

### Buildpacks
To take advantage of processes extension via user provided args, buildpacks will need to migrate shell processes from the current model (arguments embedded in the `command` string) to the new one (arguments provided in the `args` array).

To ease this transition, we can preserve the existing behavior in cases where there are no arguments provided by either the buildpack-contributed process definition or dynamically by the user. These processes will break if a user tries to supply additional arguments. However, it is already true that users cannot supply additional arguments to these processes, and therefore no functionality has been removed.

### Platforms
We can use `CNB_PLATFORM_API` (API "modes") to toggle between the current and new launcher process resolution flow. `CNB_PLATFORM_API` will be set in the exported image to the platform API provided at build time, but can be explicitly overridden at runtime.

The existing `launcher`  behavior wherein it accepts a single positional argument containing a process-types is currently unspecified and undocumented. Current usage of this feature is hard to measure but anecdotally appears to be uncommon.


Of the changes proposed in this RFC, changing the default interpretation of `launcher` arguments (from a custom command to additional arguments), will likely have the biggest impact on platforms. Platforms will need to make changes to runtime logic and/or documentation before enabling the platform API containing this change.

# Drawbacks
[drawbacks]: #drawbacks

* Breaking changes!
* Some functionality is only configurable by setting `entrypoint`. Previously, all functionality was available via `cmd`.
* Increased complexity of launcher shell logic.

# Alternatives
[alternatives]: #alternatives

Previously in Cloud Foundry which did not support a system like this, the solution that was chosen was to use an environment variable to represent arguments:

```
java -cp "${CLASSPATH}" ${JAVA_OPTS} org.springframework.boot.loader.JarLauncher "${ARGUMENTS}"
```

This led to lots of brittleness and confusion around the parsing of arguments as they passed through various parts the platform and was never widely adopted.  This proposal is vastly superior as it creates a direct connection between user input and the delimited arguments passed to the command that is eventually executed without the indirection and requirement of a shell to process them.

A previous iteration of this RFC provided an alternate method of distinguishing args from commands, using a path lookup. This launcher flow could be used instead of the current proposal with or without the shell process execution changes.
- see https://github.com/buildpacks/rfcs/blob/00013815ef66390be0b4a888a1f28fa903236237/text/0000-arguments.md for details

Special command line symbols could be used to disambiguate the meaning of subsequent `launcher` arguments (similar to how we use `--` to signify `direct=true`) 

# Prior Art
[prior-art]: #prior-art

See [Alternatives](#alternatives).

Multitudes of existing images that expect users to set `CMD` for the purpose of supplying additional arguments to the command defined in `ENTRYPOINT`

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

* Can we release these changes in minor API versions or should we hold it until `1.0`?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

There will be changes to the platform and buildpack specifications to match the result of this RFC.
