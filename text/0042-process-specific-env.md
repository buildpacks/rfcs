# Meta
[meta]: #meta
- Name: Process Specific Environment
- Start Date: 2020-04-03
- CNB Pull Request: (https://github.com/buildpacks/rfcs/pull/72)
- CNB Issue:
- Supersedes: N/A

# Summary
[summary]: #summary

Each process type could have its own independent environment variables.

# Motivation
[motivation]: #motivation

- Greater flexibility to define runtime processes
- When a new process type is created it often has different requirements for environment variables

One example is a buildpack requiring different `NODE_OPTIONS` for a `web` process and a `debug` process. This would allow a node buildpack author to write `<layer>/env.launch/debug/NODE_OPTIONS` with a value of `--inspect=0.0.0.0:9229` for `debug` while omitting the file entirely for `web`. While this is currently possible for the buildpack author when defining the launch processes, this change would also allow ad-hoc `launcher` commands to ignore `envs` intended for specific processes.

```
# defined processes
/cnb/lifecycle/launcher debug # NODE_OPTIONS=--inspect=0.0.0.0:9229
/cnb/lifecycle/launcher web # no NODE_OPTIONS defined

# ad-hoc
/cnb/lifecycle/launcher -- npm install # no NODE_OPTIONS defined
/cnb/lifecycle/launcher -- bash # no NODE_OPTIONS defined
```

`<layer>/profile.d/debug/debug.sh` would work similarly and be sourced by Bash before launching the `debug` command, but not when executing any other process.

# What it is
[what-it-is]: #what-it-is

Each env or profile layer dir can have subdirs like `<layer>/env.launch/web/` and `<layer>/profile.d/web/`. These behave the same way as `<layer>/env` but are specific to the launch of the `web` process.

# How it Works
[how-it-works]: #how-it-works

Lifecycle would use the identifier of the intended launch process to bring in additional `env` and `profile.d` files. The launcher would sort these process specific values _after_ less specific values to allow [Environment Variable Modification Rules](https://github.com/buildpacks/spec/blob/master/buildpack.md#environment-variable-modification-rules) to apply as expected. See Spec Changes below.

# Drawbacks
[drawbacks]: #drawbacks

- Additional complexity would be introduced into the launcher.
- Introducing process specific directory structure for `env` and `profile.d` but not `bin` and `lib`, for example, could be confusing for buildpack authors.

# Alternatives
[alternatives]: #alternatives

- Do Nothing. Buildpack authors can continue work around some of the restrictions today by embedding process specific `env` values into the launch processes instead of using the `env` directory.

# Prior Art
[prior-art]: #prior-art

- Copied from [here](https://github.com/buildpacks/rfcs/pull/72) and updated to include additional details and examples.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should this idea be extended to `bin`, `lib`, and any other buildpack output intended for launch?
- Should lifecycle ignore invalid entries like `<layers>/<layer>/env.build/web/NODE_OPTIONS`?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

[Original](https://github.com/buildpacks/spec/blob/master/buildpack.md#environment-variable-modification-rules)

#### Environment Variable Modification Rules

The lifecycle MUST consider the name of the environment variable to be the name of the file up to the first period (`.`) or to the end of the name if no periods are present.
In all cases, file contents MUST NOT be evaluated by a shell or otherwise modified before inclusion in environment variable values.

##### Delimiter

If the environment variable file name ends in `.delim`, then the file contents MUST be used to delimit any concatenation within the same layer involving that environment variable.
This delimiter MUST override the delimiters below.
If multiple operations apply to the same environment variable, all operations for a given layer containing environment variable files MUST be applied before subsequent layers are considered.

##### Prepend

If the environment variable file name has no period-delimited suffix, then the value of the environment variable MUST be a concatenation of the file contents and the contents of other files representing that environment variable delimited by the OS path list separator.
If the environment variable file name ends in `.prepend`, then the value of the environment variable MUST be a concatenation of the file contents and the contents of other files representing that environment variable.
In either case, within that environment variable value,
- Later buildpacks' environment variable file contents MUST precede earlier buildpacks' environment variable file contents.
- Environment variable file contents originating from the same buildpack MUST be sorted alphabetically descending by associated layer name.
- **Environment variable file contents originating in the same layer MUST be sorted such that file contents in `<layers>/<layer>/env.launch/<process>/` precede file contents in `<layers>/<layer>/env.launch/`, which must precede `<layers>/<layer>/env/`.**

##### Append

If the environment variable file name ends in `.append`, then the value of the environment variable MUST be a concatenation of the file contents and the contents of other files representing that environment variable.
Within that environment variable value,
- Earlier buildpacks' environment variable file contents MUST precede later buildpacks' environment variable file contents.
- Environment variable file contents originating from the same buildpack MUST be sorted alphabetically ascending by associated layer name.
- **Environment variable file contents originating in the same layer MUST be sorted such that file contents in `<layers>/<layer>/env/` precede file contents in `<layers>/<layer>/env.build/` or `<layers>/<layer>/env.launch/` which must precede file contents in `<layers>/<layer>/env.launch/<process>/`.**

##### Override

If the environment variable file name ends in `.override`, then the value of the environment variable MUST be the file contents.
For that environment variable value,
- Later buildpacks' environment variable file contents MUST override earlier buildpacks' environment variable file contents.
- For environment variable file contents originating from the same buildpack, file contents that are later (when sorted alphabetically ascending by associated layer name) MUST override file contents that are earlier.
- **Environment variable file contents originating in the same layer MUST be sorted such that file contents in `<layers>/<layer>/env.launch/<process>/` override file contents in `<layers>/<layer>/env.build/` or `<layers>/<layer>/env.launch/` which override file contents in `<layers>/<layer>/env/`.**

##### Default

If the environment variable file name ends in `.default`, then the value of the environment variable MUST only be the file contents if the environment variable is empty.
For that environment variable value,
- Earlier buildpacks' environment default variable file contents MUST override later buildpacks' environment variable file contents.
- For default environment variable file contents originating from the same buildpack, file contents that are earlier (when sorted alphabetically ascending by associated layer name) MUST override file contents that are later.
- **Default environment variable file contents originating in the same layer MUST be sorted such that file contents in `<layers>/<layer>/env/` override file contents in  `<layers>/<layer>/env.build/` or `<layers>/<layer>/env.launch/` which override file contents in `<layers>/<layer>/env.launch/<process>/`.**
