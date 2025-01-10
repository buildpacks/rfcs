# Meta
[meta]: #meta
- Name: Flexible Process Types
- Start Date: 2025-01-07
- Author(s): dmikusa
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

Presently a Buildpacks can add process types, but there is no way to coordinate across Buildpacks about process types.

For example, if I have a Time Buildpacks that wants to add the `time` command to the beginning of every process type's start command so that we can see `time` info for the commands run, that is not presently possible unless you modify the Buildpacks that generate the original process types to include this information.

# Definitions
[definitions]: #definitions

**Process Type** - A process definition set by a buildpack in [`launch.toml`](https://github.com/buildpacks/spec/blob/main/buildpack.md#launchtoml-toml)

# Motivation
[motivation]: #motivation

- Make process types more flexible. 
- Support the use case where a buildpack wants to wrap another buildpack's process type's command
- Support the use case where a buildpack wants to modify the arguments of another buildpack's process type

# What it is
[what-it-is]: #what-it-is

Presently, a buildpack can define a process type in `launch.toml` like this:

```
[[processes]]
type = "web"
command = ["my-app"]
args = ["arg1", "arg2"]
default = false
working-dir = "/workspace"
```

It is not presently possible for a different buildpack that runs subsequently to modify this process type definition.

As described in the Motivation section, there are cases where this would be helpful and this RFC aims to make this both possible buildpack authors and safe for buildpack users.

The proposal is that any subsequent buildpack can modify a previous buildpacks' process types by defining a process in `launch.toml` with the same type and a transform section that defines the changes to be made. This will allow the subsequent buildpack to change the command, args, working directory, and indicate a reason for the change.

Because a subsequent buildpack does not know what a previous buildpack has defined for the command, args, and working directory the following place holders may be used to reference those values:

- `$ORIGINAL_CMD` - the original command as a list, fits into a TOML list
- `$ORIGINAL_CMD_STRING` - the original command as a string, space separated
- `$ORIGINAL_ARGS` - the original arguments as a list, fits into a TOML list
- `$ORIGINAL_ARGS_STRING` - the original arguments as a string, space separated
- `$ORIGINAL_WORKING_DIR` - the original working directory

While these place holders allow a subsequent buildpack to generate a modified version of a command based on the original, the subsequent buildpack cannot see the original command at build time. The reason is simply to limit the scope of this RFC and reduce complexity in the implementation (see Alternatives for more details).

The modification of process types will be performed by the lifecycle when it is convenient for the lifecycle. The lifecycle should ensure that any process type changes are prominently logged, including what changed, who changed it, and the reason if provided.

# How it Works
[how-it-works]: #how-it-works

Buildpack A runs and defines the following processes in `launch.toml`.

```
[[processes]]
type = "web"
command = ["my-app"]
args = ["arg1", "arg2"]
default = true
working-dir = "/workspace"

[[processes]]
type = "task"
command = ["my-task"]
args = ["arg1"]
default = false
working-dir = "/workspace"

[[processes]]
type = "migration"
command = ["ruby", "migration.rb"]
args = ["run"]
default = false
working-dir = "/workspace"
```

Buildpack B runs and wants to modify the previously defined tasks.

1. It wants to add arguments to the web task, so it writes:

    ```
    [[processes]]
    type = "web" # reference original process type

    [processes.transform]
    args = [$ORIGINAL_ARGS, "--production"]
    reason = "adding additional arguments"
    ```

    This would result in the following process type being defined on the container image (represented in TOML):

    ```
    [[processes]]
    type = "web"
    command = ["my-app"]
    args = ["arg1", "arg2", "--production"]
    default = true
    working-dir = "/workspace"
    ```

    Notice how `$ORIGINAL_ARGS` is treated as a list of the original arguments and is automatically expanded into args. It is like writing `["arg1", "arg2", "--production"]`. This is opposed to `$ORIGINAL_ARGS_STRING`, which would not be expanded and is like writing `["arg1 args", "--production"]`.

2. It wants to wrap the task process type with `time` so we can track how long the task takes to run.

    ```
    [[processes]]
    type = "task" # reference original process type

    [processes.transform]
    command = ["time", $ORIGINAL_CMD]
    reason = "Wrapping start command to log time spent"
    ```

    This would result in the following process type being defined on the container image (represented in TOML):

    ```
    [[processes]]
    type = "task"
    command = ["time", "my-task"]
    args = ["arg1"]
    default = false
    working-dir = "/workspace"
    ```

    Notice how `$ORIGINAL_CMD` is treated as a list of the original command and is automatically expanded into command. It is like writing `["time", "my-task"]`. This is opposed to `$ORIGINAL_CMD_STRING`, which would not be expanded and is just the space separate string of all the items in command.

3. It wants to wrap the migration process type and run it in a bash shell.

    ```
    [[processes]]
    type = "migration" # reference original process type

    [processes.transform]
    command = ["bash", "-c '$ORIGINAL_CMD_STRING'"]
    reason = "Wrapping to run through Bash"
    ```

    This would result in the following process type being defined on the container image (represented in TOML):

    ```
    [[processes]]
    type = "migration"
    command = ["bash", "-c 'ruby migration.rb'"]
    args = ["run"]
    default = false
    working-dir = "/workspace"
    ```

    Notice how `$ORIGINAL_CMD_STRING` is used here to get the original command as a space separated string, which is necessary to embed it in the argument to `bash`.

# Migration
[migration]: #migration

The changes required to the specification would be additive, so it should not create any migration issues or broken APIs.

# Drawbacks
[drawbacks]: #drawbacks

This should not add complexity, unless buildpack authors require this functionality. In other words, nothing changes unless you opt-in to using this functionality.

This would create an additional avenue for a nafarious buildpack to do bad things. For example, a subsequent buildpack could be inserted that runs and modifies a process type to do something nafarious. This isn't a new risk though. There are many nafarious things a buildpack inserted like this could do. For example, it could simply overwrite the previously defined process type or inject code into something that's already being run by the previous buildpack.

# Alternatives
[alternatives]: #alternatives

There are other ways that we could possibly implement this.

- We could allow buildpacks to see the `launch.toml` file of previous buildpacks, perhaps by exposing the location to subsequent buildpacks. Those buildpacks could modify `launch.toml` for the other buildpacks directly.
    - This is harder for the lifecycle to manage as it would have to detect if/when a buildpack modified `launch.toml`, minimally to log that it has happened, so this approach might complicate the implementation.
    - It is also tricker for buildpacks to implement as they need to both locate, parse and modifiy these other files.
    - Typically, we don't advise one buildpack modifying another buildpack's files. Promoting this method would go against that long standing advise.
- We could mix the previous approach and the propose approach to provide subsequent buildpacks with the actual commands/args/working directory of previously defined process types. Buildpacks wishing to modify a process type, could retrieve the previously defined process type information (R/O) location and read it. Then use the methods proposed in this buildpack to define how they would like to augment the commands.
    - This would be more complicated to implement as we'd need to define both a way to pass in the previous process type information. It's unclear if the additional complexity is needed. i.e. do buildpack authors need to be able to see the commmands/args/working directory set previously.
    - I don't believe there's a way we can force the previously defined process types as being read-only. There is some protection by obscurity at the moment, if we point a subsequent buildpack to the `launch.toml` files of previous buildpacks, we're removing that obscurity and making it easier for someone to just modify those files directly. We could possibly retain this by passing copies of those files to subsequent buildpacks though.
    - If all  buildpack authors want is to wrap a command or append arguments, this implementation creates more work for them. They need to read the previous commands, augment, and then write out the changes, as opposed to using some handy place holders. 

# Prior Art
[prior-art]: #prior-art

This topic has been discussed previously, but no formal RFC was written up. See [here](https://cloud-native.slack.com/archives/C0331B5QS02/p1734193643763589) for the most recent discussion thread.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Are there missing use cases for what a buildpack might want to do to transform a process type?
- Should we allow modification of the `default` property on a process type? 
- Do buildpack authors need to see the actual data of the process type that was previously defined? or are placeholders sufficient?
- Does this introduce any new security concerns?
- Which exact syntax to do people like for specifying these in `launch.toml`?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

This RFC would require changes to `launch.toml`. Entries in the `[[processes]]` block could now have a property `transform` that has the properties `command`, `args`, `working-dir`, and `reason`. All of the properties in `transform` are optional.

For example:

```
[[processes]]
type = "task"

[processes.transform]
command = ["time", $ORIGINAL_CMD]
args = ["more", "args"]
working-dir = "/somewhere-else"
reason = "Reason for transformation"
```

When `transform` is present, the `command`, `default`, `args`, and `working-dir` properties on the process itself should not be set, just the `type`.

An alternate syntax for this could be to include a `transform` property that is a bool, defaulting to `false`. When `true`, that would initiate the transformation behavior.

For example:

```
[[processes]]
type = "task"
transform = true
command = ["time", $ORIGINAL_CMD]
args = ["more", "args"]
working-dir = "/somewhere-else"
```

This would result in the same transformation as the other two examples.

This alternative syntax is a bit more compact and may deserialize a bit easier into Go structs as it would not require a nested struct.

One more alternate format would be to not change the `[[processes]]` block but to just add a `[[transforms]]` block. The transforms block would be the same as `[[processes]]` except it would defined transformations (which have all the same properties, except transformations do not have the `default` property).

For example:

```
[[transforms]]
type = "task"
command = ["time", $ORIGINAL_CMD]
args = ["more", "args"]
working-dir = "/somewhere-else"
```

This would result in the same transformation as the other two examples.

# History
[history]: #history

None