# Meta
[meta]: #meta
- Name: Remove Shell Processes
- Start Date: 2021-05-14
- Author(s): @ekcasey
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: [RFC 0045](https://github.com/buildpacks/rfcs/blob/main/text/0045-launcher-arguments.md)

# Summary
[summary]: #summary

This RFC proposes changes to the structure of a process type in order to make the interface more similar to k8s, docker and other familiar tools and simultaneously simplify the implementation.

# Definitions
[definitions]: #definitions

*process type*: A named process definition, contributed by a buildpack at build-time and executed by the launcher at run-time.

*direct process*: A process that is executed directly.

*shell process*: A process that is executed by a shell.

*script process*: A special type of shell process where there are zero `args` and `command` is a shell script.

*build-provided profiles scripts*: Profile scripts that are provided by buildpacks at build-time. When the launcher executes a shell process these scripts will be sourced in the shell, prior to process execution.

*user-provided profile script*: A profile scripts that is provided by the user in the app root of the app dir. When the launcher executes a shell process this script will be sourced in the shell, after buildpack-provided profile scripts and prior to process execution.

# Motivation
[motivation]: #motivation

This RFC aims to:
1. Reduce **complexity** in the CNB Specification
2. Enable new **use cases** by supporting overridable arguments
3. Improve **interoperability** between buildpacks and minimal or distroless stacks

We will achieve these goals be addressing the following problems with our current process type model:

## Argument Handling

In [RFC 0045](https://github.com/buildpacks/rfcs/blob/main/text/0045-launcher-arguments.md) we introduced a change to the launcher interface that allows users to append additional arguments to a process type at runtime. This was a major improvement to the runtime interface for app images, as users no longer needed to respecify the entire command in order to append a single argument. However, in the Launcher Arguments proposal we made two mistakes:
1. **complexity** - We tried to be clever and support appending argument appending to shell processes. This "works" but can result in surprising behavior such as the need to escape literal `"` characters to prevent Bash from removing them during evaluation. Users must know whether the process is a direct process or a shell process in order to provide arguments correctly, making process types a leaky abstraction.
2. **use cases** - Arguments can serve two different purposes. Some are required and should always be included in the command. Some are merely defaults that may be overridden by the user. The current spec does not support the latter case.

## Shell-Specific Logic

**interoperability** - Currently, unless a buildpack author specifically indicates that the given process type is a `direct` process, a shell process with a dependency on Bash (linux) or Cmd (windows) is created. This is not ideal, as many in the industry are moving towards minimal images that do not include a shell, in order to reduce surface attack area. Buildpack authors may inadvertantly create process types that depend on a shell even when no such dependency is necessary.

**complexity** - Having a direct dependency between the launcher and specific shells is inelegant. It makes the spec more complex and end users and buildpack author are forced to understand that complexity in order to understand the behavior of the resulting usage or debug issues. For example end users and buildpacks authors must understand:
- The difference between a direct and shell process
- The nuances of argument handling in direct vs. Bash vs. Cmd cases
- That buildpack-provided profile scripts will not apply to direct processes
- That a user-provided `.profile` script will not apply to a direct processes

 Removing this special behavior and requiring buildpacks to explicitly include any required shell in the command itself creates a simpler, more comprehensible model for buildpack authors and end users alike.

# What it is
[what-it-is]: #what-it-is

## Process Schema
The existing schema for the processes table in `launch.toml` is
```
# Old Schema

[[processes]]
type = "required"
command = "required"
args = ["optional"]
direct = false
default = false
```

The new proposed schema is:
```
# New Schema

[[processes]]
type = "required"
command = ["required"]
args = ["optional"]
default = false
```
The following changes have been made:
- **`direct` has been removed** - all processes are executed directly. If `bash` or `cmd.exe` is required it should be included in `command`. No surprises.
- **`command` is now an array** - Arguments in `command` *will not* be overwritten if a user provides additional arguments at runtime. `args` are default arguments that *will* be overwritten if a user provides additional arguments at runtime. The makes `command` analogous to `Entrypoint` in the OCI spec and `command` in a Kubernetes PodSpec. `args` is analogous to `cmd` and `args` in docker and Kubernetes respectively.

## Using Environment Variables in a Process

One upside to our previous execution strategy was that it enable users to include environment variable references in arguments that were later evaluated in the container. To preserve this feature we can instead adopt a variation on the Kubernetes strategy for [environment variables interpolation](https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/#using-environment-variables-inside-of-your-config). If a buildpack or user includes `${<env>}` in the `command` or `args` and `{env}` is the name of an environment variable set in the launch environment, the launcher will replace this string with the value of the environment variable after apply buildpack-provided env modifications and before launching the process.


# How it Works
[how-it-works]: #how-it-works

## Buildpack-provided process types
### Example 1 - A Shell Process
The Paketo .Net Execute Buildpack may generates shell processes similar to the following:
```
[[processes]]
type = "web"
command = "dotnet my-app.dll --url http://0.0.0.0:${PORT:-8080}"
direct = false
```
NOTE: the buildpack API used by this buildpack (`0.5`) predates the introduction of `default`.

Using the new API this process could look like:
```
[[processes]]
type = "web"
command = ["dotnet", "my-app.dll", "--urls", "http://0.0.0.0:${PORT}"] # the default value of PORT would need to be provided in a layer
default = true
```
Things to note:
* In the above example I have eliminated the dependency on Bash instead of explicitly adding it to the command, because it is likely unnecessary.
* If the buildpack authors believed that `--urls` should be overridable they could set move the last two arguments from `command` to `args`.

### Example 2 - A Script Process
When a buildpack upgrade to the new buildpack API, it must convert any existing shell processes into direct processes.

The [Paketo Yarn Start Buildpack](https://github.com/paketo-buildpacks/yarn-start) currently may generate a script processes similar to the following:

```
[[processes]]
type = "web"
command = "pre-start.sh && nodejs server.js && post-start.sh"
direct = false
default = false
```

Using the new API this process look like:
```
[[processes]]
type = "web"
command = ["bash", "-c", "pre-start.sh && nodejs server.js && post-start.sh"]
default = false
```

## User Provided Processes

Currently if the user can specify a custom process dynamically at runtime by setting the container entrypoint to `launcher` directly rather than using a symlink to the launcher, the providing a custom `cmd`. This custom command is executed directly if `cmd` is an array and the first element is `--`. Otherwise the custom command is assumed to be a shell process. In the interest of removing complexity we should do away with the special `--` argument and execute all custom commands directly. 

### Example 1 - A Direct process
The follow direct commands:
```
docker run --entrypoint launcher <image> -- env
docker run --entrypoint launcher <image> -- echo hello '$WORLD' 
```
will become the following, using the new platform API
```
docker run --entrypoint launcher <image> env
docker run --entrypoint launcher <image> echo hello '${WORLD}'
```
Previously, in the second command in this example `${WORLD}` would not have been interpolated because this is a direct process; instead the output would include the literal string `$WORLD`. With the changes proposed, `${WORLD}` will now be evaluated, even though the process is direct.

### Example 2 - A Shell Process
The follow custom shell command:
```
docker run --entrypoint launcher <image> echo hello '${WORLD}'
docker run --entrypoint launcher <image> echo hello '${WORLD:-world}'
```
will become the following, using the new platform API
```
docker run --entrypoint launcher <image> echo hello '${WORLD}'
docker run --entrypoint launcher <image> bash -c 'echo hello "${WORLD:-world}"'
```
The first command in this example did not need to change to behave as expected with the new API. Previously it was necessary to use a shell process in order to evaluate `${WORLD}`. Now, the shell is unnescessary. However, if the user wants to use more features of Bash interpolation they will need to explicitly invoke a shell, as shown in the second command in this example.

### Example 3 - A Script Process
The follow custom script command:
```
docker run --entrypoint launcher <image> 'for opt in $JAVA_OPTS; do echo $opt; done'
```
will become the following, using the new platform API
```
docker run --entrypoint launcher <image> bash -c 'for opt in $JAVA_OPTS; do echo $opt; done'
```

## What About Profile Scripts?

### `<layer>/profile.d/*`
When a buildpack upgrades to the new buildpack API, buildpack-provided profile scripts will no longer be supported. Instead buildpacks can use `exec.d`. Most existing profiles scripts can be easily converted.

**Example 1: `jkutner/sshd` **

The following profile script example was taken from https://github.com/jkutner/sshd-buildpack/blob/master/sbin/sshd.sh
```
#!/usr/bin/env bash

if [[ "${SSH_DISABLED:-}" != "true" ]]; then
  ssh_layer=$(realpath $(dirname ${BASH_SOURCE[0]})/..)
  ssh_dir=$(realpath $HOME/.ssh)

  mkdir -p $ssh_dir
  cat $ssh_layer/id_rsa.pub >> $ssh_dir/authorized_keys

  cat << EOF >> $ssh_dir/sshd_config
HostKey $ssh_layer/id_rsa
AuthorizedKeysFile $ssh_dir/authorized_keys
EOF

  chmod 600 /workspace/.ssh/*

  ssh_port=${SSH_PORT:-"2222"}
  echo "at=sshd state=starting user=$(whoami) port=${ssh_port}"
  /usr/sbin/sshd -f $ssh_dir/sshd_config -o "Port ${ssh_port}"
fi
```
This script does not require any changes and would work as an `exec.d` helper. To implement the new buildpack API the buildpack author would have to:
* Move the above script from `<layer>/profile.d/sshd` to `<layer>/exec.d/sshd`.
* Ensure script is executable by run-image user (if it isn't already).

**Example 2: paketo-buildpacks/node-engine **

The following profile script example was taken from https://github.com/paketo-buildpacks/node-engine/blob/main/environment.go
```
if [[ -z "$MEMORY_AVAILABLE" ]]; then
		memory_in_bytes="$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes)"
		MEMORY_AVAILABLE="$(( $memory_in_bytes / ( 1024 * 1024 ) ))"
fi
export MEMORY_AVAILABLE
```

The following revised version of this script would implement the `exec.d` interface
```
if [[ -z "$MEMORY_AVAILABLE" ]]; then
		memory_in_bytes="$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes)"
		MEMORY_AVAILABLE="$(( $memory_in_bytes / ( 1024 * 1024 ) ))"
fi

cat << EOF >&3
MEMORY_AVAILABLE = "${MEMORY_AVAILABLE}" 
EOF
```

### `<app>/.profile`

When a platform upgrades to the new platform API, user-provided profile scripts will no longer be supported. A buildpack could provide an identical or similar interface by detecting a `.profile` file in the app dir, wrapping it so that it implements the `exec.d` interface and add creating an executable with that layer. A platform that wishes to always provide that functionality could add a buildpack like this to every build. By making dynamic runtime environment modification a buildpack concern and not duplicating similar behavior in the platform API, we reduce the surface area and complexity of the platform API and thus improve normalization of the spec.

## API compat

### Overriding Args for Shell Processes
We should convert args in `launch.toml` to `command` in `metadata.toml` to expose a consistent interface to users. For example, if a buildpack the following process type in `launch.toml` 
```
[[process]]
type = "hi"
command = "echo"
args = ["hello", "world"]
direct = true
```

we would convert it to the following in `metadata.toml`
```
[[process]]
type = "hi"
command = ["echo", "hello", "world"]
args = []
api = "0.5"
direct = true
```
This spares users from having to learn about the differences between buildpack APIs in order to predict how additional arguments will behave.

### Evaluating Args

For shell processes provided by older buildpacks, we must continue to Bash evaluate buildpack-provided args to avoid breaking older buildpacks

For example, if a buildpack using API `0.5` creates the following entry in `launch.toml`
```
[[process]]
type = "hi"
command = "echo"
args = ["hello", "${WORLD:-world}"]
```

It should be converted to the following in `metadata.toml`

```
[[process]]
type = "hi"
command = ["echo", "hello", "${WORLD:-world}"]
args = []
api = "0.5"
direct = false
```

and the launcher should Bash evaluate each entry in `command` to avoid breaking changes.

However, any additional user-provided args should NOT be Bash evaluated to reduce the amount of complexity exposed to end users.

### profiles
Profiles contributed by older buildpacks will still be evaluated when executing shell process types. But user provided profiles will not be evaluated when using the new platform API, even when a shell process is executed. Again, this is done to prevent differences between the buildpack APIs from leaking into the user interface. Users will only need think about differences between platform APIs.

# Drawbacks
[drawbacks]: #drawbacks

In exchange for a reduction in complexity and cognitive overhead buildpack-authors and end users lose certain conveniences like the more intuitive profile interface. This drawback could be remediated by tooling for buildpack authors (to make creation of `exec.d` helpers easy) or by buildpacks (to support `.profile`). However, in the `.profile` case, consistency across ecosystems will be a matter of convention (like Procfile) rather than a guarantee.

# Alternatives
[alternatives]: #alternatives

## `$(<env>)` syntax

We could use `$(<env>)` for environment variable replacements instead of `${<env>}`. Currently, Kubernetes only replaces `$(FOO)` if `FOO` matches the name of an environment variable defined in the `env` section of the PodSpec, otherwise `$(FOO)` is passed through literally. The would allow the launcher to pick up where kubernetes leaves off and evaluate any remaining references.
pros:
* Users can continue to use a syntax they are already familiar with
cons:
* User provided variables may be evaluated too soon, before buildpack modifications are applied.

## Lifecycle support for `<app>/.exec`
When we remove support for `<app>/.profile` we could add support for `<app>/.exec` or similar where `<app>/.exec` must implement the `exec.d` interface.
pros:
* Users may still dynamically modify the runtime environment without requiring a specific buildpack
cons:
* The exec.d interface must be duplicated in both the buildpack and platform API
* If we modify the interface the same app might behave differently or fail to run on specific platforms depending on which version of the platform API they are using
* Users must directly implement our less-than-perfectly-intuitive exec.d interfaces instead of whatever better UX buildpack authors invent.

## Lifecycle support for `<app>.profile`
We could consider having the lifecycle convert `<app>/.profile` files into exec.d  
If we do not remove shell logic from the spec, users will continue to find the launcher behavior vexingly complex. Also, there will be no sane path forward for supporting overridable arguments.
pros:
* Fewer breaking changes
* More consistency behavior across platforms/builders
cons:
* complexity in the launcher
* launcher behavior that fails on certain stacks
* undesirable coupling between the lifecycle and specific shells

## API compat strategy - Explicit Bash Evaluation
When adding legacy shell processes to `metadata.toml` we could replace the "direct=false" command with the literal command that will be evaluated.
For example the following script process in `launch.toml`
```
[[process]]
type = "hi"
command = "echo hello "${WORLD:-world}"
direct = false
```
Could become the following in `metadata.toml`
```
[[process]]
type = "hi"
command = ["bash", "-c", 'echo hello "${WORLD:-world}"']
direct = true # we could even potentially remove this from the metadata.toml schema entirely
```

However, things get very complicated if we explicitly source profiles or shell evaluated args in `command`. The complexity of the resulting commands probably makes this strategy untenable.

# Prior Art
[prior-art]: #prior-art

The Paketo Java buildpacks have already converted an extensive collection of profile script to exec.d binaries and converted all processes to direct processes in order to support minimal stacks like `io.paketo.stacks.tiny` and to provide users with more intuitive argument handling.

The Procfile interface is supported by Paketo, Heroku, and Google buildpacks, demonstrating that it is possible to have a consistent interface across buildpack ecosystems without building direct support for that interface in the lifecycle. 

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

Should the buildpacks project provide buildpacks for things like user provided profile scripts to make consistency easy?

Do we need to provide a mechanism for turning `${env}` interpolation off? E.g.
```
docker run --env "CNB_INTERPOLATE=false" --entrypoint launcher <image> echo hello '${WORLD}' # prints "hello '${WORLD}'"
```


# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

## Platform API
The launcher usage will change to the following.
```
/cnb/process/<process-type> [<arg>...]
# OR
/cnb/lifecycle/launcher [<cmd>...]
```
All references to `<direct>` will be removed from the usage.

Execution rules will become simpler. This following is a draft to convey the idea, not the final wording (which wil need some wordsmithing):

The launcher:
- MUST derive the command to execute values of `<cmd>` and `<args>` as follows:
  - **If** the final path element in `$0`, matches the type of any buildpack-provided `<process-type>`
    - `<cmd>` SHALL be the `<command>` defined for `<process-type>` in `<layers>/config/metadata.toml`
    - **If** the user has provided `<args>` to the launcher 
        - `<args>` SHALL be the user-provided `<args>`
    - **If** the user has not provided `<args>` to the launcher
        - `<args>` SHALL be the `<args>` defined for `<process-type>` in `<layers>/config/metadata.toml`
  - **Else** `<cmd>` shall be the user provided `<cmd>`
        

## Buildpack API

All references to `Bash`, `Command Prompt`, `profile.d`, and `<app>/.profile` will be removed the launch section of the buildpack spec, significantly reducing the complexity of the specification.

The launch.toml data format will change to include the following:
```
[[processes]]
type = "<process type>"
command = ["<command>"]
args = ["<arguments>"]
default = false
```
