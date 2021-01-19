# Meta
[meta]: #meta
- Name: Pack Command to Create a Buildpack Repo
- Start Date: 2021-01-19
- Author(s): [jkutner](https://github.com/jkutner)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This is a proposal for a new command in Pack that would create the scaffolding for a new buildpack.

# Definitions
[definitions]: #definitions

- *Scaffold* - the essential files and directory required for a buildpack

# Motivation
[motivation]: #motivation

Every new buildpack requires a few essential files and directories. We can make buildpack development easier by automatically generating these with a single command.

# What it is
[what-it-is]: #what-it-is

Add a new command to Pack:

```
$ pack buildpack create <id> \
    --language <lang> \
    --stack <stack>
```

# How it Works
[how-it-works]: #how-it-works

See https://github.com/buildpacks/pack/pull/1025

The default language will be Bash. This is based on [CNB user research](https://docs.google.com/document/d/1uNE8qkvhBCLIQUjIEbOTfT1epEt9_nHk_fNc64YPEvY/edit), which found:

> Comfort with Go is required to interpret buildpacks / paketo source code
> * We assume Go experience is not something we can expect our users to have

> Part of the reason developers take to docker easily is because the commands are similar to shell scripts
> * We assume shell scripts is what devs will be most comfortable with / wil analogize from

# Drawbacks
[drawbacks]: #drawbacks

* Might be too opinionated, especially in a compiled language, or a language that uses a library.

# Alternatives
[alternatives]: #alternatives

- Do it by hand
- A separate tool (no Pack) can create the scaffolding

# Prior Art
[prior-art]: #prior-art

- [`rails new`](https://guides.rubyonrails.org/command_line.html)
- [`npm init`](https://docs.npmjs.com/cli/v6/commands/npm-init)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What languages would we support?
    - Golang
    - Bash
    - Python?
