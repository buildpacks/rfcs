# Meta
[meta]: #meta
- Name: Pack Command to Create a Buildpack Repo
- Start Date: 2021-01-19
- Author(s): [jkutner](https://github.com/jkutner)
- RFC Pull Request: [rfcs#136](https://github.com/buildpacks/rfcs/pull/136)
- CNB Pull Request: (leave blank)
- CNB Issue: [buildpacks/pack#1025](https://github.com/buildpacks/pack/issues/1025)
- Supersedes: N/A

# Summary
[summary]: #summary

This is a proposal for a new command in Pack that would create the scaffolding for a new buildpack.

# Definitions
[definitions]: #definitions

- *Scaffold* - the essential files and directories required for a buildpack

# Motivation
[motivation]: #motivation

Every new buildpack requires a few essential files and directories. We can make buildpack development easier by automatically generating these with a single command.

# What it is
[what-it-is]: #what-it-is

Add a new command to Pack:

```
$ pack buildpack new <id> \
    --api <api> \
    --name <name> \
    --path <path> \
    --stack <stack> \
    --version <version>
```

Where the flags include:

* `api` - the buildpack API compatibility version
* `name` - the name of the buildpack in the `buildpack.toml`
* `path` - the location on the filesystem to generate the artifacts
* `stack` - a set of compatible stacks for the buildpack. may be specificied multiple times. (defaults to `io.buildpacks.stacks.bionic` because it is required)
* `version` - the version of the buildpack in `buildpack.toml` (defaults to `0.0.0` because it is required)

The command will create a directory named for the buildpack ID, or the second component of a `<namespace>/<name>` ID. Inside of that directory, it will generate the minimal artifacts required to implement a buildpack in Bash.

The `pack buildpack new` is only a generator. It will not be a _living command_ (i.e. you cannot re-run it to update a buildpack).

## Future Work

In the future, we may add support for a `--template` flag, which would create buildpacks from templates stored in a curated repository. In this way we can support many different languages, and even support versions the same language with different opinions.

# How it Works
[how-it-works]: #how-it-works

See https://github.com/buildpacks/pack/pull/1025

The only supported language will be Bash. This is based on [CNB user research](https://docs.google.com/document/d/1uNE8qkvhBCLIQUjIEbOTfT1epEt9_nHk_fNc64YPEvY/edit), which found:

> Comfort with Go is required to interpret buildpacks / paketo source code
> * We assume Go experience is not something we can expect our users to have

> Part of the reason developers take to docker easily is because the commands are similar to shell scripts
> * We assume shell scripts is what devs will be most comfortable with / wil analogize from

The generated files will include:


* `buildpack.toml`
* `bin/build`
* `bin/detect`

The `buildpack.toml` will be pre-poluated with the values provided in the CLI command and some defaults (like `0.0.0` for the version).

The `bin/` scripts will be made executable on Linux and MacOS platforms.

# Drawbacks
[drawbacks]: #drawbacks

* Might be too opinionated, especially in a compiled language, or a language that uses a library.

# Alternatives
[alternatives]: #alternatives

- Do it by hand
- A separate tool (not Pack) can create the scaffolding

# Prior Art
[prior-art]: #prior-art

- [paketo-bootstrapper](https://github.com/paketo-community/bootstrapper)
- [`rails new`](https://guides.rubyonrails.org/command_line.html)
- [`npm init`](https://docs.npmjs.com/cli/v6/commands/npm-init)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What language(s) would we support?
    - Golang
    - Bash
    - Python?
- Should we generate test stubs?
